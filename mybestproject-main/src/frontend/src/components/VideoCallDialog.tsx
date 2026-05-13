import {
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useClearSignalingData,
  useGetSignalingData,
  useStoreSignalingData,
} from "../hooks/useQueries";

const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export function deriveSessionId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export interface VideoCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientPrincipal: string;
  callerPrincipal: string;
  isInitiator: boolean;
  recipientName?: string;
}

type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "ended"
  | "failed";

export default function VideoCallDialog({
  isOpen,
  onClose,
  recipientPrincipal,
  callerPrincipal,
  isInitiator,
  recipientName,
}: VideoCallDialogProps) {
  const sessionId = deriveSessionId(callerPrincipal, recipientPrincipal);

  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteStreamReady, setRemoteStreamReady] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const callStartRef = useRef<number | null>(null);
  const appliedIceRef = useRef<Set<string>>(new Set());
  const setupDoneRef = useRef(false);

  const storeSignaling = useStoreSignalingData();
  const clearSignaling = useClearSignalingData();
  const { refetch: fetchSignaling } = useGetSignalingData(sessionId, false);

  const startTimer = useCallback(() => {
    callStartRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      if (callStartRef.current)
        setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    callStartRef.current = null;
    setCallDuration(0);
  }, []);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (
      onData: (
        entries: Array<{
          dataType: string;
          data: string;
          sender: { toString(): string };
        }>,
      ) => void,
    ) => {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const result = await fetchSignaling();
          if (result.data) onData(result.data);
        } catch {
          // silently ignore
        }
      }, 2000);
    },
    [fetchSignaling],
  );

  const getMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch {
      toast.error("Camera/microphone permission denied");
      setCallStatus("failed");
      throw new Error("media-denied");
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: storeSignaling.mutate is stable
  const createPC = useCallback(
    (stream: MediaStream): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      for (const track of stream.getTracks()) pc.addTrack(track, stream);
      pc.onicecandidate = ({ candidate }) => {
        if (candidate)
          storeSignaling.mutate({
            sessionId,
            dataType: "ice",
            data: JSON.stringify(candidate),
          });
      };
      pc.ontrack = ({ streams }) => {
        if (remoteVideoRef.current && streams[0]) {
          remoteVideoRef.current.srcObject = streams[0];
          setRemoteStreamReady(true);
        }
      };
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setCallStatus("connected");
          startTimer();
          stopPolling();
        } else if (
          state === "failed" ||
          state === "disconnected" ||
          state === "closed"
        ) {
          setCallStatus("failed");
          stopPolling();
        }
      };
      pcRef.current = pc;
      return pc;
    },
    [sessionId, startTimer, stopPolling],
  );

  const startCallAsInitiator = useCallback(async () => {
    if (setupDoneRef.current) return;
    setupDoneRef.current = true;
    setCallStatus("calling");
    try {
      const stream = await getMedia();
      const pc = createPC(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await storeSignaling.mutateAsync({
        sessionId,
        dataType: "offer",
        data: JSON.stringify(offer),
      });
      startPolling(async (entries) => {
        const activePc = pcRef.current;
        if (!activePc) return;
        if (activePc.remoteDescription === null) {
          const answerEntry = entries.find((e) => e.dataType === "answer");
          if (answerEntry) {
            try {
              await activePc.setRemoteDescription(JSON.parse(answerEntry.data));
              setCallStatus("ringing");
            } catch (err) {
              console.error("setRemoteDescription (answer) failed", err);
            }
          }
        }
        for (const entry of entries) {
          if (entry.dataType === "ice") {
            const key = entry.data;
            if (appliedIceRef.current.has(key)) continue;
            appliedIceRef.current.add(key);
            try {
              await activePc.addIceCandidate(JSON.parse(entry.data));
            } catch {
              /* stale */
            }
          }
        }
      });
    } catch {
      /* errors shown via toast */
    }
  }, [getMedia, createPC, sessionId, storeSignaling, startPolling]);

  const answerCall = useCallback(
    async (offerData: string) => {
      if (setupDoneRef.current) return;
      setupDoneRef.current = true;
      setCallStatus("ringing");
      try {
        const stream = await getMedia();
        const pc = createPC(stream);
        await pc.setRemoteDescription(JSON.parse(offerData));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await storeSignaling.mutateAsync({
          sessionId,
          dataType: "answer",
          data: JSON.stringify(answer),
        });
        startPolling(async (entries) => {
          const activePc = pcRef.current;
          if (!activePc) return;
          for (const entry of entries) {
            if (entry.dataType === "ice") {
              const key = entry.data;
              if (appliedIceRef.current.has(key)) continue;
              appliedIceRef.current.add(key);
              try {
                await activePc.addIceCandidate(JSON.parse(entry.data));
              } catch {
                /* ignore */
              }
            }
          }
        });
      } catch {
        /* errors shown via toast */
      }
    },
    [getMedia, createPC, sessionId, storeSignaling, startPolling],
  );

  const endCall = useCallback(() => {
    stopPolling();
    stopTimer();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    clearSignaling.mutate({ sessionId });
    setCallStatus("ended");
    setRemoteStreamReady(false);
    setTimeout(() => onClose(), 1200);
  }, [stopPolling, stopTimer, clearSignaling, sessionId, onClose]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!isOpen) return;
    if (!isInitiator) {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CANCEL_CALL_NOTIFICATION",
          callSessionId: sessionId,
        });
      }
    }
    if (isInitiator) startCallAsInitiator();
    return () => stopPolling();
  }, [isOpen, isInitiator]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: answerCall/fetchSignaling are stable refs
  useEffect(() => {
    if (!isOpen || isInitiator || setupDoneRef.current) return;
    const offerPoll = setInterval(async () => {
      const result = await fetchSignaling();
      const offerEntry = result.data?.find((e) => e.dataType === "offer");
      if (offerEntry) {
        clearInterval(offerPoll);
        answerCall(offerEntry.data);
      }
    }, 1000);
    return () => clearInterval(offerPoll);
  }, [isOpen, isInitiator]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup on unmount only
  useEffect(() => {
    return () => {
      stopPolling();
      stopTimer();
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getTracks()) t.stop();
      }
      setupDoneRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setupDoneRef.current = false;
      appliedIceRef.current = new Set();
    }
  }, [isOpen]);

  const toggleCamera = () => {
    const vt = localStreamRef.current?.getVideoTracks()[0];
    if (vt) {
      vt.enabled = !vt.enabled;
      setIsCameraOn(vt.enabled);
    }
  };
  const toggleMic = () => {
    const at = localStreamRef.current?.getAudioTracks()[0];
    if (at) {
      at.enabled = !at.enabled;
      setIsMicOn(at.enabled);
    }
  };

  const isConnecting =
    callStatus === "idle" ||
    callStatus === "calling" ||
    callStatus === "ringing";

  const statusLabel = {
    idle: "Starting…",
    calling: "Calling…",
    ringing: "Connecting…",
    connected: formatDuration(callDuration),
    ended: "Call ended",
    failed: "Connection failed",
  }[callStatus];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
      data-ocid="videocall.dialog"
    >
      <div
        className="relative w-full h-full flex flex-col overflow-hidden"
        style={{
          maxWidth: "100vw",
          maxHeight: "100dvh",
          background: "linear-gradient(180deg, #050a14 0%, #0a0612 100%)",
        }}
      >
        {/* Remote video — full background */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${remoteStreamReady ? "opacity-100" : "opacity-0"}`}
        >
          <track kind="captions" />
        </video>

        {/* Connecting / status overlay */}
        {callStatus !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-6 px-6">
            {isConnecting && (
              <>
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute w-36 h-36 rounded-full animate-ping"
                    style={{ background: "oklch(var(--primary) / 0.12)" }}
                  />
                  <div
                    className="absolute w-28 h-28 rounded-full animate-ping"
                    style={{
                      background: "oklch(var(--primary) / 0.18)",
                      animationDelay: "0.3s",
                    }}
                  />
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "oklch(var(--primary) / 0.2)",
                      border: "1.5px solid oklch(var(--primary) / 0.6)",
                      boxShadow:
                        "0 0 30px oklch(var(--primary) / 0.4), 0 0 60px oklch(var(--primary) / 0.2)",
                    }}
                  >
                    <Video className="h-9 w-9 text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-black text-foreground">
                    {recipientName || "User"}
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    <span className="text-sm text-primary/80">
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </>
            )}
            {callStatus === "failed" && (
              <div className="text-center space-y-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{
                    background: "rgba(239,68,68,0.2)",
                    border: "1.5px solid rgba(239,68,68,0.5)",
                  }}
                >
                  <PhoneOff className="h-9 w-9 text-red-400" />
                </div>
                <p className="text-xl font-bold text-red-300">
                  Connection failed
                </p>
                <p className="text-sm text-red-400/60">
                  Check your connection and try again
                </p>
                <button
                  type="button"
                  onClick={endCall}
                  className="mt-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: "rgba(239,68,68,0.8)" }}
                >
                  Close
                </button>
              </div>
            )}
            {callStatus === "ended" && (
              <div className="text-center space-y-3">
                <PhoneOff className="h-14 w-14 text-muted-foreground mx-auto" />
                <p className="text-lg text-muted-foreground font-semibold">
                  Call ended
                </p>
              </div>
            )}
          </div>
        )}

        {/* Top bar: name + timer when connected */}
        {callStatus === "connected" && (
          <div
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] pb-5"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          >
            <div>
              <p className="font-bold text-lg text-white">
                {recipientName || "Video Call"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-300">{statusLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Local video PiP — bottom-right corner */}
        <div
          className="absolute bottom-32 right-4 z-20 overflow-hidden rounded-2xl"
          style={{
            width: 120,
            height: 160,
            border: "2px solid oklch(var(--primary) / 0.7)",
            boxShadow:
              "0 0 20px oklch(var(--primary) / 0.35), 0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          >
            <track kind="captions" />
          </video>
          {!isCameraOn && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(10,6,18,0.9)" }}
            >
              <VideoOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Control bar — bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-5 px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          }}
        >
          {/* Mute mic */}
          <button
            type="button"
            onClick={toggleMic}
            disabled={!localStreamRef.current}
            data-ocid="videocall.mic_toggle"
            aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            className="flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-40"
            style={{
              width: 56,
              height: 56,
              background: isMicOn
                ? "rgba(255,255,255,0.15)"
                : "rgba(239,68,68,0.85)",
              border: "1.5px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            {isMicOn ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-white" />
            )}
          </button>

          {/* End call */}
          <button
            type="button"
            onClick={endCall}
            data-ocid="videocall.end_button"
            aria-label="End call"
            className="flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              width: 64,
              height: 64,
              background: "#e53e3e",
              boxShadow: "0 4px 24px rgba(229,62,62,0.55)",
            }}
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </button>

          {/* Toggle camera */}
          <button
            type="button"
            onClick={toggleCamera}
            disabled={!localStreamRef.current}
            data-ocid="videocall.camera_toggle"
            aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
            className="flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-40"
            style={{
              width: 56,
              height: 56,
              background: isCameraOn
                ? "rgba(255,255,255,0.15)"
                : "rgba(239,68,68,0.85)",
              border: "1.5px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            {isCameraOn ? (
              <Video className="h-6 w-6 text-white" />
            ) : (
              <VideoOff className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Incoming call banner ───────────────────────────────────────────────────
// ── Incoming call banner ──────────────────────────────────────────────────────
function useRingtone() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback((durationMs = 45000) => {
    stop();
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const totalEnd = ctx.currentTime + durationMs / 1000;
      const pattern = [
        { freq: 440, duration: 0.3 },
        { freq: 0, duration: 0.15 },
        { freq: 480, duration: 0.3 },
        { freq: 0, duration: 0.5 },
      ];
      let t = ctx.currentTime + 0.05;
      while (t < totalEnd) {
        for (const step of pattern) {
          if (step.freq > 0) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = step.freq;
            osc.type = "sine";
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + step.duration);
            osc.start(t);
            osc.stop(t + step.duration);
          }
          t += step.duration;
          if (t >= totalEnd) break;
        }
      }
      ringTimeoutRef.current = setTimeout(stop, durationMs + 200);
    } catch {
      // AudioContext not available
    }
  }, []);

  const stop = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stop();
    },
    [stop],
  );

  return { start, stop };
}

export function IncomingCallBanner({
  callerName,
  onAccept,
  onDecline,
}: {
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const ringtone = useRingtone();

  // biome-ignore lint/correctness/useExhaustiveDependencies: ringtone stable ref
  useEffect(() => {
    ringtone.start(45000);
    return () => ringtone.stop();
  }, []);

  const handleAccept = () => {
    ringtone.stop();
    // Tell service worker to dismiss the lock-screen notification
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "STOP_RINGTONE" });
    }
    onAccept();
  };

  const handleDecline = () => {
    ringtone.stop();
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "STOP_RINGTONE" });
    }
    onDecline();
  };

  return (
    <div
      className="fixed top-4 left-4 right-4 z-50 flex items-center gap-3 px-4 py-4 rounded-3xl"
      style={{
        background: "rgba(10,6,18,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1.5px solid oklch(var(--primary) / 0.5)",
        boxShadow:
          "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px oklch(var(--primary) / 0.15), 0 0 30px oklch(var(--primary) / 0.2)",
      }}
      data-ocid="videocall.incoming_banner"
    >
      <div
        className="relative flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
        style={{
          background: "oklch(var(--primary) / 0.2)",
          border: "1.5px solid oklch(var(--primary) / 0.5)",
        }}
      >
        <Video className="h-6 w-6 text-primary" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm truncate">
          {callerName}
        </p>
        <p className="text-xs text-muted-foreground">Incoming video call…</p>
      </div>
      <button
        type="button"
        onClick={handleAccept}
        data-ocid="videocall.accept_button"
        className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 active:scale-90 transition-transform"
        style={{
          background: "#22c55e",
          boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
        }}
        aria-label="Accept call"
      >
        <Phone className="h-5 w-5 text-white" />
      </button>
      <button
        type="button"
        onClick={handleDecline}
        data-ocid="videocall.decline_button"
        className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 active:scale-90 transition-transform"
        style={{
          background: "#e53e3e",
          boxShadow: "0 4px 16px rgba(229,62,62,0.4)",
        }}
        aria-label="Decline call"
      >
        <PhoneOff className="h-5 w-5 text-white" />
      </button>
    </div>
  );
}
