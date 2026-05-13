/**
 * WebRTC Video Call system using Firebase for signaling.
 * Supports 1-to-1 video calls with camera, mic, and screen sharing.
 */
import { db, authReady, getCurrentUid } from "../firebase";
import {
  doc, setDoc, getDoc, onSnapshot, collection,
  addDoc, deleteDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

export interface CallManager {
  state: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (targetUserId: string) => Promise<void>;
  answerCall: (callId: string) => Promise<void>;
  endCall: () => void;
  toggleMute: () => boolean;
  toggleVideo: () => boolean;
  toggleScreenShare: () => Promise<boolean>;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  callId: string | null;
}

export function createCallManager(
  onStateChange: (state: CallState) => void,
  onStreamsChange: (local: MediaStream | null, remote: MediaStream | null) => void,
): CallManager {
  let pc: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let remoteStream: MediaStream | null = null;
  let state: CallState = "idle";
  let isMuted = false;
  let isVideoOff = false;
  let isScreenSharing = false;
  let callId: string | null = null;
  let unsubOffer: (() => void) | null = null;
  let unsubAnswer: (() => void) | null = null;
  let unsubCandidates: (() => void) | null = null;

  function setState(s: CallState) {
    state = s;
    onStateChange(s);
  }

  async function getMedia() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      // Fallback to audio only
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } catch {
        localStream = new MediaStream();
      }
    }
    return localStream;
  }

  function createPeerConnection() {
    pc = new RTCPeerConnection(ICE_SERVERS);
    remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream!.addTrack(track);
      });
      onStreamsChange(localStream, remoteStream);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc?.iceConnectionState === "connected") setState("connected");
      if (pc?.iceConnectionState === "disconnected" || pc?.iceConnectionState === "failed") {
        endCall();
      }
    };

    // Add local tracks
    localStream?.getTracks().forEach((track) => {
      pc!.addTrack(track, localStream!);
    });

    return pc;
  }

  async function startCall(targetUserId: string) {
    await authReady;
    const uid = getCurrentUid();

    await getMedia();
    onStreamsChange(localStream, null);
    setState("calling");

    createPeerConnection();

    // Create call document in Firebase
    const callDoc = doc(collection(db, "calls"));
    callId = callDoc.id;

    const offerCandidates = collection(db, "calls", callId, "offerCandidates");
    const answerCandidates = collection(db, "calls", callId, "answerCandidates");

    // Collect ICE candidates
    pc!.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    // Create offer
    const offer = await pc!.createOffer();
    await pc!.setLocalDescription(offer);

    await setDoc(callDoc, {
      offer: { type: offer.type, sdp: offer.sdp },
      callerId: uid,
      targetId: targetUserId,
      status: "ringing",
      createdAt: serverTimestamp(),
    });

    // Notify the target user
    await setDoc(doc(db, "users", targetUserId, "incomingCalls", callId), {
      callId,
      callerId: uid,
      callerName: "", // Will be filled by the caller's profile
      createdAt: serverTimestamp(),
    });

    // Listen for answer
    unsubAnswer = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && pc && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        setState("connected");
      }
      if (data?.status === "ended") {
        endCall();
      }
    });

    // Listen for answer ICE candidates
    unsubCandidates = onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc?.addIceCandidate(candidate);
        }
      });
    });
  }

  async function answerCall(incomingCallId: string) {
    await authReady;
    callId = incomingCallId;

    await getMedia();
    onStreamsChange(localStream, null);
    setState("connected");

    createPeerConnection();

    const callDoc = doc(db, "calls", callId);
    const offerCandidates = collection(db, "calls", callId, "offerCandidates");
    const answerCandidates = collection(db, "calls", callId, "answerCandidates");

    // Collect ICE candidates
    pc!.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    // Get offer
    const callData = (await getDoc(callDoc)).data();
    if (!callData?.offer) return;

    await pc!.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answer = await pc!.createAnswer();
    await pc!.setLocalDescription(answer);

    await updateDoc(callDoc, {
      answer: { type: answer.type, sdp: answer.sdp },
      status: "connected",
    });

    // Listen for offer ICE candidates
    unsubCandidates = onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc?.addIceCandidate(candidate);
        }
      });
    });
  }

  function endCall() {
    // Stop all tracks
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());

    // Close peer connection
    pc?.close();
    pc = null;
    localStream = null;
    remoteStream = null;

    // Clean up listeners
    unsubOffer?.();
    unsubAnswer?.();
    unsubCandidates?.();

    // Update Firebase
    if (callId) {
      updateDoc(doc(db, "calls", callId), { status: "ended" }).catch(() => {});
    }

    setState("ended");
    onStreamsChange(null, null);
    setTimeout(() => setState("idle"), 1000);
  }

  function toggleMute() {
    isMuted = !isMuted;
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });
    return isMuted;
  }

  function toggleVideo() {
    isVideoOff = !isVideoOff;
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !isVideoOff; });
    return isVideoOff;
  }

  async function toggleScreenShare() {
    if (isScreenSharing) {
      // Stop screen share, switch back to camera
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = camStream.getVideoTracks()[0];
      const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
      sender?.replaceTrack(camTrack);
      localStream?.getVideoTracks().forEach((t) => t.stop());
      localStream?.addTrack(camTrack);
      isScreenSharing = false;
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
        screenTrack.onended = () => toggleScreenShare();
        isScreenSharing = true;
      } catch {
        isScreenSharing = false;
      }
    }
    return isScreenSharing;
  }

  return {
    get state() { return state; },
    get localStream() { return localStream; },
    get remoteStream() { return remoteStream; },
    get isMuted() { return isMuted; },
    get isVideoOff() { return isVideoOff; },
    get isScreenSharing() { return isScreenSharing; },
    get callId() { return callId; },
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
}
