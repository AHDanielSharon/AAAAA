import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import {
  Film,
  Grid3X3,
  LogOut,
  Play,
  Settings,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EditProfileDialog from "../components/EditProfileDialog";
import StoryCard from "../components/StoryCard";
import StoryViewer from "../components/StoryViewer";
import UploadStoryDialog from "../components/UploadStoryDialog";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import {
  useGetActiveStoriesByUser,
  useGetAllVideos,
  useGetCallerUserProfile,
} from "../hooks/useQueries";

export default function ProfilePage() {
  const { clear, identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: allVideos, isLoading: videosLoading } = useGetAllVideos();
  
  // Support demo mode: use mock principal if no real identity
  const principal = identity?.getPrincipal() || { toString: () => "demo-user", isAnonymous: () => false } as any;
  const isDemoMode = !identity;
  const { data: userStories } = useGetActiveStoriesByUser(principal);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const userVideos = allVideos?.filter(
    (video) => principal && video.creator.toString() === principal.toString(),
  );

  const handleLogout = async () => {
    if (isDemoMode) {
      localStorage.removeItem("socionet_demo_mode");
      localStorage.removeItem("socionet_myProfile");
      window.location.reload();
      return;
    }
    await clear();
    queryClient.clear();
  };


  return (
    <div className="min-h-screen bg-background safe-pb-nav animate-page-in">
      {/* ═══ COVER BANNER (click to upload) ═══ */}
      <div className="relative h-48 w-full overflow-hidden group cursor-pointer"
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
              const { storage, getCurrentUid } = await import("../firebase");
              const storageRef = ref(storage, `banners/${getCurrentUid()}_${Date.now()}`);
              await uploadBytes(storageRef, file);
              const url = await getDownloadURL(storageRef);
              localStorage.setItem("socionet_banner", url);
              window.location.reload();
            } catch (err) {
              console.error("Banner upload failed:", err);
              const url = URL.createObjectURL(file);
              localStorage.setItem("socionet_banner", url);
              window.location.reload();
            }
          };
          input.click();
        }}
      >
        {localStorage.getItem("socionet_banner") ? (
          <img src={localStorage.getItem("socionet_banner")!} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary animate-gradient-shift bg-[length:200%_200%]" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full">📷 Change Cover</span>
        </div>
        <div className="absolute top-6 right-6 flex gap-2">
          <button onClick={(e) => e.stopPropagation()} className="p-2.5 rounded-full glass text-white hover:bg-white/20 transition-colors">
            <Settings size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="p-2.5 rounded-full glass text-white hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={20} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* ═══ PROFILE INFO ═══ */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="flex items-end justify-between mb-6">
          <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-tr from-primary to-accent shadow-premium-lg">
            <div className="p-1 bg-background rounded-[2.4rem]">
              <Avatar className="h-24 w-24 rounded-[2.3rem]">
                <AvatarImage src={userProfile?.avatar?.getDirectURL()} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                  {userProfile?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-1 -right-1">
              <UploadStoryDialog />
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <EditProfileDialog currentProfile={userProfile || { name: "", bio: "", avatar: null, balance: BigInt(0) } as any} />
            <button className="p-2.5 rounded-2xl glass-morphism !rounded-2xl border-none hover:bg-muted/50 transition-colors">
              <Share2 size={20} className="text-foreground" />
            </button>
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-black tracking-tighter">{userProfile?.name || "User"}</h1>
          <p className="text-sm text-muted-foreground font-medium">@{principal.toString().slice(0, 8)}</p>
          {userProfile?.bio && (
            <p className="text-sm leading-relaxed max-w-md pt-2">{userProfile.bio}</p>
          )}
        </div>

        {/* ═══ STATS ═══ */}
        <div className="flex gap-8 py-6 border-y border-border/10">
          <StatItem label="Posts" value={userVideos?.length || 0} />
          <StatItem label="Followers" value={0} />
          <StatItem label="Following" value={0} />
        </div>
      </div>

      {/* ═══ CONTENT TABS ═══ */}
      <div className="flex mt-2 border-b border-border/10">
        <TabItem 
          active={activeTab === "posts"} 
          onClick={() => setActiveTab("posts")} 
          icon={<Grid3X3 size={20} />} 
          label="Posts" 
        />
        <TabItem 
          active={activeTab === "reels"} 
          onClick={() => setActiveTab("reels")} 
          icon={<Film size={20} />} 
          label="Reels" 
        />
      </div>

      {/* ═══ MEDIA GRID ═══ */}
      <div className="p-4">
        {videosLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-square rounded-3xl" />)}
          </div>
        ) : userVideos?.length ? (
          <div className="grid grid-cols-3 gap-3">
            {userVideos.map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="relative aspect-square rounded-3xl overflow-hidden group cursor-pointer"
              >
                <video 
                  src={video.file.getDirectURL()} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={24} className="text-white fill-white" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Film size={24} className="text-muted-foreground" />
            </div>
            <p className="font-bold">No posts yet</p>
            <p className="text-sm text-muted-foreground">Share your first moment</p>
          </div>
        )}
      </div>

      <StoryViewer
        stories={userStories || []}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-black tracking-tight">{value}</span>
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}

function TabItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-4 relative transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="profile-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
        />
      )}
    </button>
  );
}
