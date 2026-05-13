import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import {
  ArrowLeft,
  Film,
  Grid3X3,
  MessageCircle,
  Play,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FriendRequestStatus } from "../backend";
import StoryCard from "../components/StoryCard";
import StoryViewer from "../components/StoryViewer";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import {
  useGetActiveStoriesByUser,
  useGetFriendRequestStatus,
  useGetFriends,
  useGetUserProfile,
  useGetVideosByCreator,
  useSendFriendRequest,
  useStartChatWithUser,
} from "../hooks/useQueries";

interface UserProfilePageProps {
  userPrincipal: Principal;
  onBack: () => void;
  onMessage?: (principal: Principal) => void;
}

export default function UserProfilePage({
  userPrincipal,
  onBack,
  onMessage,
}: UserProfilePageProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfile(userPrincipal);
  const { data: userVideos, isLoading: videosLoading } = useGetVideosByCreator(userPrincipal);
  const { data: userStories } = useGetActiveStoriesByUser(userPrincipal);
  const { data: friendRequestStatus } = useGetFriendRequestStatus(userPrincipal);
  const { data: friends = [] } = useGetFriends();
  const sendFriendRequestMutation = useSendFriendRequest();
  const startChatMutation = useStartChatWithUser();

  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");
  const [viewerOpen, setViewerOpen] = useState(false);

  const currentUserPrincipal = identity?.getPrincipal();
  const isOwnProfile = currentUserPrincipal?.toString() === userPrincipal.toString();
  const isFriend = friends.some(f => f.toString() === userPrincipal.toString());
  const areFriends = isFriend || friendRequestStatus === FriendRequestStatus.accepted;

  const handleMessage = async () => {
    try {
      await startChatMutation.mutateAsync(userPrincipal);
      if (onMessage) onMessage(userPrincipal);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-pb-nav animate-page-in">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 glass border-none shadow-premium-sm px-4 h-16 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-full hover:bg-muted transition-colors active:scale-90"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-black tracking-tighter truncate">
          {userProfile?.name || "Profile"}
        </h1>
      </header>

      {/* ═══ COVER BANNER ═══ */}
      <div className="relative h-40 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary to-accent animate-gradient-shift bg-[length:200%_200%]" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* ═══ PROFILE INFO ═══ */}
      <div className="px-6 -mt-10 relative z-10">
        <div className="flex items-end justify-between mb-6">
          <div className="p-1 rounded-[2.5rem] bg-gradient-to-tr from-secondary to-primary shadow-premium-lg">
            <div className="p-1 bg-background rounded-[2.4rem]">
              <Avatar className="h-20 w-20 rounded-[2.3rem]">
                <AvatarImage src={userProfile?.avatar?.getDirectURL()} />
                <AvatarFallback className="bg-secondary/10 text-secondary text-2xl font-black">
                  {userProfile?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex gap-2 mb-2 w-full max-w-[200px]">
            {areFriends ? (
              <button className="flex-1 h-11 rounded-2xl bg-muted text-foreground font-bold text-sm flex items-center justify-center gap-2">
                <UserCheck size={18} />
                Friends
              </button>
            ) : (
              <button 
                onClick={() => sendFriendRequestMutation.mutate(userPrincipal)}
                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-premium-md active:scale-95 transition-all"
              >
                <UserPlus size={18} />
                Follow
              </button>
            )}
            <button 
              onClick={handleMessage}
              className="p-2.5 rounded-2xl glass-morphism !rounded-2xl border-none hover:bg-muted/50 transition-colors"
            >
              <MessageCircle size={22} className="text-foreground" />
            </button>
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-black tracking-tighter">{userProfile?.name || "User"}</h1>
          <p className="text-sm text-muted-foreground font-medium">@{userPrincipal.toString().slice(0, 8)}</p>
          {userProfile?.bio && (
            <p className="text-sm leading-relaxed max-w-md pt-2">{userProfile.bio}</p>
          )}
        </div>

        {/* ═══ STATS ═══ */}
        <div className="flex gap-8 py-6 border-y border-border/10">
          <StatItem label="Posts" value={userVideos?.length || 0} />
          <StatItem label="Followers" value="850" />
          <StatItem label="Following" value="210" />
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
                  src={video.video.getDirectURL()} 
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
            <p className="text-sm text-muted-foreground">This creator hasn't shared anything yet</p>
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
          layoutId="user-profile-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
        />
      )}
    </button>
  );
}
