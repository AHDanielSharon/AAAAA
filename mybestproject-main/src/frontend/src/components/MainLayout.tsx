import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  Clapperboard,
  Home,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import AIAssistant from "./AIAssistant";
import InstallPWA from "./InstallPWA";
import MobileNavbar from "./MobileNavbar";
import NotificationBadge from "./NotificationBadge";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Search, label: "Explore" },
  { path: "/reels", icon: Clapperboard, label: "Reels" },
  { path: "/shield", icon: ShieldCheck, label: "Shield" },
  { path: "/messages", icon: MessageCircle, label: "Messages" },
  { path: "/profile", icon: User, label: "Profile" },
] as const;

const SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 24,
  mass: 0.9,
};

export default function MainLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleNavigate = (path: string) => {
    navigate({
      to: path as
        | "/"
        | "/explore"
        | "/reels"
        | "/shield"
        | "/messages"
        | "/profile",
    });
  };

  return (
    <div className="flex bg-background min-h-screen selection:bg-primary/20">
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <nav
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40
          w-20 xl:w-64 border-r border-border/40 bg-card/40 backdrop-blur-3xl
          transition-all duration-500 ease-in-out"
      >
        <div className="flex items-center gap-3 px-6 py-8">
          <motion.img
            src="/assets/generated/socionet-logo-transparent.dim_200x200.png"
            alt="SOCIONET"
            className="h-10 w-10 shadow-premium-lg rounded-2xl"
            whileHover={{ rotate: 10, scale: 1.1 }}
          />
          <span className="hidden xl:block text-xl font-black tracking-tighter text-primary font-display">
            SOCIONET
          </span>
        </div>

        <div className="flex flex-col gap-2 px-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300
                  ${isActive 
                    ? "bg-primary/10 text-primary shadow-premium-sm" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
              >
                <Icon className={`h-6 w-6 transition-transform duration-300 group-hover:scale-110 ${isActive ? "scale-110" : ""}`} />
                <span className="hidden xl:block font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-border/40 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBadge />
          </div>
        </div>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col md:ml-20 xl:ml-64 transition-all duration-500">
        <main className="flex-1 w-full max-w-screen-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full min-h-screen"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ═══ MOBILE NAVIGATION ═══ */}
      <MobileNavbar />
      
      {/* ═══ GLOBAL UI ELEMENTS ═══ */}
      <AIAssistant onNavigate={handleNavigate} />
      <InstallPWA />
    </div>
  );
}
