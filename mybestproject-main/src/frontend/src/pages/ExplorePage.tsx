import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { Check, Play, Search, TrendingUp, UserPlus, Users } from "lucide-react";
import { useRef, useState } from "react";
import { FriendRequestStatus } from "../backend";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import {
  useGetAllVideos,
  useGetFriends,
  useSearchUsers,
  useSearchVideos,
  useSendFriendRequest,
} from "../hooks/useQueries";
import UserProfilePage from "./UserProfilePage";

type Tab = "videos" | "people";
type View = "explore" | "profile";

const TRENDING_TOPICS = [
  "#trending",
  "#viral",
  "#reels",
  "#creative",
  "#music",
  "#dance",
  "#comedy",
  "#tech",
  "#art",
  "#fashion",
];

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("videos");
  const [currentView, setCurrentView] = useState<View>("explore");
  const [viewingProfile, setViewingProfile] = useState<Principal | null>(null);
  const { identity } = useInternetIdentity();
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: allVideos, isLoading: allLoading } = useGetAllVideos();
  const { data: searchVideoResults, isLoading: searchVideoLoading } =
    useSearchVideos(searchTerm);
  const { data: searchUserResults, isLoading: searchUserLoading } =
    useSearchUsers(searchTerm);
  const { data: friends = [] } = useGetFriends();
  const sendFriendRequest = useSendFriendRequest();

  const videos = searchTerm ? searchVideoResults : allVideos;
  const isLoadingVideos = searchTerm ? searchVideoLoading : allLoading;
  const currentUserPrincipal = identity?.getPrincipal();

  const isFriend = (p: Principal) =>
    friends.some((f) => f.toString() === p.toString());

  const getFriendStatus = (p: Principal): FriendRequestStatus | null => {
    if (!searchUserResults) return null;
    const hasPending = searchUserResults.pendingRequests.some(
      (req) => req.sender.toString() === p.toString(),
    );
    if (hasPending) return FriendRequestStatus.pending;
    if (isFriend(p)) return FriendRequestStatus.accepted;
    return null;
  };

  const handleCreatorClick = (p: Principal) => {
    setViewingProfile(p);
    setCurrentView("profile");
  };

  const handleBackFromProfile = () => {
    setViewingProfile(null);
    setCurrentView("explore");
  };

  if (currentView === "profile" && viewingProfile) {
    return (
      <UserProfilePage
        userPrincipal={viewingProfile}
        onBack={handleBackFromProfile}
        onMessage={handleBackFromProfile}
      />
    );
  }

  const isSearching = searchTerm.length > 0;

  return (
    <div
      className="min-h-screen bg-background animate-page-in"
      data-ocid="explore.page"
    >
      {/* Sticky search header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/20 px-3 pt-3 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search SOCIONET..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-ocid="explore.search_input"
            className="w-full h-12 pl-10 pr-4 rounded-full text-sm text-foreground placeholder:text-muted-foreground bg-muted/50 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 focus:bg-card/80 transition-all duration-200 backdrop-blur-sm"
          />
        </div>

        {/* Tab switcher visible when searching */}
        {isSearching && (
          <div className="flex gap-2 mt-2.5">
            {(["videos", "people"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                data-ocid={`explore.${tab}_tab`}
                className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm neon-glow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {tab === "videos" ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {tab === "videos" ? "Videos" : "People"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Discovery content */}
      <div className="pb-6">
        {!isSearching ? (
          /* Default discovery state */
          <div className="animate-page-in">
            {/* Trending topics horizontal scroll */}
            <div className="px-3 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Trending
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {TRENDING_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    data-ocid="explore.trending_topic"
                    className="shrink-0 h-8 px-4 rounded-full text-xs font-semibold glass border border-border/40 text-foreground/80 hover:text-primary hover:border-primary/50 transition-all duration-200 active:scale-95"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Video grid - Pinterest/Instagram masonry feel */}
            {isLoadingVideos ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px] mt-1">
                {["a", "b", "c", "d", "e", "f"].map((k, i) => (
                  <Skeleton
                    key={k}
                    className={i % 3 === 1 ? "aspect-square" : "aspect-[9/16]"}
                  />
                ))}
              </div>
            ) : videos && videos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px]">
                {videos.map((video, idx) => (
                  <VideoThumb
                    key={video.id}
                    video={video}
                    index={idx + 1}
                    tall={idx % 5 !== 2}
                    onCreatorClick={() =>
                      handleCreatorClick(video.creator as unknown as Principal)
                    }
                  />
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-20 px-8"
                data-ocid="explore.videos_empty_state"
              >
                <div className="h-20 w-20 rounded-full glass border border-primary/20 flex items-center justify-center mb-5 neon-glow-sm">
                  <Play className="h-9 w-9 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground">
                  No videos yet
                </p>
                <p className="text-sm text-muted-foreground mt-2 text-center leading-relaxed">
                  Be the first to share something amazing
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Search results */
          <div className="animate-page-in">
            {activeTab === "videos" && (
              <div>
                {isLoadingVideos ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px] mt-[2px]">
                    {["a", "b", "c", "d", "e", "f"].map((k) => (
                      <Skeleton key={k} className="aspect-[9/16]" />
                    ))}
                  </div>
                ) : videos && videos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px]">
                    {videos.map((video, idx) => (
                      <VideoThumb
                        key={video.id}
                        video={video}
                        index={idx + 1}
                        tall={true}
                        onCreatorClick={() =>
                          handleCreatorClick(
                            video.creator as unknown as Principal,
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-20 px-8"
                    data-ocid="explore.videos_empty_state"
                  >
                    <div className="h-16 w-16 rounded-full glass border border-border/40 flex items-center justify-center mb-4">
                      <Search className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      No videos found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 text-center">
                      Try a different search term
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "people" && (
              <div className="px-3 pt-3" data-ocid="explore.people_list">
                {searchUserLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-4 rounded-2xl glass-card"
                      >
                        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-9 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : searchUserResults &&
                  searchUserResults.profiles.length > 0 ? (
                  <div className="space-y-3">
                    {searchUserResults.profiles.map(
                      ([principal, profile], idx) => {
                        const isOwnProfile =
                          currentUserPrincipal?.toString() ===
                          principal.toString();
                        const friendStatus = getFriendStatus(principal);
                        const isFriendUser = isFriend(principal);
                        const isAccepted =
                          friendStatus === FriendRequestStatus.accepted ||
                          isFriendUser;

                        return (
                          <div
                            key={principal.toString()}
                            data-ocid={`explore.user_card.${idx + 1}`}
                            className="flex items-center gap-3 p-4 rounded-2xl glass-card hover:scale-[1.01] transition-transform duration-200"
                          >
                            <button
                              type="button"
                              onClick={() => handleCreatorClick(principal)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border/30">
                                <AvatarImage
                                  src={profile.avatar?.getDirectURL()}
                                />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                  {profile.name[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate text-sm">
                                  {profile.name}
                                </p>
                                {profile.bio && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {profile.bio}
                                  </p>
                                )}
                                {isOwnProfile && (
                                  <span className="text-xs text-primary font-medium">
                                    You
                                  </span>
                                )}
                                {isFriendUser && !isOwnProfile && (
                                  <span className="text-xs text-secondary font-medium">
                                    Following
                                  </span>
                                )}
                              </div>
                            </button>

                            {!isOwnProfile && (
                              <div className="shrink-0">
                                {isAccepted ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCreatorClick(principal)
                                    }
                                    data-ocid={`explore.message_button.${idx + 1}`}
                                    className="h-9 px-4 rounded-full text-xs font-semibold glass-btn border border-border/60 text-foreground"
                                  >
                                    Message
                                  </button>
                                ) : friendStatus ===
                                  FriendRequestStatus.pending ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="h-9 px-4 rounded-full text-xs font-semibold bg-muted text-muted-foreground opacity-60 flex items-center gap-1.5"
                                  >
                                    <Check className="h-3 w-3" />
                                    Sent
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      sendFriendRequest.mutate(principal)
                                    }
                                    disabled={sendFriendRequest.isPending}
                                    data-ocid={`explore.add_friend_button.${idx + 1}`}
                                    className="h-9 px-4 rounded-full text-xs font-semibold bg-primary text-primary-foreground flex items-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50"
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Follow
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-20"
                    data-ocid="explore.people_empty_state"
                  >
                    <div className="h-16 w-16 rounded-full glass border border-border/40 flex items-center justify-center mb-4">
                      <Users className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      No people found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 text-center">
                      Try searching with a different name
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// VideoThumb grid tile
function VideoThumb({
  video,
  index,
  tall,
  onCreatorClick,
}: {
  video: {
    id: string;
    file: { getDirectURL: () => string };
    title: string;
    creator: unknown;
  };
  index: number;
  tall: boolean;
  onCreatorClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCreatorClick}
      data-ocid={`explore.video_thumb.${index}`}
      className={`relative overflow-hidden bg-card group transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        tall ? "aspect-[9/16]" : "aspect-square"
      }`}
    >
      <video
        src={video.file.getDirectURL()}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        muted
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <Play className="h-5 w-5 text-white" fill="white" />
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-2.5">
        <p className="text-white text-xs font-medium line-clamp-2 leading-snug drop-shadow-sm">
          {video.title}
        </p>
      </div>
    </button>
  );
}
