import type { Principal } from "@icp-sdk/core/principal";
import { Bell, RefreshCw, Search, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import FeedVideoCard from "../components/FeedVideoCard";
import StoryCard from "../components/StoryCard";
import StoryViewer from "../components/StoryViewer";
import UploadStoryDialog from "../components/UploadStoryDialog";
import UploadVideoDialog from "../components/UploadVideoDialog";
import { Skeleton } from "../components/ui/skeleton";
import { useGetAllActiveStories, useGetAllVideos } from "../hooks/useQueries";
import UserProfilePage from "./UserProfilePage";

type View = "feed" | "profile";
type FeedTab = "for-you" | "following";

function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <Skeleton className="h-[58px] w-[58px] rounded-full" />
      <Skeleton className="h-2 w-12 rounded" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="w-full animate-pulse border-b border-border/20">
      <div className="flex items-center gap-3 px-3 pt-4 pb-2">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <Skeleton className="w-full aspect-[4/5]" />
      <div className="px-3 py-3 space-y-2.5">
        <Skeleton className="h-3.5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data: videos, isLoading: videosLoading, refetch } = useGetAllVideos();
  const { data: stories, isLoading: storiesLoading } = useGetAllActiveStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [currentView, setCurrentView] = useState<View>("feed");
  const [viewingProfile, setViewingProfile] = useState<Principal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const groupedStories = stories?.reduce(
    (acc, story) => {
      const creatorId = story.creator.toString();
      if (!acc[creatorId]) acc[creatorId] = [];
      acc[creatorId].push(story);
      return acc;
    },
    {} as Record<string, typeof stories>,
  );
  const storyGroups = groupedStories ? Object.values(groupedStories) : [];

  const filteredVideos = videos?.filter(
    (v) =>
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleStoryClick = (groupIndex: number) => {
    setSelectedStoryIndex(groupIndex);
    setViewerOpen(true);
  };

  const handleCreatorClick = (creatorPrincipal: Principal) => {
    setViewingProfile(creatorPrincipal);
    setCurrentView("profile");
  };

  const handleBackFromProfile = () => {
    setViewingProfile(null);
    setCurrentView("feed");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (currentView === "profile" && viewingProfile) {
    return (
      <UserProfilePage
        userPrincipal={viewingProfile}
        onBack={handleBackFromProfile}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-background safe-pb-nav">
      {/* ═══ PREMIUM HEADER ═══ */}
      <header className="sticky top-0 z-40 glass border-none shadow-premium-sm">
        <div className="flex items-center justify-between px-6 h-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <h1 className="text-2xl font-black tracking-tighter text-primary font-display">
              SOCIONET
            </h1>
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-1.5 rounded-full hover:bg-primary/10 transition-colors ${isRefreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw size={14} className="text-primary/60" />
            </button>
          </motion.div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-full hover:bg-muted/50 transition-all active:scale-90"
            >
              <Search size={22} className="text-foreground/80" />
            </button>
            <button className="p-2.5 rounded-full hover:bg-muted/50 transition-all active:scale-90 relative">
              <Bell size={22} className="text-foreground/80" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background" />
            </button>
          </div>
        </div>

        {/* ═══ SEARCH OVERLAY ═══ */}
        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-4 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search creators and videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-morphism !rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 ring-primary/20 outline-none"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ STORIES STRIP ═══ */}
        <div className="flex gap-4 px-6 py-4 overflow-x-auto hide-scrollbar snap-x">
          <UploadStoryDialog
            trigger={
              <button className="flex flex-col items-center gap-2 shrink-0 snap-start group">
                <div className="relative w-16 h-16 rounded-[1.5rem] bg-muted/50 flex items-center justify-center border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold">
                    +
                  </div>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">You</span>
              </button>
            }
          />

          {storiesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                <div className="w-16 h-16 rounded-[1.5rem] bg-muted" />
                <div className="w-10 h-2 bg-muted rounded" />
              </div>
            ))
          ) : (
            storyGroups.map((group, index) => (
              <button
                key={group[0].id}
                onClick={() => handleStoryClick(index)}
                className="flex flex-col items-center gap-2 shrink-0 snap-start"
              >
                <div className="p-[2px] rounded-[1.5rem] bg-gradient-to-tr from-primary via-accent to-primary animate-gradient-shift">
                  <div className="p-0.5 bg-background rounded-[1.4rem]">
                    <div className="w-[60px] h-[60px] rounded-[1.3rem] overflow-hidden">
                      <StoryCard story={group[0]} />
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold truncate w-16 text-center">
                  {group[0].creator.toString().slice(0, 8)}
                </span>
              </button>
            ))
          )}
        </div>

        {/* ═══ TAB SWITCHER ═══ */}
        <div className="flex px-6 border-t border-border/10">
          {(["for-you", "following"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-4 relative group"
            >
              <span className={`text-sm font-bold transition-colors ${activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "for-you" ? "For You" : "Following"}
              </span>
              {activeTab === tab && (
                <motion.div 
                  layoutId="feed-tab-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full shadow-premium-sm"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ═══ FEED CONTENT ═══ */}
      <div className="max-w-2xl mx-auto py-4">
        {videosLoading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filteredVideos?.length ? (
          <div className="space-y-6 px-4 md:px-0">
            {filteredVideos.map((video, idx) => (
              <FeedVideoCard
                key={video.id}
                video={video}
                onCreatorClick={handleCreatorClick}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
            <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <Video size={40} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-8">
              {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : "The feed is empty. Start by following some creators!"}
            </p>
            <UploadVideoDialog />
          </div>
        )}
      </div>

      <StoryViewer
        stories={storyGroups[selectedStoryIndex] || []}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
