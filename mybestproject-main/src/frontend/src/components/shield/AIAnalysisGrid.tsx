import { Brain, ShieldCheck } from "lucide-react";

interface AIAnalysisGridProps {
  trustScore: number;
  riskScore: number;
  isScanning: boolean;
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${value}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
    </div>
  );
}

export default function AIAnalysisGrid({
  trustScore,
  riskScore,
  isScanning,
}: AIAnalysisGridProps) {
  const threatPct = Math.min(100, Math.round(riskScore * 1.1));
  const trustColor =
    trustScore > 70
      ? "oklch(0.82 0.32 140)"
      : trustScore > 30
        ? "oklch(0.76 0.35 65)"
        : "oklch(0.68 0.35 25)";
  const threatColor =
    riskScore <= 30
      ? "oklch(0.82 0.32 140)"
      : riskScore <= 70
        ? "oklch(0.76 0.35 65)"
        : "oklch(0.68 0.35 25)";

  return (
    <div className="grid grid-cols-2 gap-3" data-ocid="shield.ai_grid">
      {/* Trust Score */}
      <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground">
            Trust Score
          </span>
        </div>
        <p
          className="text-2xl font-bold font-display"
          style={{ color: trustColor }}
        >
          {isScanning ? "--" : trustScore}
          <span className="text-sm font-normal text-muted-foreground">
            /100
          </span>
        </p>
        <MiniBar value={isScanning ? 0 : trustScore} color={trustColor} />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {trustScore > 70
            ? "Highly trusted"
            : trustScore > 30
              ? "Moderate trust"
              : "Low trust"}
        </p>
      </div>

      {/* Threat Prediction */}
      <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-muted-foreground">
            AI Threat
          </span>
        </div>
        <p
          className="text-2xl font-bold font-display"
          style={{ color: threatColor }}
        >
          {isScanning ? "--" : threatPct}
          <span className="text-sm font-normal text-muted-foreground">%</span>
        </p>
        <MiniBar value={isScanning ? 0 : threatPct} color={threatColor} />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {threatPct < 30
            ? "Low threat prob."
            : threatPct < 70
              ? "Medium threat"
              : "High threat prob."}
        </p>
      </div>
    </div>
  );
}
