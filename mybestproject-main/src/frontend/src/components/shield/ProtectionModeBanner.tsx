import { AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

export default function ProtectionModeBanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="rounded-xl border border-cyber-dangerous/40 bg-cyber-dangerous/10 p-3 flex items-center gap-3"
      data-ocid="shield.protection_mode_banner"
      style={{ boxShadow: "0 0 20px oklch(0.68 0.35 25 / 0.25)" }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
      >
        <AlertTriangle className="w-5 h-5 text-cyber-dangerous shrink-0" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-cyber-dangerous tracking-widest">
          PROTECTION MODE ACTIVE
        </p>
        <p className="text-[10px] text-muted-foreground">
          Sensitive notifications blurred · VPN recommended · Avoid banking
        </p>
      </div>
    </motion.div>
  );
}
