import { Lock, Radio, Signal, Wifi } from "lucide-react";
import type { EncryptionType } from "../../hooks/useNetworkSafety";

interface NetworkInfoCardProps {
  ssid: string;
  encryptionType: EncryptionType;
  isPublic: boolean;
  isOpen: boolean;
  signalStrength: number;
  connectionStatus: string;
}

const ENC_COLORS: Record<EncryptionType, string> = {
  WPA3: "text-cyber-safe border-cyber-safe/40 bg-cyber-safe/10",
  WPA2: "text-primary border-primary/40 bg-primary/10",
  WPA: "text-cyber-moderate border-cyber-moderate/40 bg-cyber-moderate/10",
  Open: "text-cyber-dangerous border-cyber-dangerous/40 bg-cyber-dangerous/10",
};

function SignalBars({ strength }: { strength: number }) {
  const bars = [
    { threshold: 25, key: "bar-1" },
    { threshold: 50, key: "bar-2" },
    { threshold: 75, key: "bar-3" },
    { threshold: 100, key: "bar-4" },
  ];
  return (
    <div className="flex items-end gap-0.5">
      {bars.map((bar, i) => (
        <div
          key={bar.key}
          className="rounded-sm transition-colors duration-300"
          style={{
            width: 4,
            height: 4 + i * 3,
            background:
              strength >= bar.threshold
                ? "oklch(var(--cyber-safe))"
                : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}

export default function NetworkInfoCard({
  ssid,
  encryptionType,
  isPublic,
  isOpen,
  signalStrength,
  connectionStatus,
}: NetworkInfoCardProps) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 space-y-3"
      data-ocid="shield.network_info_card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Current Network
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            connectionStatus === "Connected"
              ? "text-cyber-safe border-cyber-safe/30 bg-cyber-safe/10"
              : "text-cyber-moderate border-cyber-moderate/30"
          }`}
        >
          {connectionStatus}
        </span>
      </div>

      {/* SSID row */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Wifi className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground font-display truncate">
            {ssid}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPublic ? "Public" : "Private"} Network
          </p>
        </div>
        <SignalBars strength={signalStrength} />
      </div>

      {/* Encryption + badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${ENC_COLORS[encryptionType]}`}
        >
          <Lock className="w-3 h-3" />
          {encryptionType}
        </span>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isPublic
              ? "text-cyber-moderate border-cyber-moderate/30 bg-cyber-moderate/10"
              : "text-cyber-safe border-cyber-safe/30 bg-cyber-safe/10"
          }`}
        >
          <Radio className="w-3 h-3" />
          {isPublic ? "Public" : "Private"}
        </span>
        {isOpen && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border text-cyber-dangerous border-cyber-dangerous/30 bg-cyber-dangerous/10">
            <Signal className="w-3 h-3" />
            Open
          </span>
        )}
      </div>
    </div>
  );
}
