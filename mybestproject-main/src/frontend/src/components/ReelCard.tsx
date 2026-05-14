import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Bookmark,
  Check,
  Copy,
  Download,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Share2,
  X,
  EyeOff,
  UserMinus,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Video } from "../backend";
import {
  useAddComment,
  useGetAllComments,
  useGetUserProfile,
  useGetReelStats,
  useLikeReel,
  useDislikeReel,
  useShareReel,
  useIncrementViews,
} from "../hooks/useQueries";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";

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
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { data: creatorProfile } = useGetUserProfile(video.creator);
  const { data: comments = [], refetch: refetchComments } = useGetAllComments(video.id);
  const { data: reelStats } = useGetReelStats(video.id);
  const likeMutation = useLikeReel();
  const unlikeMutation = useDislikeReel();
  const addCommentMutation = useAddComment();
  const shareMutation = useShareReel();
  const viewMutation = useIncrementViews();

  // Track views when reel becomes active
  useEffect(() => {
    if (isActive) {
      viewMutation.mutate(video.id);
    }
  }, [isActive, video.id]);

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
    if (reelStats) {
      setLikeCount(Number(reelStats.likes));
    }
  }, [reelStats]);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`saved_reel_${video.id}`);
    if (saved === "true") setIsSaved(true);
  }, [video.id]);

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!identity) {
      toast.error("Please log in to like reels");
      return;
    }
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      unlikeMutation.mutate(video.id);
    } else {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
      likeMutation.mutate(video.id);
      // Show heart animation
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
  };

  const handleDoubleTapLike = useCallback(() => {
    if (!identity || isLiked) return;
    setIsLiked(true);
    setLikeCount((c) => c + 1);
    likeMutation.mutate(video.id);
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 800);
  }, [identity, isLiked, video.id, likeMutation]);

  const lastTap = useRef(0);
  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleDoubleTapLike();
    }
    lastTap.current = now;
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((m) => !m);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !isSaved;
    setIsSaved(newVal);
    localStorage.setItem(`saved_reel_${video.id}`, String(newVal));
    toast.success(newVal ? "Reel saved" : "Reel unsaved");
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareSheet(true);
    shareMutation.mutate(video.id);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/reels?id=${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
    setShowShareSheet(false);
  };

  const handleNativeShare = async () => {
    const url = `${window.location.origin}/reels?id=${video.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopyLink();
    }
    setShowShareSheet(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    if (!identity) {
      toast.error("Please log in to comment");
      return;
    }
    addCommentMutation.mutate(
      {
        reelId: video.id,
        comment: { text: commentText.trim(), author: identity.getPrincipal().toString() },
      },
      {
        onSuccess: () => {
          setCommentText("");
          refetchComments();
        },
      },
    );
  };

  const handleDownload = async () => {
    try {
      const url = video.file.getDirectURL();
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title || "reel"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
    setShowMoreMenu(false);
  };

  const handleReport = () => {
    toast.success("Thanks for reporting. We'll review this content.");
    setShowMoreMenu(false);
  };

  const handleNotInterested = () => {
    toast.success("We'll show you less content like this.");
    setShowMoreMenu(false);
  };

  const shareCount = reelStats ? Number(reelStats.shares) : 0;

  return (
    <div className="relative h-full w-full bg-black overflow-hidden group" onClick={handleVideoTap}>
      {/* ═══ VIDEO ═══ */}
      <video
        ref={videoRef}
        src={video.file.getDirectURL()}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={!isActive || isMuted}
      />

      {/* ═══ DOUBLE TAP HEART ═══ */}
      <AnimatePresence>
        {showHeartAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <Heart size={100} fill="white" className="text-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ GRADIENT OVERLAY ═══ */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* ═══ SIDE ACTIONS ═══ */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.7 }}
            onClick={handleLikeToggle}
            className={`p-3 rounded-full backdrop-blur-md transition-all ${isLiked ? "bg-red-500 text-white" : "bg-white/10 text-white"}`}
          >
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
          </motion.button>
          <span className="text-white text-xs font-bold">{likeCount}</span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.7 }}
            onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all"
          >
            <MessageCircle size={28} />
          </motion.button>
          <span className="text-white text-xs font-bold">{comments.length}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.7 }}
            onClick={handleShare}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all"
          >
            <Share2 size={28} />
          </motion.button>
          {shareCount > 0 && <span className="text-white text-xs font-bold">{shareCount}</span>}
        </div>

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.7 }}
          onClick={handleSaveToggle}
          className={`p-3 rounded-full backdrop-blur-md transition-all ${isSaved ? "bg-white text-black" : "bg-white/10 text-white"}`}
        >
          <Bookmark size={28} fill={isSaved ? "currentColor" : "none"} />
        </motion.button>

        {/* More Options */}
        <motion.button
          whileTap={{ scale: 0.7 }}
          onClick={(e) => { e.stopPropagation(); setShowMoreMenu(true); }}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all"
        >
          <MoreHorizontal size={28} />
        </motion.button>

        {/* Spinning music disc */}
        <motion.div
          animate={{ rotate: isActive ? 360 : 0 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-11 h-11 rounded-full border-4 border-white/20 p-0.5 mt-2"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <Music2 size={14} className="text-white" />
          </div>
        </motion.div>
      </div>

      {/* ═══ BOTTOM INFO ═══ */}
      <div className="absolute bottom-0 left-0 right-16 p-5 z-20">
        <div className="flex flex-col gap-2.5 max-w-full">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/30">
              <AvatarImage src={creatorProfile?.avatar?.getDirectURL()} />
              <AvatarFallback className="bg-white/10 text-white font-bold">
                {creatorProfile?.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h4 className="text-white font-bold text-sm">{creatorProfile?.name || "Creator"}</h4>
              <p className="text-white/50 text-[11px]">@{video.creator.toString().slice(0, 8)}</p>
            </div>
            <button className="ml-2 px-4 py-1 rounded-full border border-white/40 text-white text-xs font-bold hover:bg-white/10 transition-colors">
              Follow
            </button>
          </div>
          <h3 className="text-white font-bold text-base line-clamp-1">{video.title}</h3>
          <p className="text-white/70 text-sm line-clamp-2">{video.description}</p>
          <div className="flex items-center gap-2 text-white/80">
            <Music2 size={12} className="animate-pulse" />
            <span className="text-[11px] font-medium">Original Audio – {creatorProfile?.name || "User"}</span>
          </div>
        </div>
      </div>

      {/* ═══ SHARE SHEET ═══ */}
      <AnimatePresence>
        {showShareSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 z-40"
              onClick={(e) => { e.stopPropagation(); setShowShareSheet(false); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 z-50 bg-background rounded-t-[2rem] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-bold mb-5">Share</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button onClick={handleCopyLink} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <Copy size={24} />
                  </div>
                  <span className="text-[11px] font-medium">Copy Link</span>
                </button>
                <button onClick={handleNativeShare} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <Share2 size={24} />
                  </div>
                  <span className="text-[11px] font-medium">Share to…</span>
                </button>
                <button onClick={handleCopyLink} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <Link2 size={24} />
                  </div>
                  <span className="text-[11px] font-medium">Link</span>
                </button>
                <button onClick={handleDownload} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <Download size={24} />
                  </div>
                  <span className="text-[11px] font-medium">Download</span>
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowShareSheet(false); }}
                className="w-full py-3 rounded-2xl bg-muted font-bold text-sm hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MORE OPTIONS MENU ═══ */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 z-40"
              onClick={(e) => { e.stopPropagation(); setShowMoreMenu(false); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 z-50 bg-background rounded-t-[2rem] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
              <div className="space-y-1">
                <button onClick={handleDownload} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted/50 transition-colors">
                  <Download size={22} className="text-muted-foreground" />
                  <span className="font-medium">Download video</span>
                </button>
                <button onClick={handleSaveToggle} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted/50 transition-colors">
                  <Bookmark size={22} className="text-muted-foreground" fill={isSaved ? "currentColor" : "none"} />
                  <span className="font-medium">{isSaved ? "Unsave" : "Save to collection"}</span>
                </button>
                <button onClick={handleNotInterested} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted/50 transition-colors">
                  <EyeOff size={22} className="text-muted-foreground" />
                  <span className="font-medium">Not interested</span>
                </button>
                <button onClick={handleReport} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted/50 transition-colors text-red-500">
                  <Flag size={22} />
                  <span className="font-medium">Report</span>
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(false); }}
                className="w-full mt-4 py-3 rounded-2xl bg-muted font-bold text-sm hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ COMMENTS SHEET ═══ */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 z-40"
              onClick={(e) => { e.stopPropagation(); setShowComments(false); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 z-50 h-[65%] bg-background rounded-t-[2rem] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-4 pb-3 border-b border-border/10 flex-shrink-0">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" onClick={() => setShowComments(false)} />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{comments.length} Comments</h3>
                  <button onClick={() => setShowComments(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 space-y-5">
                {comments.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
                  </div>
                )}
                {comments.map((comment, idx) => (
                  <div key={`${comment.author}-${idx}`} className="flex gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="bg-muted text-xs font-bold">
                        {comment.author.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate">{comment.author.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm mt-0.5 break-words">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <div className="px-6 py-4 border-t border-border/10 flex-shrink-0 safe-bottom">
                <div className="flex gap-3 items-center">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      className="w-full bg-muted/50 rounded-2xl py-3 px-4 pr-16 text-sm focus:ring-2 ring-primary/20 outline-none"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm disabled:opacity-40"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
