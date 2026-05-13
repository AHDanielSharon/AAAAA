/**
 * In-memory mock backend for local development without Docker.
 * Includes test contacts for testing messaging, follow, and video call.
 */
import { useRef } from "react";

function makePrincipal(id: string) {
  return {
    toString: () => id,
    isAnonymous: () => id === "2vxsx-fae",
    toText: () => id,
    toUint8Array: () => new Uint8Array(),
  } as any;
}

function makeBlob(url: string) {
  return {
    getDirectURL: () => url,
    getBytes: async () => new Uint8Array(),
    withUploadProgress: () => makeBlob(url),
    _blob: null,
    directURL: url,
  } as any;
}

const MOCK_PRINCIPAL = makePrincipal("demo-user");

function load(key: string, fallback: any) {
  try {
    const v = localStorage.getItem("socionet_" + key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key: string, value: any) {
  try { localStorage.setItem("socionet_" + key, JSON.stringify(value)); } catch {}
}

// Test contacts for testing messaging, follow, video call
const TEST_CONTACTS: Record<string, any> = {
  "test-user-socionet-1": { name: "Socionet Team", bio: "Official Socionet support account 🛡️", avatar: makeBlob("https://api.dicebear.com/7.x/bottts/svg?seed=socionet"), displayName: "Socionet Team" },
  "test-user-socionet-2": { name: "Test User", bio: "A test account for trying features ✨", avatar: makeBlob("https://api.dicebear.com/7.x/avataaars/svg?seed=testuser"), displayName: "Test User" },
};

function createMockBackend() {
  const videos: any[] = load("videos", []);
  const profiles: Record<string, any> = load("profiles", TEST_CONTACTS);
  const stories: any[] = load("stories", []);
  const messageStore: Record<string, any[]> = load("messageStore", {});
  const friends: string[] = load("friends", []);
  const following: string[] = load("following", []);
  const followers: string[] = load("followers", []);
  const notifications: any[] = load("notifications", []);
  const friendRequests: Record<string, string> = load("friendRequests", {}); // principal -> "pending"|"accepted"|"rejected"
  let myProfile: any = load("myProfile", null);

  return {
    // ═══ PROFILE ═══
    getCallerUserProfile: async () => myProfile,
    saveCallerUserProfile: async (p: any) => { myProfile = p; save("myProfile", p); },
    getUserProfile: async (principal: any) => {
      const id = principal?.toString?.() || principal;
      if (id === MOCK_PRINCIPAL.toString()) return myProfile;
      return profiles[id] || TEST_CONTACTS[id] || null;
    },
    getAllUserProfiles: async () => Object.entries(profiles).map(([k, v]) => [makePrincipal(k), v]),
    updateProfileImage: async () => {},
    uploadAvatar: async () => "mock-avatar-url",

    // ═══ VIDEOS ═══
    getAllVideos: async () => videos,
    getVideo: async (id: string) => videos.find((v: any) => v.id === id) || null,
    getFeed: async () => videos,
    uploadVideo: async (req: any) => {
      let videoUrl = "";
      if (req.file && req.file.getBytes) {
        try {
          const bytes = await req.file.getBytes();
          const blob = new Blob([bytes], { type: "video/mp4" });
          videoUrl = URL.createObjectURL(blob);
        } catch { videoUrl = req.file?.getDirectURL?.() || ""; }
      } else if (req.file?.getDirectURL) {
        videoUrl = req.file.getDirectURL();
      }
      let thumbUrl = "";
      if (req.thumbnail?.getDirectURL) thumbUrl = req.thumbnail.getDirectURL();
      videos.unshift({
        id: "v" + Date.now(), title: req.title || "Untitled", creator: MOCK_PRINCIPAL,
        thumbnail: makeBlob(thumbUrl || "https://picsum.photos/seed/" + Date.now() + "/400/400"),
        file: makeBlob(videoUrl), video: makeBlob(videoUrl),
        description: req.description || "", uploadTime: BigInt(Date.now()) * BigInt(1000000),
        tags: [], likes: [] as any[], views: BigInt(0), comments: [] as any[],
      });
    },
    searchVideos: async (q: string) => videos.filter((v: any) => v.title?.toLowerCase().includes(q.toLowerCase())),
    getVideosByCreator: async (p: any) => videos.filter((v: any) => v.creator.toString() === p.toString()),
    getTotalVideoCount: async () => BigInt(videos.length),
    incrementViews: async () => {},
    getOwnVideosAndStories: async () => ({ videos: videos.filter((v: any) => v.creator.toString() === MOCK_PRINCIPAL.toString()), stories }),
    deleteVideo: async (id: string) => { const idx = videos.findIndex((v: any) => v.id === id); if (idx >= 0) videos.splice(idx, 1); },

    // ═══ LIKES / COMMENTS ═══
    likeReel: async (id: string) => { const v = videos.find((x: any) => x.id === id); if (v && !v.likes.some((p: any) => p.toString() === MOCK_PRINCIPAL.toString())) v.likes.push(MOCK_PRINCIPAL); },
    dislikeReel: async (id: string) => { const v = videos.find((x: any) => x.id === id); if (v) v.likes = v.likes.filter((p: any) => p.toString() !== MOCK_PRINCIPAL.toString()); },
    shareReel: async () => {},
    getReelStats: async (id: string) => { const v = videos.find((x: any) => x.id === id); return { views: v?.views || BigInt(0), likes: BigInt(v?.likes?.length || 0), dislikes: BigInt(0), shares: BigInt(0), comments: v?.comments || [] }; },
    getAllComments: async (id: string) => { const v = videos.find((x: any) => x.id === id); return v?.comments || []; },
    addComment: async (id: string, comment: any) => {
      const v = videos.find((x: any) => x.id === id);
      if (v) v.comments.push({ content: typeof comment === "string" ? comment : comment.text || comment.content || "", author: MOCK_PRINCIPAL, timestamp: BigInt(Date.now()) * BigInt(1000000), authorName: myProfile?.name || "You" });
    },

    // ═══ STORIES ═══
    getAllActiveStories: async () => stories,
    uploadStory: async (req: any) => {
      let mediaUrl = "";
      if (req.media?.getDirectURL) mediaUrl = req.media.getDirectURL();
      stories.push({ id: "s" + Date.now(), creator: MOCK_PRINCIPAL, media: makeBlob(mediaUrl), caption: req.caption || "", createdAt: BigInt(Date.now()) * BigInt(1000000), expiresAt: BigInt(Date.now() + 86400000) * BigInt(1000000), type: "image" });
    },
    deleteStory: async (id: string) => { const idx = stories.findIndex((s: any) => s.id === id); if (idx >= 0) stories.splice(idx, 1); },
    getImageStoriesByUser: async () => stories.filter((s: any) => s.creator.toString() === MOCK_PRINCIPAL.toString()),
    getVideoStoriesByUser: async () => [],
    getOtherUsersActiveStories: async () => [],

    // ═══ FOLLOW / FRIEND REQUESTS ═══
    getFriends: async () => friends.map(makePrincipal),
    sendFriendRequest: async (p: any) => {
      const id = p?.toString?.() || p;
      friendRequests[id] = "pending";
      save("friendRequests", friendRequests);
      // Auto-accept after 1 second to simulate
      setTimeout(() => {
        friendRequests[id] = "accepted";
        if (!friends.includes(id)) { friends.push(id); save("friends", friends); }
        if (!following.includes(id)) { following.push(id); save("following", following); }
        if (!followers.includes(id)) { followers.push(id); save("followers", followers); }
        notifications.unshift({ id: "n" + Date.now(), type: "friend_accepted", message: `${profiles[id]?.name || "User"} accepted your follow request!`, timestamp: BigInt(Date.now()) * BigInt(1000000), read: false });
        save("notifications", notifications);
      }, 1000);
    },
    getFriendRequestStatus: async (p: any) => {
      const id = p?.toString?.() || p;
      const status = friendRequests[id];
      if (status === "accepted") return { __kind__: "accepted" };
      if (status === "pending") return { __kind__: "pending" };
      return { __kind__: "none" };
    },
    acceptFriendRequest: async (p: any) => {
      const id = p?.toString?.() || p;
      friendRequests[id] = "accepted";
      if (!friends.includes(id)) friends.push(id);
      save("friendRequests", friendRequests);
      save("friends", friends);
    },
    rejectFriendRequest: async (p: any) => {
      const id = p?.toString?.() || p;
      friendRequests[id] = "rejected";
      save("friendRequests", friendRequests);
    },
    getFriendsWithProfiles: async () => friends.map((f: string) => ({ ...(profiles[f] || { name: f.slice(0, 10), bio: "" }), principal: makePrincipal(f) })),
    getPendingFriendRequests: async () => [],

    // ═══ MESSAGING ═══
    getMessagesWithUser: async (otherUser: any) => {
      const id = otherUser?.toString?.() || otherUser;
      const key = `chat_${id}`;
      const msgs = messageStore[key] || [];
      return msgs;
    },
    sendMessage: async (to: any, text: string, attachments?: any) => {
      const id = to?.toString?.() || to;
      const key = `chat_${id}`;
      if (!messageStore[key]) messageStore[key] = [];
      messageStore[key].push({
        sender: MOCK_PRINCIPAL, receiver: makePrincipal(id),
        content: text, timestamp: BigInt(Date.now()) * BigInt(1000000), attachments: attachments || null,
      });
      save("messageStore", messageStore);
      // Simulate auto-reply after 2 seconds
      const contactName = profiles[id]?.name || "User";
      setTimeout(() => {
        const replies = ["Hey! 👋", "That's interesting!", "Thanks for the message 😊", "Sure, sounds good!", "Let me check and get back to you", `Hi ${myProfile?.name || "there"}! How are you?`];
        messageStore[key].push({
          sender: makePrincipal(id), receiver: MOCK_PRINCIPAL,
          content: replies[Math.floor(Math.random() * replies.length)],
          timestamp: BigInt(Date.now()) * BigInt(1000000), attachments: null,
        });
        save("messageStore", messageStore);
      }, 2000);
    },
    getAllMessages: async () => {
      const all: any[] = [];
      for (const msgs of Object.values(messageStore)) all.push(...msgs);
      return all.sort((a: any, b: any) => Number(b.timestamp - a.timestamp));
    },
    startChatWithUser: async () => "chat-" + Date.now(),

    // ═══ SEARCH ═══
    searchUsers: async (q: string) => ({
      profiles: Object.entries(profiles)
        .filter(([_, p]: any) => p.name?.toLowerCase().includes(q.toLowerCase()))
        .map(([k, v]) => [makePrincipal(k), v]),
      pendingRequests: [],
    }),
    searchUserProfiles: async (q: string) => Object.entries(profiles)
      .filter(([_, p]: any) => p.name?.toLowerCase().includes(q.toLowerCase()))
      .map(([k, v]) => [makePrincipal(k), v]),

    // ═══ NOTIFICATIONS ═══
    getUserNotifications: async () => notifications,
    markNotificationAsRead: async (id: string) => {
      const n = notifications.find((x: any) => x.id === id);
      if (n) { n.read = true; save("notifications", notifications); }
    },
    getUnreadNotificationCount: async () => BigInt(notifications.filter((n: any) => !n.read).length),

    // ═══ MISC ═══
    isCallerAdmin: async () => false,
    getLogo: async () => makeBlob("/assets/generated/socionet-logo-transparent.dim_200x200.png"),
    getCallerUserRole: async () => ({ __kind__: "user" }),
    getVapidPublicKey: async () => "",
    setVapidJwt: async () => {},
    registerPushSubscription: async () => {},
    removePushSubscription: async () => {},
    getPushSubscription: async () => null,

    // ═══ VIDEO CALL (simulated) ═══
    initiateVideoCall: async (to: any) => {
      const id = to?.toString?.() || to;
      notifications.unshift({ id: "n" + Date.now(), type: "video_call", message: `Video call initiated with ${profiles[id]?.name || "User"}`, timestamp: BigInt(Date.now()) * BigInt(1000000), read: false });
      save("notifications", notifications);
      return "call-" + Date.now();
    },
    getVideoCallHistory: async () => [],
    recordVideoCall: async () => {},
    getSignalingData: async () => [],
    storeSignalingData: async () => {},
    clearSignalingData: async () => {},

    uploadLogo: async () => {},
    initializeAccessControl: async () => {},
    _initializeAccessControl: async () => {},
    transform: async () => ({ status: BigInt(200), body: new Uint8Array(), headers: [] }),
    initiatePayment: async () => "pay-" + Date.now(),
    processPayment: async () => {},
    getPaymentTransaction: async () => ({ transactionId: "t1", sender: MOCK_PRINCIPAL, recipient: MOCK_PRINCIPAL, amount: BigInt(0), timestamp: BigInt(Date.now()), status: { __kind__: "completed" }, paymentMethod: { __kind__: "upi", upi: { provider: "mock" } } }),
    getUserPaymentHistory: async () => [],
    isStripeConfigured: async () => false,
    setStripeConfiguration: async () => {},
    getStripeSessionStatus: async () => ({ __kind__: "failed", failed: { error: "not configured" } }),
    transferBetweenUsers: async () => {},

    // Helper: get follower/following counts
    getFollowerCount: async () => BigInt(followers.length),
    getFollowingCount: async () => BigInt(following.length),
  };
}

let _mock: ReturnType<typeof createMockBackend> | null = null;
function getMock() {
  if (!_mock) _mock = createMockBackend();
  return _mock;
}

export function useAppActor() {
  const mockRef = useRef(getMock());
  return { actor: mockRef.current as any, isFetching: false };
}
