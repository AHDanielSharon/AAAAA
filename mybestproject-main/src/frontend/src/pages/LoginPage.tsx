import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight } from "lucide-react";
import { signUpWithEmail, loginWithEmail } from "../firebase";

interface LoginPageProps {
  onLogin?: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Enter your name"); setLoading(false); return; }
        const uid = await signUpWithEmail(email, password);
        // Save profile to Firestore
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("../firebase");
        await setDoc(doc(db, "users", uid), {
          name: name.trim(),
          bio: "",
          avatarUrl: "",
          email: email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          following: [],
          followers: [],
        });
      } else {
        await loginWithEmail(email, password);
      }
      if (onLogin) onLogin();
      window.location.href = "/";
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") setError("Account exists. Switch to Login.");
      else if (code === "auth/invalid-credential" || code === "auth/wrong-password") setError("Wrong email or password.");
      else if (code === "auth/user-not-found") setError("No account found. Sign up first.");
      else if (code === "auth/weak-password") setError("Password must be 6+ characters.");
      else if (code === "auth/invalid-email") setError("Invalid email address.");
      else setError(err?.message || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl"
            style={{ boxShadow: "0 0 40px oklch(var(--primary) / 0.4)" }}
          >
            <Sparkles className="text-white" size={36} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            SOCIONET
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="relative"
            >
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-13 pl-12 pr-4 rounded-2xl bg-muted/40 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                style={{ height: 52 }}
              />
            </motion.div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 rounded-2xl bg-muted/40 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
              style={{ height: 52 }}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-12 pr-12 rounded-2xl bg-muted/40 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
              style={{ height: 52 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm font-medium text-center bg-red-500/10 rounded-xl px-4 py-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              height: 52,
              boxShadow: "0 0 30px oklch(var(--primary) / 0.3)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Login" : "Create Account"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              className="text-primary font-bold hover:underline"
            >
              {mode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
