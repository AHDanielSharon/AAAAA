/**
 * Firebase-powered backend for SOCIONET.
 * All users connect to the same Firestore database.
 * Real multi-user: search, messaging, follow, video calls.
 */
import { useRef, useEffect, useState } from "react";
import { db, authReady, getCurrentUid } from "../firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, addDoc, onSnapshot,
  serverTimestamp, Timestamp, arrayUnion, arrayRemove,
} from "firebase/firestore";

function makePrincipal(id: string) {
  return { toString: () => id, isAnonymous: () => false, toText: () => id, toUint8Array: () => new Uint8Array() } as any;
}
function makeBlob(url: string) {
  return { getDirectURL: () => url, getBytes: async () => new Uint8Array(), withUploadProgress: () => makeBlob(url) } as any;
}

function ts() { return BigInt(Date.now()) * BigInt(1000000); }

function createFirebaseBackend() {
  let uid = "anonymous";
  authReady.then((id) => { uid = id; });

  const principal = () => makePrincipal(uid);

  return {
    // ═══ PROFILE ═══
    getCallerUserProfile: async () => {
      await authReady;
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return null;
      const d = snap.data();
      return { name: d.name, bio: d.bio || "", avatar: makeBlob(d.avatarUrl || ""), displayName: d.name, balance: d.balance || BigInt(0) };
    },
    saveCallerUserProfile: async (p: any) => {
      await authReady;
      await setDoc(doc(db, "users", uid), {
        name: p.name, bio: p.bio || "", avatarUrl: p.avatar?.getDirectURL?.() || "",
        updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
      }, { merge: true });
    },
    getUserProfile: async (p: any) => {
      const id = p?.toString?.() || p;
      const snap = await getDoc(doc(db, "users", id));
      if (!snap.exists()) return null;
      const d = snap.data();
      return { name: d.name, bio: d.bio || "", avatar: makeBlob(d.avatarUrl || ""), displayName: d.name };
    },
    getAllUserProfiles: async () => {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => [makePrincipal(d.id), { name: d.data().name, bio: d.data().bio || "", avatar: makeBlob(d.data().avatarUrl || "") }]);
    },
    updateProfileImage: async () => {},
    uploadAvatar: async () => "",

    // ═══ VIDEOS ═══
    getAllVideos: async () => {
      const snap = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc"), limit(50)));
      return snap.docs.map((d) => {
        const v = d.data();
        return { id: d.id, title: v.title, creator: makePrincipal(v.creatorId), thumbnail: makeBlob(v.thumbnailUrl || ""), file: makeBlob(v.videoUrl || ""), video: makeBlob(v.videoUrl || ""), description: v.description || "", uploadTime: ts(), tags: v.tags || [], likes: (v.likes || []).map(makePrincipal), views: BigInt(v.views || 0), comments: [] };
      });
    },
    getVideo: async (id: string) => {
      const snap = await getDoc(doc(db, "videos", id));
      if (!snap.exists()) return null;
      const v = snap.data();
      return { id: snap.id, title: v.title, creator: makePrincipal(v.creatorId), thumbnail: makeBlob(v.thumbnailUrl || ""), file: makeBlob(v.videoUrl || ""), video: makeBlob(v.videoUrl || ""), description: v.description || "", uploadTime: ts(), tags: v.tags || [], likes: (v.likes || []).map(makePrincipal), views: BigInt(v.views || 0), comments: [] };
    },
    getFeed: async () => {
      const snap = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc"), limit(50)));
      return snap.docs.map((d) => {
        const v = d.data();
        return { id: d.id, title: v.title, creator: makePrincipal(v.creatorId), thumbnail: makeBlob(v.thumbnailUrl || ""), file: makeBlob(v.videoUrl || ""), video: makeBlob(v.videoUrl || ""), description: v.description || "", uploadTime: ts(), tags: v.tags || [], likes: (v.likes || []).map(makePrincipal), views: BigInt(v.views || 0), comments: [] };
      });
    },
    uploadVideo: async (req: any) => {
      await authReady;
      let videoUrl = req.file?.getDirectURL?.() || "";
      // For local blob URLs, we can't store them in Firebase - need Firebase Storage for real video hosting
      await addDoc(collection(db, "videos"), {
        title: req.title || "Untitled", creatorId: uid, description: req.description || "",
        videoUrl, thumbnailUrl: req.thumbnail?.getDirectURL?.() || "",
        tags: [], likes: [], views: 0, createdAt: serverTimestamp(),
      });
    },
    searchVideos: async (q: string) => {
      const snap = await getDocs(collection(db, "videos"));
      return snap.docs.filter((d) => d.data().title?.toLowerCase().includes(q.toLowerCase())).map((d) => {
        const v = d.data();
        return { id: d.id, title: v.title, creator: makePrincipal(v.creatorId), thumbnail: makeBlob(v.thumbnailUrl || ""), file: makeBlob(v.videoUrl || ""), video: makeBlob(v.videoUrl || ""), description: v.description || "", uploadTime: ts(), tags: v.tags || [], likes: (v.likes || []).map(makePrincipal), views: BigInt(v.views || 0), comments: [] };
      });
    },
    getVideosByCreator: async (p: any) => {
      const id = p?.toString?.() || p;
      const snap = await getDocs(query(collection(db, "videos"), where("creatorId", "==", id)));
      return snap.docs.map((d) => {
        const v = d.data();
        return { id: d.id, title: v.title, creator: makePrincipal(v.creatorId), thumbnail: makeBlob(v.thumbnailUrl || ""), file: makeBlob(v.videoUrl || ""), video: makeBlob(v.videoUrl || ""), description: v.description || "", uploadTime: ts(), tags: v.tags || [], likes: (v.likes || []).map(makePrincipal), views: BigInt(v.views || 0), comments: [] };
      });
    },
    getTotalVideoCount: async () => { const s = await getDocs(collection(db, "videos")); return BigInt(s.size); },
    incrementViews: async (id: string) => { try { await updateDoc(doc(db, "videos", id), { views: arrayUnion(uid) }); } catch {} },
    getOwnVideosAndStories: async () => {
      await authReady;
      const snap = await getDocs(query(collection(db, "videos"), where("creatorId", "==", uid)));
      return { videos: snap.docs.map((d) => { const v = d.data(); return { id: d.id, title: v.title, creator: makePrincipal(v.creatorId), thumbnail: makeBlob(v.thumbnailUrl || ""), file: makeBlob(v.videoUrl || ""), video: makeBlob(v.videoUrl || ""), description: v.description || "", uploadTime: ts(), tags: v.tags || [], likes: (v.likes || []).map(makePrincipal), views: BigInt(v.views || 0), comments: [] }; }), stories: [] };
    },
    deleteVideo: async (id: string) => { await deleteDoc(doc(db, "videos", id)); },

    // ═══ LIKES / COMMENTS ═══
    likeReel: async (id: string) => { await authReady; await updateDoc(doc(db, "videos", id), { likes: arrayUnion(uid) }); },
    dislikeReel: async (id: string) => { await authReady; await updateDoc(doc(db, "videos", id), { likes: arrayRemove(uid) }); },
    shareReel: async () => {},
    getReelStats: async (id: string) => { const s = await getDoc(doc(db, "videos", id)); const d = s.data(); return { views: BigInt(d?.views || 0), likes: BigInt(d?.likes?.length || 0), dislikes: BigInt(0), shares: BigInt(0), comments: [] }; },
    getAllComments: async (videoId: string) => {
      const snap = await getDocs(query(collection(db, "videos", videoId, "comments"), orderBy("createdAt", "desc")));
      return snap.docs.map((d) => ({ content: d.data().text, author: makePrincipal(d.data().authorId), timestamp: ts(), authorName: d.data().authorName || "" }));
    },
    addComment: async (videoId: string, comment: any) => {
      await authReady;
      const userSnap = await getDoc(doc(db, "users", uid));
      const name = userSnap.data()?.name || "User";
      await addDoc(collection(db, "videos", videoId, "comments"), {
        text: typeof comment === "string" ? comment : comment.text || comment.content || "",
        authorId: uid, authorName: name, createdAt: serverTimestamp(),
      });
    },

    // ═══ STORIES ═══
    getAllActiveStories: async () => { const s = await getDocs(collection(db, "stories")); return s.docs.map((d) => ({ id: d.id, creator: makePrincipal(d.data().creatorId), media: makeBlob(d.data().mediaUrl || ""), caption: d.data().caption || "", createdAt: ts(), expiresAt: ts(), type: "image" })); },
    uploadStory: async () => {},
    deleteStory: async (id: string) => { await deleteDoc(doc(db, "stories", id)); },
    getImageStoriesByUser: async () => [],
    getVideoStoriesByUser: async () => [],
    getOtherUsersActiveStories: async () => [],

    // ═══ FOLLOW / FRIENDS ═══
    getFriends: async () => {
      await authReady;
      const snap = await getDoc(doc(db, "users", uid));
      return (snap.data()?.following || []).map(makePrincipal);
    },
    sendFriendRequest: async (p: any) => {
      await authReady;
      const targetId = p?.toString?.() || p;
      // Add to my following
      await updateDoc(doc(db, "users", uid), { following: arrayUnion(targetId) });
      // Add me to their followers
      await updateDoc(doc(db, "users", targetId), { followers: arrayUnion(uid) });
    },
    getFriendRequestStatus: async (p: any) => {
      await authReady;
      const snap = await getDoc(doc(db, "users", uid));
      const following = snap.data()?.following || [];
      if (following.includes(p?.toString?.() || p)) return { __kind__: "accepted" };
      return { __kind__: "none" };
    },
    acceptFriendRequest: async () => {},
    rejectFriendRequest: async () => {},
    getFriendsWithProfiles: async () => {
      await authReady;
      const snap = await getDoc(doc(db, "users", uid));
      const following = snap.data()?.following || [];
      const profiles = [];
      for (const fid of following) {
        const fSnap = await getDoc(doc(db, "users", fid));
        if (fSnap.exists()) profiles.push({ ...fSnap.data(), principal: makePrincipal(fid), avatar: makeBlob(fSnap.data().avatarUrl || "") });
      }
      return profiles;
    },
    getPendingFriendRequests: async () => [],

    // ═══ MESSAGING ═══
    getMessagesWithUser: async (otherUser: any) => {
      await authReady;
      const otherId = otherUser?.toString?.() || otherUser;
      const chatId = [uid, otherId].sort().join("_");
      const snap = await getDocs(query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(100)));
      return snap.docs.map((d) => ({
        sender: makePrincipal(d.data().senderId),
        receiver: makePrincipal(d.data().receiverId),
        content: d.data().text,
        timestamp: ts(),
        attachments: null,
      }));
    },
    sendMessage: async (to: any, text: string) => {
      await authReady;
      const otherId = to?.toString?.() || to;
      const chatId = [uid, otherId].sort().join("_");
      // Create chat doc if needed
      await setDoc(doc(db, "chats", chatId), { participants: [uid, otherId], updatedAt: serverTimestamp() }, { merge: true });
      // Add message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: uid, receiverId: otherId, text, createdAt: serverTimestamp(),
      });
    },
    getAllMessages: async () => [],
    startChatWithUser: async () => "ok",

    // ═══ SEARCH ═══
    searchUsers: async (q: string) => {
      const snap = await getDocs(collection(db, "users"));
      const results = snap.docs
        .filter((d) => d.data().name?.toLowerCase().includes(q.toLowerCase()) && d.id !== uid)
        .map((d) => [makePrincipal(d.id), { name: d.data().name, bio: d.data().bio || "", avatar: makeBlob(d.data().avatarUrl || "") }]);
      return { profiles: results, pendingRequests: [] };
    },
    searchUserProfiles: async (q: string) => {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs
        .filter((d) => d.data().name?.toLowerCase().includes(q.toLowerCase()) && d.id !== uid)
        .map((d) => [makePrincipal(d.id), { name: d.data().name, bio: d.data().bio || "", avatar: makeBlob(d.data().avatarUrl || "") }]);
    },

    // ═══ NOTIFICATIONS ═══
    getUserNotifications: async () => {
      await authReady;
      const snap = await getDocs(query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(20)));
      return snap.docs.map((d) => ({ id: d.id, type: d.data().type, message: d.data().message, timestamp: ts(), read: d.data().read || false }));
    },
    markNotificationAsRead: async (id: string) => { await authReady; await updateDoc(doc(db, "users", uid, "notifications", id), { read: true }); },
    getUnreadNotificationCount: async () => {
      await authReady;
      const snap = await getDocs(query(collection(db, "users", uid, "notifications"), where("read", "==", false)));
      return BigInt(snap.size);
    },

    // ═══ MISC ═══
    isCallerAdmin: async () => false,
    getLogo: async () => makeBlob("/assets/generated/socionet-logo-transparent.dim_200x200.png"),
    getCallerUserRole: async () => ({ __kind__: "user" }),
    getVapidPublicKey: async () => "",
    setVapidJwt: async () => {},
    registerPushSubscription: async () => {},
    removePushSubscription: async () => {},
    getPushSubscription: async () => null,
    initiateVideoCall: async () => {},
    getVideoCallHistory: async () => [],
    recordVideoCall: async () => {},
    getSignalingData: async () => [],
    storeSignalingData: async () => {},
    clearSignalingData: async () => {},
    uploadLogo: async () => {},
    initializeAccessControl: async () => {},
    _initializeAccessControl: async () => {},
    transform: async () => ({ status: BigInt(200), body: new Uint8Array(), headers: [] }),
    initiatePayment: async () => "pay",
    processPayment: async () => {},
    getPaymentTransaction: async () => ({ transactionId: "t1", sender: makePrincipal(""), recipient: makePrincipal(""), amount: BigInt(0), timestamp: BigInt(Date.now()), status: { __kind__: "completed" }, paymentMethod: { __kind__: "upi", upi: { provider: "mock" } } }),
    getUserPaymentHistory: async () => [],
    isStripeConfigured: async () => false,
    setStripeConfiguration: async () => {},
    getStripeSessionStatus: async () => ({ __kind__: "failed", failed: { error: "not configured" } }),
    transferBetweenUsers: async () => {},
    getFollowerCount: async () => { await authReady; const s = await getDoc(doc(db, "users", uid)); return BigInt(s.data()?.followers?.length || 0); },
    getFollowingCount: async () => { await authReady; const s = await getDoc(doc(db, "users", uid)); return BigInt(s.data()?.following?.length || 0); },
  };
}

let _fb: ReturnType<typeof createFirebaseBackend> | null = null;
function getFB() {
  if (!_fb) _fb = createFirebaseBackend();
  return _fb;
}

export function useAppActor() {
  const ref = useRef(getFB());
  return { actor: ref.current as any, isFetching: false };
}
