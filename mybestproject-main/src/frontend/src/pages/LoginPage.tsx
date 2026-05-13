import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Film, Lock, MessageCircle, Sparkles, Zap, ShieldCheck, Rocket } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ThemeToggle from "../components/ThemeToggle";
import { Button } from "../components/ui/button";

const FEATURES = [
  { icon: Film, title: "Reels", desc: "Immersive Video", color: "text-primary" },
  { icon: Zap, title: "Stories", desc: "Daily Moments", color: "text-accent" },
  { icon: MessageCircle, title: "Chat", desc: "Secure DMs", color: "text-secondary" },
];

interface LoginPageProps {
  onDemoLogin?: () => void;
}

export default function LoginPage({ onDemoLogin }: LoginPageProps) {
  const { login, loginStatus, loginError, isInitializing } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = useCallback(async () => {
    if (isInitializing || isLoggingIn) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await login();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Login failed. Please try again.");
    }
  }, [login, isInitializing, isLoggingIn]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background p-6">
      {/* ═══ ANIMATED BACKGROUND ═══ */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.08)_0%,transparent_70%)]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-12"
        >
          <div className="relative p-1 rounded-[3rem] bg-gradient-to-tr from-primary via-accent to-secondary animate-gradient-shift shadow-2xl">
            <div className="p-4 bg-background rounded-[2.8rem]">
              <img 
                src="/assets/generated/socionet-logo-transparent.dim_200x200.png" 
                alt="Logo" 
                className="w-24 h-24 object-contain animate-floating" 
              />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border border-dashed border-primary/20 rounded-[4rem] pointer-events-none" 
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-16"
        >
          <h1 className="text-6xl font-black tracking-tighter font-display">
            SOCIO<span className="text-primary">NET</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-xs mx-auto">
            The next generation of social interaction, powered by <span className="text-foreground font-bold">Web3</span>.
          </p>
        </motion.div>

        {/* ═══ FEATURES ═══ */}
        <div className="grid grid-cols-3 gap-4 w-full mb-16">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="flex flex-col items-center gap-3 p-4 rounded-3xl glass border-none shadow-premium-sm"
            >
              <f.icon size={24} className={f.color} />
              <div className="space-y-0.5">
                <p className="text-xs font-black uppercase tracking-widest">{f.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══ CTA BUTTONS ═══ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full space-y-4"
        >
          {/* Primary: Enter with Demo Mode (works without Docker) */}
          <Button
            onClick={onDemoLogin}
            className="w-full h-16 rounded-[2rem] text-lg font-black bg-primary text-primary-foreground hover:opacity-90 shadow-premium-lg transition-all active:scale-95 group relative overflow-hidden"
          >
            <span className="flex items-center gap-3 relative z-10">
              <Rocket size={20} />
              Enter Socionet
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          </Button>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">End-to-End Privacy Guaranteed</span>
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">
        Global Network • 2026 • SocioNet Labs
      </footer>
    </div>
  );
}
