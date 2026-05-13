import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [commentText, setCommentText] = useState("");
  const { data: creatorProfile } = useGetUserProfile(video.creator);
  const { data: comments = [], refetch: refetchComments } = useGetAllComments(video.id);
  const likeMutation = useLikeReel();
  const unlikeMutation = useDislikeReel();
  const addCommentMutation = useAddComment();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (identity) {
      const principal = identity.getPrincipal().toString();
      setIsLiked(video.likes.some((p) => p.toString() === principal));
    }
  }, [video.likes, identity]);

  const handleLikeToggle = () => {
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
        <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
          <MoreHorizontal size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* ═══ MEDIA CONTENT ═══ */}
      <div className="relative aspect-square md:aspect-video w-full group overflow-hidden bg-muted/20">
        <video
          src={video.video.getDirectURL()}
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
            <button 
              onClick={handleLikeToggle}
              className="flex items-center gap-1.5 group"
            >
              <div className={`p-2.5 rounded-full transition-all active:scale-75 ${isLiked ? "bg-red-500/10 text-red-500" : "bg-muted/50 text-foreground/80 hover:bg-muted"}`}>
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
              </div>
              <span className="text-sm font-bold">{video.likes.length}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 group"
            >
              <div className="p-2.5 rounded-full bg-muted/50 text-foreground/80 hover:bg-muted transition-all active:scale-75">
                <MessageCircle size={24} />
              </div>
              <span className="text-sm font-bold">{comments.length}</span>
            </button>
            <button className="p-2.5 rounded-full bg-muted/50 text-foreground/80 hover:bg-muted transition-all active:scale-75">
              <Share2 size={24} />
            </button>
          </div>
          <button className="p-2.5 rounded-full bg-muted/50 text-foreground/80 hover:bg-muted transition-all active:scale-75">
            <Bookmark size={24} />
          </button>
        </div>

        {/* ═══ TEXT CONTENT ═══ */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-lg leading-tight">{video.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {video.description}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {video.tags.map(tag => (
              <span key={tag} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ COMMENTS PREVIEW ═══ */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-border/10 space-y-4"
            >
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={identity?.getPrincipal().toString()} />
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
                    disabled={!commentText.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto hide-scrollbar">
                {comments.map((comment) => (
                  <div key={comment.timestamp.toString()} className="flex gap-3 animate-spring-up">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.toString()} />
                      <AvatarFallback className="bg-muted text-[10px]">{comment.author.toString().slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{comment.author.toString().slice(0, 8)}</span>
                        <span className="text-[10px] text-muted-foreground">2h</span>
                      </div>
                      <p className="text-sm mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
