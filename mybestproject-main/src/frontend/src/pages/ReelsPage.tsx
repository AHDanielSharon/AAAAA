import { useRef, useState } from "react";
import { useGetAllVideos } from "../hooks/useQueries";
import ReelCard from "../components/ReelCard";
import UploadVideoDialog from "../components/UploadVideoDialog";
import { Video } from "lucide-react";

export default function ReelsPage() {
  const { data: videos, isLoading } = useGetAllVideos();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollY = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollY / height);
    if (index !== activeReelIndex) {
      setActiveReelIndex(index);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8 text-center">
        <Video size={64} className="text-white/20 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">No Reels Yet</h2>
        <p className="text-white/40 mb-8 max-w-xs">Be the first to share a moment with the world.</p>
        <UploadVideoDialog />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="reels-scroll bg-black"
    >
      {videos.map((video, index) => (
        <section key={video.id} className="reel-section">
          <ReelCard 
            video={video} 
            isActive={index === activeReelIndex} 
          />
        </section>
      ))}
    </div>
  );
}
