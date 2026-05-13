import { ShieldCheck, ShieldOff } from "lucide-react";
import { motion } from "motion/react";

interface VPNStatusCardProps {
  vpnEnabled: boolean;
  onToggle: () => void;
  isScanning: boolean;
}

export default function VPNStatusCard({
  vpnEnabled,
  onToggle,
  isScanning,
}: VPNStatusCardProps) {
  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl p-4 flex items-center justify-between gap-4 ${
        vpnEnabled
          ? "border-cyber-safe/30 bg-cyber-safe/5"
          : "border-white/10 bg-black/30"
      }`}
      data-ocid="shield.vpn_card"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            vpnEnabled
              ? "bg-cyber-safe/20 border border-cyber-safe/30"
              : "bg-white/5 border border-white/10"
          }`}
        >
          {vpnEnabled ? (
            <ShieldCheck className="w-5 h-5 text-cyber-safe" />
          ) : (
            <ShieldOff className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p
            className={`font-bold text-sm font-display ${
              vpnEnabled ? "text-cyber-safe" : "text-foreground"
            }`}
          >
            VPN {vpnEnabled ? "Active" : "Disabled"}
          </p>
          <p className="text-xs text-muted-foreground">
            {vpnEnabled
              ? "Your traffic is encrypted"
              : "Your traffic is exposed"}
          </p>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onToggle}
        disabled={isScanning}
        data-ocid="shield.vpn_toggle"
        whileTap={{ scale: 0.92 }}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          vpnEnabled ? "bg-cyber-safe" : "bg-white/20"
        } disabled:opacity-50`}
        aria-label={vpnEnabled ? "Disable VPN" : "Enable VPN"}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          style={{ left: vpnEnabled ? "calc(100% - 22px)" : "2px" }}
        />
      </motion.button>
    </div>
  );
}
