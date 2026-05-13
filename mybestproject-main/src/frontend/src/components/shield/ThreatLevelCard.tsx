import type { RiskLevel } from "../../hooks/useNetworkSafety";

interface ThreatLevelCardProps {
  riskLevel: RiskLevel;
  riskScore: number;
  isScanning: boolean;
}

const LEVEL_CONFIG = {
  SECURE: {
    color: "oklch(0.82 0.32 140)",
    bgClass: "bg-cyber-safe/10 border-cyber-safe/30",
    textClass: "text-cyber-safe",
    barClass: "bg-cyber-safe",
    animation: "animate-safe-pulse",
    dotColor: "bg-cyber-safe",
    label: "SECURE",
    emoji: "✓",
  },
  "MODERATE RISK": {
    color: "oklch(0.76 0.35 65)",
    bgClass: "bg-cyber-moderate/10 border-cyber-moderate/30",
    textClass: "text-cyber-moderate",
    barClass: "bg-cyber-moderate",
    animation: "animate-warning-pulse",
    dotColor: "bg-cyber-moderate",
    label: "MODERATE RISK",
    emoji: "⚠",
  },
  DANGEROUS: {
    color: "oklch(0.68 0.35 25)",
    bgClass: "bg-cyber-dangerous/10 border-cyber-dangerous/30",
    textClass: "text-cyber-dangerous",
    barClass: "bg-cyber-dangerous",
    animation: "animate-danger-pulse",
    dotColor: "bg-cyber-dangerous",
    label: "DANGEROUS",
    emoji: "✕",
  },
};

export default function ThreatLevelCard({
  riskLevel,
  riskScore,
  isScanning,
}: ThreatLevelCardProps) {
  const cfg = LEVEL_CONFIG[riskLevel];

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl p-4 ${cfg.bgClass}`}
      data-ocid="shield.threat_level_card"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Threat Level
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor} ${cfg.animation}`}
            aria-hidden="true"
          />
          <span className={`text-xs font-bold ${cfg.textClass}`}>
            {isScanning ? "SCANNING..." : cfg.label}
          </span>
        </div>
      </div>

      {/* Risk bar */}
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${cfg.barClass}`}
          style={{
            width: isScanning ? "0%" : `${riskScore}%`,
            boxShadow: `0 0 8px ${cfg.color}`,
          }}
        />
      </div>

      {/* Score labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className={`font-bold ${cfg.textClass}`}>
          {isScanning ? "Analyzing..." : `Score: ${riskScore}/100`}
        </span>
        <span>100</span>
      </div>

      {/* Zone labels */}
      <div className="flex gap-1 mt-3">
        {(["0-30 SAFE", "31-70 MODERATE", "71-100 DANGER"] as const).map(
          (z) => {
            const ZONE_STYLES = {
              "0-30 SAFE": {
                bg: "oklch(0.82 0.32 140 / 0.15)",
                color: "oklch(0.82 0.32 140)",
              },
              "31-70 MODERATE": {
                bg: "oklch(0.76 0.35 65 / 0.15)",
                color: "oklch(0.76 0.35 65)",
              },
              "71-100 DANGER": {
                bg: "oklch(0.68 0.35 25 / 0.15)",
                color: "oklch(0.68 0.35 25)",
              },
            };
            return (
              <span
                key={z}
                className="flex-1 text-center text-[9px] font-semibold rounded-sm py-0.5"
                style={{
                  background: ZONE_STYLES[z].bg,
                  color: ZONE_STYLES[z].color,
                }}
              >
                {z}
              </span>
            );
          },
        )}
      </div>
    </div>
  );
}
