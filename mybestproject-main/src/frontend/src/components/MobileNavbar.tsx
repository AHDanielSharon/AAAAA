import { Link, useRouterState } from "@tanstack/react-router";
import {
  Clapperboard, Home, MessageCircle, Search, ShieldCheck, User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Search, label: "Search" },
  { path: "/reels", icon: Clapperboard, label: "Reels" },
  { path: "/shield", icon: ShieldCheck, label: "Shield" },
  { path: "/messages", icon: MessageCircle, label: "Chat" },
  { path: "/profile", icon: User, label: "You" },
] as const;

export default function MobileNavbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Hide nav on full-screen pages
  if (currentPath === "/messages" || currentPath === "/reels") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-3 mb-2">
        <div
          className="flex items-center justify-around h-[60px] rounded-2xl overflow-hidden px-1"
          style={{
            background: "oklch(var(--card) / 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid oklch(var(--border) / 0.2)",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.15), 0 0 20px oklch(var(--primary) / 0.08)",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-glow"
                    className="absolute inset-0 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                      background: "oklch(var(--primary) / 0.12)",
                      boxShadow: "0 0 16px oklch(var(--primary) / 0.3)",
                    }}
                  />
                )}
                <motion.div
                  animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
                  className="relative z-10"
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`transition-colors duration-200 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </motion.div>
                <span className={`text-[9px] font-bold mt-0.5 relative z-10 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
