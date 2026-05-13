import { Lightbulb } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const TIPS = [
  "Always use WPA3 encryption on your home router for maximum protection.",
  "Avoid accessing banking sites on public WiFi networks.",
  "A VPN encrypts your traffic end-to-end, even on unsecured networks.",
  "Watch for networks with generic names like 'FreeWiFi' — they may be traps.",
  "Ensure your device's firewall is active on all connections.",
  "Use HTTPS websites only when connected to public networks.",
  "Regularly change your WiFi password and use WPA3 if available.",
  "Two-factor authentication protects your accounts even if passwords leak.",
];

export default function CyberSafetyTips() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4"
      data-ocid="shield.safety_tips"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-cyber-moderate" />
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Cyber Safety Tips
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {index + 1}/{TIPS.length}
        </span>
      </div>
      <div className="relative overflow-hidden min-h-[48px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-sm text-foreground/80 leading-relaxed"
          >
            {TIPS[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      {/* Dot indicators */}
      <div className="flex gap-1 mt-3 justify-center">
        {TIPS.map((tip, i) => (
          <button
            type="button"
            key={tip.substring(0, 20)}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-cyber-moderate" : "w-1.5 bg-white/20"
            }`}
            aria-label={`Tip ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
