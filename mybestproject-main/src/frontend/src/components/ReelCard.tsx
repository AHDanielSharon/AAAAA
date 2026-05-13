import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Video } from "../backend";
import {
  useAddComment,
  useGetAllComments,
  useGetUserProfile,
  useLikeReel,
  useDislikeReel,
} from "../hooks/useQueries";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function ReelCard({
  video,
  isActive,
}: {
  video: Video;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { identity } = useInternetIdentity();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { data: creatorProfile } = useGetUserProfile(video.creator);
  const { data: comments = [], refetch: refetchComments } = useGetAllComments(video.id);
  const likeMutation = useLikeReel();
  const unlikeMutation = useDislikeReel();
  const addCommentMutation = useAddComment();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (identity) {
      const principal = identity.getPrincipal().toString();
      setIsLiked(video.likes.some((p) => p.toString() === principal));
    }
  }, [video.likes, identity]);

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!identity) return;
    if (isLiked) {
      setIsLiked(false);
      unlikeMutation.mutate(video.id);
    } else {
      setIsLiked(true);
      likeMutation.mutate(video.id);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    if (!identity) return;
    addCommentMutation.mutate(
      { 
        reelId: video.id, 
        comment: { text: commentText.trim(), author: identity.getPrincipal().toString() } 
      },
      {
        onSuccess: () => {
          setCommentText("");
          refetchComments();
        },
      },
    );
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden group">
      {/* ═══ VIDEO ═══ */}
      <video
        ref={videoRef}
        src={video.video.getDirectURL()}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={!isActive}
      />

      {/* ═══ GRADIENT OVERLAY ═══ */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* ═══ SIDE ACTIONS ═══ */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleLikeToggle}
            className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-75 ${isLiked ? "bg-red-500 text-white" : "bg-white/10 text-white"}`}
          >
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
          </button>
          <span className="text-white text-xs font-bold">{video.likes.length}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setShowComments(true)}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all active:scale-75"
          >
            <MessageCircle size={28} />
          </button>
          <span className="text-white text-xs font-bold">{comments.length}</span>
        </div>

        <button className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all active:scale-75">
          <Share2 size={28} />
        </button>

        <button className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all active:scale-75">
          <Bookmark size={28} />
        </button>

        <button className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all active:scale-75">
          <MoreHorizontal size={28} />
        </button>

        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-4 border-white/20 p-1 mt-4"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <Music2 size={16} className="text-white" />
          </div>
        </motion.div>
      </div>

      {/* ═══ BOTTOM INFO ═══ */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <div className="flex flex-col gap-3 max-w-[80%]">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={creatorProfile?.avatar?.getDirectURL()} />
              <AvatarFallback className="bg-white/10 text-white font-bold">
                {creatorProfile?.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h4 className="text-white font-bold text-base">
                {creatorProfile?.name || "Creator"}
              </h4>
              <p className="text-white/60 text-xs">@{video.creator.toString().slice(0, 8)}</p>
            </div>
            <button className="ml-2 px-4 py-1.5 rounded-full border border-white/40 text-white text-xs font-bold hover:bg-white/10 transition-colors">
              Follow
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-bold text-lg">{video.title}</h3>
            <p className="text-white/80 text-sm line-clamp-2">{video.description}</p>
          </div>

          <div className="flex items-center gap-2 text-white/90">
            <Music2 size={14} className="animate-pulse" />
            <span className="text-xs font-medium">Original Audio - {creatorProfile?.name || "User"}</span>
          </div>
        </div>
      </div>

      {/* ═══ COMMENTS SHEET ═══ */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 z-50 h-[70%] bg-background rounded-t-[2.5rem] shadow-2xl p-6"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" onClick={() => setShowComments(false)} />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{comments.length} Comments</h3>
              <button onClick={() => setShowComments(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                <MoreHorizontal size={24} />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[calc(100%-120px)] hide-scrollbar pb-20">
              {comments.map((comment) => (
                <div key={comment.timestamp.toString()} className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.author.toString()} />
                    <AvatarFallback className="bg-muted">{comment.author.toString().slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{comment.author.toString().slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground">1d</span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button className="text-xs font-bold text-muted-foreground hover:text-foreground">Reply</button>
                      <button className="text-xs font-bold text-muted-foreground hover:text-foreground">Like</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6 bg-background border-t border-border/10">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={identity?.getPrincipal().toString()} />
                  <AvatarFallback className="bg-primary/10 text-primary">ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-muted/50 rounded-2xl py-3 px-4 focus:ring-2 ring-primary/20 outline-none"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
