/**
 * Full-screen video call UI with camera, mic, screen share controls.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Monitor, MonitorOff, X, Maximize2, Minimize2
} from "lucide-react";
import { createCallManager, type CallState } from "../hooks/useVideoCall";

interface VideoCallDialogProps {
  open: boolean;
  targetUserId: string;
  targetUserName: string;
  isIncoming?: boolean;
  incomingCallId?: string;
  onClose: () => void;
}

export default function VideoCallDialog({
  open, targetUserId, targetUserName, isIncoming, incomingCallId, onClose,
}: VideoCallDialogProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const managerRef = useRef<ReturnType<typeof createCallManager> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStreamsChange = useCallback((local: MediaStream | null, remote: MediaStream | null) => {
    if (localVideoRef.current) localVideoRef.current.srcObject = local;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
  }, []);

  const handleStateChange = useCallback((state: CallState) => {
    setCallState(state);
    if (state === "connected") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    if (state === "ended" || state === "idle") {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const manager = createCallManager(handleStateChange, handleStreamsChange);
    managerRef.current = manager;

    if (isIncoming && incomingCallId) {
      manager.answerCall(incomingCallId);
    } else {
      manager.startCall(targetUserId);
    }

    return () => {
      manager.endCall();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, targetUserId, isIncoming, incomingCallId]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    managerRef.current?.endCall();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col"
      >
        {/* Remote video (full screen) */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Calling state overlay */}
          {callState !== "connected" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-sm">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mb-6 border-2 border-primary/40">
                <span className="text-4xl font-black text-white">
                  {targetUserName?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{targetUserName}</h2>
              <p className="text-sm text-white/60 font-medium animate-pulse">
                {callState === "calling" ? "Calling..." :
                 callState === "ringing" ? "Ringing..." :
                 callState === "ended" ? "Call ended" : "Connecting..."}
              </p>
              {callState === "calling" && (
                <div className="mt-8 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      className="w-3 h-3 rounded-full bg-primary"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="absolute top-6 right-6 w-36 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="text-white/40" size={24} />
              </div>
            )}
          </motion.div>

          {/* Duration badge */}
          {callState === "connected" && (
            <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-sm font-bold text-green-400">{formatDuration(duration)}</span>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="bg-black/80 backdrop-blur-xl px-6 py-8 safe-pb-nav">
          <div className="flex items-center justify-center gap-5 max-w-md mx-auto">
            {/* Mute */}
            <button
              onClick={() => { const m = managerRef.current?.toggleMute(); setIsMuted(!!m); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Video toggle */}
            <button
              onClick={() => { const v = managerRef.current?.toggleVideo(); setIsVideoOff(!!v); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isVideoOff ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            {/* Screen share */}
            <button
              onClick={async () => { const s = await managerRef.current?.toggleScreenShare(); setIsScreenSharing(!!s); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isScreenSharing ? "bg-primary/30 text-primary" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all active:scale-95"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
