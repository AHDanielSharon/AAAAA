import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import MainLayout from "./components/MainLayout";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import ExplorePage from "./pages/ExplorePage";
import FeedPage from "./pages/FeedPage";
import LoginPage from "./pages/LoginPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import ReelsPage from "./pages/ReelsPage";
import ShieldPage from "./pages/ShieldPage";
import IncomingCallListener from "./components/IncomingCallListener";

const rootRoute = createRootRoute({
  component: MainLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FeedPage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});

const reelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reels",
  component: ReelsPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: MessagesPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const shieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shield",
  component: ShieldPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  reelsRoute,
  messagesRoute,
  profileRoute,
  shieldRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function PushSubscriber() {
  usePushNotifications();
  return null;
}

function AuthenticatedApp() {
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup = !profileLoading && isFetched && userProfile === null;

  return (
    <ThemeProvider>
      <PushSubscriber />
      <IncomingCallListener />
      <RouterProvider router={router} />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </ThemeProvider>
  );
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    import("firebase/auth").then(({ onAuthStateChanged: listen }) => {
      import("./firebase").then(({ auth }) => {
        listen(auth, (user) => {
          setFirebaseUser(user);
          setAuthChecked(true);
        });
      });
    }).catch(() => setAuthChecked(true));
  }, []);

  // Service Worker ringtone handler
  useEffect(() => {
    let ringCtx: AudioContext | null = null;
    let ringTimeout: ReturnType<typeof setTimeout> | null = null;

    function startRing(durationMs: number) {
      stopRing();
      try {
        const ctx = new AudioContext();
        ringCtx = ctx;
        const totalEnd = ctx.currentTime + durationMs / 1000;
        const pattern = [
          { freq: 440, duration: 0.3 },
          { freq: 0, duration: 0.15 },
          { freq: 480, duration: 0.3 },
          { freq: 0, duration: 0.5 },
        ];
        let t = ctx.currentTime + 0.05;
        while (t < totalEnd) {
          for (const step of pattern) {
            if (step.freq > 0) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = step.freq;
              osc.type = "sine";
              gain.gain.setValueAtTime(0.4, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + step.duration);
              osc.start(t);
              osc.stop(t + step.duration);
            }
            t += step.duration;
            if (t >= totalEnd) break;
          }
        }
        ringTimeout = setTimeout(stopRing, durationMs + 200);
      } catch {}
    }

    function stopRing() {
      if (ringTimeout) { clearTimeout(ringTimeout); ringTimeout = null; }
      if (ringCtx) { ringCtx.close().catch(() => {}); ringCtx = null; }
    }

    function handleSWMessage(event: MessageEvent) {
      if (!event.data) return;
      if (event.data.type === "INCOMING_CALL") startRing(45000);
      if (event.data.type === "PLAY_RINGTONE") startRing(event.data.durationMs ?? 45000);
      if (event.data.type === "STOP_RINGTONE") stopRing();
    }

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
      stopRing();
    };
  }, []);

  // Loading screen
  if (!authChecked) {
    return (
      <ThemeProvider>
        <div className="flex h-[100dvh] items-center justify-center gradient-bg">
          <div className="text-center px-4">
            <img
              src="/assets/generated/socionet-logo-transparent.dim_200x200.png"
              alt="SOCIONET"
              className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4 animate-floating"
            />
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // If user is logged in → show the app
  if (firebaseUser) {
    return <AuthenticatedApp />;
  }

  // Show login page
  return (
    <ThemeProvider>
      <LoginPage />
      <Toaster />
    </ThemeProvider>
  );
}
