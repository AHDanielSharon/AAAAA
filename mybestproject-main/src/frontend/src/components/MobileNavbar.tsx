import { Link, useRouterState } from "@tanstack/react-router";
import {
  Clapperboard,
  Home,
  MessageCircle,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Search, label: "Search" },
  { path: "/reels", icon: Clapperboard, label: "Reels" },
  { path: "/shield", icon: ShieldCheck, label: "Shield" },
  { path: "/messages", icon: MessageCircle, label: "Messages" },
  { path: "/profile", icon: User, label: "Profile" },
] as const;

const SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 26,
  mass: 0.8,
};

export default function MobileNavbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto px-4 pb-2">
        <div className="flex items-center justify-around h-16 rounded-[2rem] glass shadow-premium-lg border-white/10 px-2 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-2xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <motion.div
                  animate={isActive ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
                  className="relative z-10"
                >
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors duration-300 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </motion.div>

                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
