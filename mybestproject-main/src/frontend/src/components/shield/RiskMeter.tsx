import { useEffect, useRef, useState } from "react";

interface RiskMeterProps {
  score: number;
  isScanning: boolean;
}

const SAFE_COLOR = "oklch(0.82 0.32 140)";
const MODERATE_COLOR = "oklch(0.76 0.35 65)";
const DANGER_COLOR = "oklch(0.68 0.35 25)";

function getColor(s: number) {
  if (s <= 30) return SAFE_COLOR;
  if (s <= 70) return MODERATE_COLOR;
  return DANGER_COLOR;
}

export default function RiskMeter({ score, isScanning }: RiskMeterProps) {
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayedRef = useRef(0);

  useEffect(() => {
    if (isScanning) {
      setDisplayed(0);
      displayedRef.current = 0;
      return;
    }
    if (animRef.current) clearInterval(animRef.current);
    const start = displayedRef.current;
    const diff = score - start;
    const steps = 40;
    let step = 0;
    animRef.current = setInterval(() => {
      step++;
      const val = Math.round(start + (diff * step) / steps);
      displayedRef.current = val;
      setDisplayed(val);
      if (step >= steps) {
        if (animRef.current) clearInterval(animRef.current);
        displayedRef.current = score;
        setDisplayed(score);
      }
    }, 25);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [score, isScanning]);

  const radius = 52;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * radius;
  const arcPct = (displayed / 100) * 0.75;
  const color = getColor(displayed);

  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 128 128"
      className="block"
      role="img"
      aria-label={`Risk score: ${displayed} out of 100`}
    >
      <title>Risk Score Meter</title>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="8"
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        strokeDashoffset={-(circumference * 0.125)}
        strokeLinecap="round"
        style={{ transform: "rotate(135deg)", transformOrigin: "64px 64px" }}
      />
      {/* Progress */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${circumference * arcPct} ${circumference * (1 - arcPct)}`}
        strokeDashoffset={-(circumference * 0.125)}
        strokeLinecap="round"
        style={{
          transform: "rotate(135deg)",
          transformOrigin: "64px 64px",
          filter: `drop-shadow(0 0 6px ${color})`,
          transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill={color}
        style={{
          fontSize: "22px",
          fontWeight: 700,
          fontFamily: "Space Grotesk, sans-serif",
        }}
      >
        {isScanning ? "--" : displayed}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        style={{
          fontSize: "9px",
          letterSpacing: "0.08em",
          fontFamily: "Space Grotesk, sans-serif",
        }}
      >
        RISK SCORE
      </text>
    </svg>
  );
}
