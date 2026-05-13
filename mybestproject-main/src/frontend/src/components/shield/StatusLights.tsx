interface StatusLightsProps {
  networkOk: boolean;
  encryptionOk: boolean;
  vpnOk: boolean;
}

function Light({
  active,
  label,
  animation,
}: { active: boolean; label: string; animation: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-3 h-3 rounded-full ${animation}`}
        style={{
          background: active ? "oklch(0.82 0.32 140)" : "oklch(0.68 0.35 25)",
          boxShadow: active
            ? "0 0 8px oklch(0.82 0.32 140 / 0.8)"
            : "0 0 8px oklch(0.68 0.35 25 / 0.6)",
        }}
        aria-hidden="true"
      />
      <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">
        {label}
      </span>
    </div>
  );
}

export default function StatusLights({
  networkOk,
  encryptionOk,
  vpnOk,
}: StatusLightsProps) {
  return (
    <div
      className="flex items-center justify-center gap-8"
      data-ocid="shield.status_lights"
    >
      <Light
        active={networkOk}
        label="Network"
        animation={networkOk ? "animate-safe-pulse" : "animate-danger-pulse"}
      />
      <Light
        active={encryptionOk}
        label="Encrypt"
        animation={
          encryptionOk ? "animate-safe-pulse" : "animate-warning-pulse"
        }
      />
      <Light
        active={vpnOk}
        label="VPN"
        animation={vpnOk ? "animate-safe-pulse" : "animate-danger-pulse"}
      />
    </div>
  );
}
