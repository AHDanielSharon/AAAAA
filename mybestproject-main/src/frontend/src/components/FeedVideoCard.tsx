import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Bookmark,
  Copy,
  Download,
  EyeOff,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Play,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
} from "../hooks/useQueries";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";

export default function FeedVideoCard({
  video,
  onCreatorClick,
  index,
}: {
  video: Video;
  onCreatorClick: (creator: Principal) => void;
  index: number;
}) {
  const { identity } = useInternetIdentity();
  const [showComments, setShowComments] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { data: creatorProfile } = useGetUserProfile(video.creator);
  const { data: comments = [], refetch: refetchComments } = useGetAllComments(video.id);
  const { data: reelStats } = useGetReelStats(video.id);
  const likeMutation = useLikeReel();
  const unlikeMutation = useDislikeReel();
  const addCommentMutation = useAddComment();
  const shareMutation = useShareReel();

  useEffect(() => {
    if (reelStats) {
      setLikeCount(Number(reelStats.likes));
    }
  }, [reelStats]);

  useEffect(() => {
    const saved = localStorage.getItem(`saved_reel_${video.id}`);
    if (saved === "true") setIsSaved(true);
  }, [video.id]);

  const handleLikeToggle = () => {
    if (!identity) {
      toast.error("Please log in to like posts");
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
    }
  };

  const handleSaveToggle = () => {
    const newVal = !isSaved;
    setIsSaved(newVal);
    localStorage.setItem(`saved_reel_${video.id}`, String(newVal));
    toast.success(newVal ? "Post saved" : "Post unsaved");
  };

  const handleShare = () => {
    setShowShareSheet(true);
    shareMutation.mutate(video.id);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/reels?id=${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
    setShowShareSheet(false);
  };

  const handleNativeShare = async () => {
    const url = `${window.location.origin}/reels?id=${video.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, text: video.description, url });
      } catch { /* cancelled */ }
    } else {
      await handleCopyLink();
    }
    setShowShareSheet(false);
  };

  const handleDownload = async () => {
    try {
      const a = document.createElement("a");
      a.href = video.file.getDirectURL();
      a.download = `${video.title || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
    setShowMoreMenu(false);
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="card-premium animate-spring-up mb-6"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* ═══ CREATOR HEADER ═══ */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => onCreatorClick(video.creator)}
          className="flex items-center gap-3 group"
        >
          <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary to-accent opacity-80 group-hover:opacity-100 transition-opacity">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={creatorProfile?.avatar?.getDirectURL()} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {creatorProfile?.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-left">
            <h4 className="text-[15px] font-bold leading-tight group-hover:text-primary transition-colors">
              {creatorProfile?.name || "User"}
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium">
              @{video.creator.toString().slice(0, 8)}
            </p>
          </div>
        </button>
        <button
          onClick={() => setShowMoreMenu(true)}
          className="p-2 rounded-full hover:bg-muted/50 transition-colors"
        >
          <MoreHorizontal size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* ═══ MEDIA CONTENT ═══ */}
      <div className="relative aspect-square md:aspect-video w-full group overflow-hidden bg-muted/20">
        <video
          src={video.file.getDirectURL()}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          autoPlay
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <Play size={32} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* ═══ ACTIONS ═══ */}
      <div className="p-4 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={handleLikeToggle} className="flex items-center gap-1.5 group">
              <motion.div
                whileTap={{ scale: 0.7 }}
                className={`p-2.5 rounded-full transition-all ${isLiked ? "bg-red-500/10 text-red-500" : "bg-muted/50 text-foreground/80 hover:bg-muted"}`}
              >
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
              </motion.div>
              <span className="text-sm font-bold">{likeCount}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 group">
              <div className="p-2.5 rounded-full bg-muted/50 text-foreground/80 hover:bg-muted transition-all active:scale-75">
                <MessageCircle size={24} />
              </div>
              <span className="text-sm font-bold">{comments.length}</span>
            </button>
            <button onClick={handleShare} className="p-2.5 rounded-full bg-muted/50 text-foreground/80 hover:bg-muted transition-all active:scale-75">
              <Share2 size={24} />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.7 }}
            onClick={handleSaveToggle}
            className={`p-2.5 rounded-full transition-all ${isSaved ? "bg-primary/10 text-primary" : "bg-muted/50 text-foreground/80 hover:bg-muted"}`}
          >
            <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
          </motion.button>
        </div>

        {/* ═══ TEXT CONTENT ═══ */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-lg leading-tight">{video.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {video.description}
          </p>
        </div>

        {/* ═══ COMMENTS PREVIEW ═══ */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-border/10 space-y-4 overflow-hidden"
            >
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    className="w-full bg-muted/30 rounded-2xl py-2 px-4 text-sm focus:ring-1 ring-primary/30 outline-none"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto hide-scrollbar">
                {comments.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No comments yet</p>
                )}
                {comments.map((comment, idx) => (
                  <div key={`${comment.author}-${idx}`} className="flex gap-3 animate-spring-up">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-[10px] font-bold">
                        {comment.author.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="text-xs font-bold">{comment.author.slice(0, 8)}</span>
                      <p className="text-sm mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ SHARE SHEET (MODAL) ═══ */}
      <AnimatePresence>
        {showShareSheet && (
          <div className="fixed inset-0 z-[100]" onClick={() => setShowShareSheet(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-background rounded-t-[2rem] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-bold mb-5">Share</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button onClick={handleCopyLink} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><Copy size={24} /></div>
                  <span className="text-[11px] font-medium">Copy Link</span>
                </button>
                <button onClick={handleNativeShare} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Share2 size={24} /></div>
                  <span className="text-[11px] font-medium">Share to…</span>
                </button>
                <button onClick={handleCopyLink} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><Link2 size={24} /></div>
                  <span className="text-[11px] font-medium">Link</span>
                </button>
                <button onClick={handleDownload} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><Download size={24} /></div>
                  <span className="text-[11px] font-medium">Download</span>
                </button>
              </div>
              <button onClick={() => setShowShareSheet(false)} className="w-full py-3 rounded-2xl bg-muted font-bold text-sm">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MORE OPTIONS (MODAL) ═══ */}
      <AnimatePresence>
        {showMoreMenu && (
          <div className="fixed inset-0 z-[100]" onClick={() => setShowMoreMenu(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-background rounded-t-[2rem] p-6"
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
                <button onClick={() => { toast.success("We'll show less like this"); setShowMoreMenu(false); }} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted/50 transition-colors">
                  <EyeOff size={22} className="text-muted-foreground" />
                  <span className="font-medium">Not interested</span>
                </button>
                <button onClick={() => { toast.success("Report submitted"); setShowMoreMenu(false); }} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted/50 transition-colors text-red-500">
                  <Flag size={22} />
                  <span className="font-medium">Report</span>
                </button>
              </div>
              <button onClick={() => setShowMoreMenu(false)} className="w-full mt-4 py-3 rounded-2xl bg-muted font-bold text-sm">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
