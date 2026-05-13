import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { Eye, Play, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Video } from "../backend";
import {
  useDeleteVideo,
  useGetReelStats,
  useGetUserProfile,
} from "../hooks/useQueries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

interface VideoCardProps {
  video: Video;
  autoPlay?: boolean;
  onCreatorClick?: (creatorPrincipal: Principal) => void;
}

export default function VideoCard({
  video,
  autoPlay = false,
  onCreatorClick,
}: VideoCardProps) {
  const { identity } = useInternetIdentity();
  const deleteVideo = useDeleteVideo();
  const { data: creatorProfile } = useGetUserProfile(video.creator);
  const { data: reelStats } = useGetReelStats(video.id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const isOwner =
    identity?.getPrincipal().toString() === video.creator.toString();

  useEffect(() => {
    setVideoUrl(video.file.getDirectURL());
  }, [video.file]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !videoUrl) return;
    if (autoPlay) {
      vid.muted = true;
      vid.play().catch(() => setIsPlaying(false));
    } else {
      vid.pause();
    }
  }, [autoPlay, videoUrl]);

  const handleTap = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.muted = true;
      videoRef.current.play().catch((e) => console.error("Play failed:", e));
    }
    setIsPlaying(!isPlaying);
    setIsTouched(true);
    setTimeout(() => setIsTouched(false), 1200);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreatorClick && !isOwner) onCreatorClick(video.creator);
  };

  const formatCount = (n: bigint) => {
    const v = Number(n);
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toString();
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const avatarUrl = creatorProfile?.avatar?.getDirectURL();
  const creatorName = creatorProfile?.name || video.title;
  const viewsCount = reelStats ? formatCount(reelStats.views) : null;
  const likesCount = reelStats ? formatCount(reelStats.likes) : null;

  const showOverlay = isHovered || isTouched;

  return (
    <div
      data-ocid={`video_card.${video.id}`}
      className="relative rounded-xl overflow-hidden bg-black cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{ aspectRatio: "9/16" }}
      onClick={handleTap}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTap();
        }
      }}
      // biome-ignore lint/a11y/useSemanticElements: card with nested interactive controls
      role="button"
      tabIndex={0}
      aria-label={`Play ${video.title}`}
    >
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            playsInline
            muted
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <track kind="captions" />
          </video>

          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 bg-gradient-to-b from-black/50 to-transparent" />

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10 bg-gradient-to-t from-black/85 to-transparent" />

          {/* Play overlay */}
          <div
            className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200 ${
              showOverlay && !isPlaying ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="h-14 w-14 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm border border-white/20">
              <Play className="h-7 w-7 text-white ml-1" fill="white" />
            </div>
          </div>

          {/* Views chip */}
          <div className="absolute top-2.5 right-2.5 z-30">
            {viewsCount && (
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                <Eye className="h-2.5 w-2.5 text-white/80" />
                <span className="text-[10px] text-white font-semibold">
                  {viewsCount}
                </span>
              </div>
            )}
          </div>

          {/* Creator + title bottom */}
          <div className="absolute bottom-2.5 left-2.5 right-9 z-30">
            <button
              type="button"
              onClick={handleCreatorClick}
              disabled={isOwner}
              className={`flex items-center gap-1.5 mb-1 ${
                !isOwner ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <Avatar className="h-6 w-6 shrink-0 ring-1 ring-white/40">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={creatorName} />}
                <AvatarFallback className="bg-primary/30 text-primary text-[9px] font-bold">
                  {getInitials(creatorName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-semibold text-white truncate drop-shadow">
                @{creatorName}
              </span>
            </button>
            <p className="text-[12px] text-white font-semibold leading-tight line-clamp-2 drop-shadow">
              {video.title}
            </p>
            {likesCount && (
              <p className="text-[10px] text-white/70 mt-0.5">♥ {likesCount}</p>
            )}
          </div>

          {/* Delete (owner) */}
          {isOwner && (
            <div
              className="absolute top-2.5 left-2.5 z-30"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/55 backdrop-blur border border-white/20 text-white hover:bg-red-500/30 hover:border-red-500/40 transition-colors"
                    data-ocid="video_card.delete_button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card/95 border border-border backdrop-blur-xl rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="rounded-xl"
                      data-ocid="video_card.cancel_button"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteVideo.mutate(video.id)}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-ocid="video_card.confirm_button"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <div className="h-9 w-9 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
