import type { ThreatFactor } from "../../hooks/useNetworkSafety";

const SEVERITY_STYLES = {
  high: "border-cyber-dangerous/30 bg-cyber-dangerous/5 text-cyber-dangerous",
  medium: "border-cyber-moderate/30 bg-cyber-moderate/5 text-cyber-moderate",
  low: "border-primary/20 bg-primary/5 text-primary",
};

export default function ThreatFactorsList({
  factors,
}: { factors: ThreatFactor[] }) {
  if (!factors.length) return null;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 space-y-2"
      data-ocid="shield.threat_factors"
    >
      <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
        Detected Risk Factors
      </h3>
      {factors.map((f) => (
        <div
          key={f.id}
          className={`flex items-start gap-3 p-3 rounded-xl border ${SEVERITY_STYLES[f.severity]}`}
        >
          <span className="text-lg leading-none mt-0.5" aria-hidden="true">
            {f.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold truncate">{f.label}</p>
              <span className="text-xs font-bold shrink-0">+{f.score}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {f.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
