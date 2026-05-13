import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Trash2, X, Send, Heart, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Story } from "../backend";
import { useDeleteStory, useGetUserProfile } from "../hooks/useQueries";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export default function StoryViewer({
  stories,
  initialIndex,
  open,
  onClose,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [contentUrl, setContentUrl] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { identity } = useInternetIdentity();
  const deleteStory = useDeleteStory();

  const STORY_DURATION = 5000;
  const currentStory = stories[currentIndex];
  const { data: creatorProfile } = useGetUserProfile(currentStory?.creator);
  const isOwner = identity?.getPrincipal().toString() === currentStory?.creator.toString();
  const creatorName = creatorProfile?.name || "User";
  const avatarUrl = creatorProfile?.avatar?.getDirectURL();

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (currentStory) {
      setContentUrl(currentStory.file.getDirectURL());
      setProgress(0);
    }
  }, [currentStory]);

  useEffect(() => {
    if (!open || isPaused || !currentStory) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, STORY_DURATION / 100);

    return () => clearInterval(interval);
  }, [open, isPaused, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  if (!open || !currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 md:p-4"
      >
        <div className="relative w-full max-w-[450px] h-full md:h-[90vh] md:rounded-[2.5rem] overflow-hidden bg-zinc-900 shadow-2xl">
          {/* ═══ PROGRESS BARS ═══ */}
          <div className="absolute top-4 inset-x-4 z-50 flex gap-1.5">
            {stories.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%" 
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            ))}
          </div>

          {/* ═══ HEADER ═══ */}
          <div className="absolute top-8 inset-x-4 z-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {creatorName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-bold leading-none">{creatorName}</p>
                <p className="text-[10px] text-white/60 font-medium mt-1 uppercase tracking-widest">2 hours ago</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* ═══ MEDIA ═══ */}
          <div 
            className="w-full h-full relative group"
            onPointerDown={() => setIsPaused(true)}
            onPointerUp={() => setIsPaused(false)}
          >
            {currentStory.contentType === "image" ? (
              <img src={contentUrl} alt="Story" className="w-full h-full object-cover" />
            ) : (
              <video 
                ref={videoRef}
                src={contentUrl} 
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                onEnded={handleNext}
              />
            )}
            
            {/* TAP ZONES */}
            <div className="absolute inset-0 flex">
              <div className="w-1/3 h-full cursor-pointer" onClick={handlePrevious} />
              <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
            </div>
          </div>

          {/* ═══ BOTTOM ACTIONS ═══ */}
          <div className="absolute bottom-6 inset-x-4 z-50 flex items-center gap-3">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Send a message..." 
                className="w-full h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 text-white text-sm outline-none placeholder:text-white/40 focus:bg-white/20 transition-all"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors">
                <Send size={18} />
              </button>
            </div>
            <button className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors">
              <Heart size={24} />
            </button>
            {isOwner && (
              <button 
                onClick={() => deleteStory.mutate(currentStory.id)}
                className="p-3 rounded-full bg-red-500/20 backdrop-blur-md text-red-500 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 size={24} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
