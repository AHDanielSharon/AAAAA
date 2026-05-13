import { useEffect, useState } from "react";
import type { Story } from "../backend";
import { useGetUserProfile } from "../hooks/useQueries";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { motion } from "framer-motion";

interface StoryCardProps {
  story: Story;
  onClick: () => void;
  seen?: boolean;
}

export default function StoryCard({
  story,
  onClick,
  seen = false,
}: StoryCardProps) {
  const { data: creatorProfile } = useGetUserProfile(story.creator);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");

  useEffect(() => {
    if (story.contentType === "image") {
      setThumbnailUrl(story.file.getDirectURL());
    } else if (story.thumbnail) {
      setThumbnailUrl(story.thumbnail.getDirectURL());
    }
  }, [story]);

  const creatorName = creatorProfile?.name || "User";
  const avatarUrl = creatorProfile?.avatar?.getDirectURL();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 group"
    >
      <div className={`p-[3px] rounded-[1.8rem] transition-all duration-300 ${seen ? "bg-muted" : "bg-gradient-to-tr from-primary via-accent to-secondary animate-gradient-shift bg-[length:200%_200%]"}`}>
        <div className="p-0.5 bg-background rounded-[1.7rem]">
          <div className="w-16 h-16 rounded-[1.6rem] overflow-hidden bg-muted/20 relative">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={creatorName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage src={avatarUrl} alt={creatorName} />
                <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                  {creatorName[0]}
                </AvatarFallback>
              </Avatar>
            )}
            {!seen && (
              <div className="absolute inset-0 border-2 border-primary/20 rounded-[1.6rem] pointer-events-none" />
            )}
          </div>
        </div>
      </div>
      <span className={`text-[10px] font-bold truncate w-16 text-center ${seen ? "text-muted-foreground" : "text-foreground"}`}>
        {creatorName}
      </span>
    </motion.button>
  );
}
