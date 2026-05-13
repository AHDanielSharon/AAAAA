/**
 * Listens for incoming video calls via Firebase and shows an incoming call UI.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { db, authReady, getCurrentUid } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, getDoc } from "firebase/firestore";
import VideoCallDialog from "./VideoCallDialog";

export default function IncomingCallListener() {
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    callerId: string;
    callerName: string;
  } | null>(null);
  const [showCallUI, setShowCallUI] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    authReady.then((uid) => {
      unsub = onSnapshot(collection(db, "users", uid, "incomingCalls"), async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added") {
            const data = change.doc.data();
            // Get caller's name
            let callerName = "Unknown";
            try {
              const callerDoc = await getDoc(doc(db, "users", data.callerId));
              callerName = callerDoc.data()?.name || "Unknown";
            } catch {}

            setIncomingCall({
              callId: data.callId,
              callerId: data.callerId,
              callerName,
            });

            // Auto-dismiss after 30 seconds
            setTimeout(() => {
              setIncomingCall(null);
              deleteDoc(doc(db, "users", uid, "incomingCalls", change.doc.id)).catch(() => {});
            }, 30000);
          }
        }
      });
    });

    return () => unsub?.();
  }, []);

  const handleAccept = () => {
    if (incomingCall) {
      setShowCallUI(true);
      // Clear incoming call notification
      authReady.then((uid) => {
        deleteDoc(doc(db, "users", uid, "incomingCalls", incomingCall.callId)).catch(() => {});
      });
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      authReady.then((uid) => {
        deleteDoc(doc(db, "users", uid, "incomingCalls", incomingCall.callId)).catch(() => {});
      });
      setIncomingCall(null);
    }
  };

  return (
    <>
      {/* Incoming call banner */}
      <AnimatePresence>
        {incomingCall && !showCallUI && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[9998] bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-5 shadow-2xl shadow-green-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Video className="text-white" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg truncate">{incomingCall.callerName}</p>
                <p className="text-white/70 text-sm font-medium">Incoming video call...</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <PhoneOff className="text-white" size={20} />
                </button>
                <button
                  onClick={handleAccept}
                  className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform animate-pulse"
                >
                  <Phone className="text-white" size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active call UI */}
      {showCallUI && incomingCall && (
        <VideoCallDialog
          open={true}
          targetUserId={incomingCall.callerId}
          targetUserName={incomingCall.callerName}
          isIncoming={true}
          incomingCallId={incomingCall.callId}
          onClose={() => {
            setShowCallUI(false);
            setIncomingCall(null);
          }}
        />
      )}
    </>
  );
}
