interface RadarRingsProps {
  color: string;
  size?: number;
}

const RINGS = [
  { key: "inner", delay: "0s", opacity: 0.7 },
  { key: "middle", delay: "0.65s", opacity: 0.5 },
  { key: "outer", delay: "1.3s", opacity: 0.3 },
];

export default function RadarRings({ color, size = 56 }: RadarRingsProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      {RINGS.map((ring) => (
        <span
          key={ring.key}
          className="absolute rounded-full animate-cyber-radar"
          style={{
            width: size,
            height: size,
            border: `2px solid ${color}`,
            opacity: ring.opacity,
            animationDelay: ring.delay,
          }}
        />
      ))}
    </div>
  );
}
