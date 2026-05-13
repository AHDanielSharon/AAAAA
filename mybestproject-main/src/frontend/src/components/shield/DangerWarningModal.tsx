import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface DangerWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
  onEnableVPN: () => void;
  ssid: string;
}

export default function DangerWarningModal({
  visible,
  onDismiss,
  onEnableVPN,
  ssid,
}: DangerWarningModalProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-ocid="shield.danger_modal"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.85)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />

          {/* Modal card */}
          <motion.div
            className="relative w-full rounded-3xl border border-cyber-dangerous/50 bg-black/95 p-6 shadow-2xl"
            style={{
              maxWidth: 380,
              boxShadow:
                "0 0 40px oklch(0.68 0.35 25 / 0.4), 0 0 80px oklch(0.68 0.35 25 / 0.2)",
            }}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={onDismiss}
              data-ocid="shield.danger_modal.close_button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close warning"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="w-16 h-16 rounded-2xl bg-cyber-dangerous/20 border-2 border-cyber-dangerous/60 flex items-center justify-center"
                style={{ boxShadow: "0 0 24px oklch(0.68 0.35 25 / 0.5)" }}
              >
                <ShieldAlert className="w-8 h-8 text-cyber-dangerous" />
              </motion.div>
            </div>

            {/* Heading */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-cyber-dangerous animate-threat-blink" />
                <h2 className="text-lg font-bold font-display text-cyber-dangerous">
                  DANGEROUS NETWORK
                </h2>
                <AlertTriangle className="w-4 h-4 text-cyber-dangerous animate-threat-blink" />
              </div>
              <p className="text-xs text-muted-foreground">
                Connected to:{" "}
                <span className="text-foreground font-medium">{ssid}</span>
              </p>
            </div>

            {/* Exposures */}
            <div className="rounded-xl bg-cyber-dangerous/10 border border-cyber-dangerous/20 p-3 mb-4">
              <p className="text-xs font-semibold text-cyber-dangerous mb-2">
                This WiFi may expose:
              </p>
              <ul className="space-y-1">
                {[
                  "Your passwords",
                  "Personal messages",
                  "Banking details",
                  "Private files",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-cyber-dangerous shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-center text-muted-foreground mb-4">
              Avoid sensitive activity. Enable VPN immediately.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onEnableVPN();
                  onDismiss();
                }}
                data-ocid="shield.danger_modal.confirm_button"
                className="w-full py-3 rounded-xl font-bold text-sm text-black bg-cyber-moderate hover:opacity-90 transition-opacity"
                style={{ boxShadow: "0 0 16px oklch(0.76 0.35 65 / 0.4)" }}
              >
                ENABLE VPN NOW
              </button>
              <button
                type="button"
                onClick={onDismiss}
                data-ocid="shield.danger_modal.cancel_button"
                className="w-full py-3 rounded-xl font-medium text-sm text-muted-foreground bg-white/5 hover:bg-white/10 transition-colors"
              >
                Dismiss Warning
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
