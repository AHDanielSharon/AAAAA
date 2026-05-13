import { Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const LOG_TEMPLATES = [
  "Scanning network topology...",
  "Checking encryption protocols...",
  "AI threat analysis in progress...",
  "Analyzing DNS resolution patterns...",
  "Monitoring packet integrity...",
  "Checking for rogue access points...",
  "Verifying certificate authenticity...",
  "BSSID fingerprinting complete",
  "No anomalous traffic detected",
  "Security posture evaluated",
  "Deep packet inspection running...",
  "ARP spoofing check complete",
  "Network topology mapped",
  "Threat intelligence updated",
];

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "warn" | "ok";
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function randomType(): LogEntry["type"] {
  const r = Math.random();
  if (r < 0.7) return "info";
  if (r < 0.9) return "ok";
  return "warn";
}

export default function ThreatLogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    {
      id: 1,
      time: fmtTime(new Date()),
      message: "SOCIONET Shield initialized",
      type: "ok",
    },
    {
      id: 2,
      time: fmtTime(new Date()),
      message: "Scanning network topology...",
      type: "info",
    },
    {
      id: 3,
      time: fmtTime(new Date()),
      message: "Checking encryption protocols...",
      type: "info",
    },
    {
      id: 4,
      time: fmtTime(new Date()),
      message: "AI threat analysis complete",
      type: "ok",
    },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  const counterRef = useRef(5);

  useEffect(() => {
    const t = setInterval(
      () => {
        const msg =
          LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
        const entry: LogEntry = {
          id: counterRef.current++,
          time: fmtTime(new Date()),
          message: msg,
          type: randomType(),
        };
        setLogs((prev) => {
          const next = [...prev.slice(-19), entry];
          // Scroll to bottom after state update
          requestAnimationFrame(() => {
            if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
          });
          return next;
        });
      },
      8000 + Math.random() * 4000,
    );
    return () => clearInterval(t);
  }, []);

  const typeColor: Record<LogEntry["type"], string> = {
    info: "text-primary",
    warn: "text-cyber-moderate",
    ok: "text-cyber-safe",
  };
  const typePrefix: Record<LogEntry["type"], string> = {
    info: "[INFO]",
    warn: "[WARN]",
    ok: "[ OK ]",
  };

  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl overflow-hidden"
      data-ocid="shield.threat_log"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Real-Time Threat Analysis
        </span>
        <span
          className="ml-auto w-2 h-2 rounded-full bg-cyber-safe animate-safe-pulse"
          aria-hidden="true"
        />
      </div>
      <div
        ref={ref}
        className="p-3 space-y-1 h-36 overflow-y-auto hide-scrollbar"
      >
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-2 font-mono text-[10px] leading-relaxed"
          >
            <span className="text-muted-foreground shrink-0">{log.time}</span>
            <span className={`shrink-0 font-bold ${typeColor[log.type]}`}>
              {typePrefix[log.type]}
            </span>
            <span className="text-foreground/80">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
