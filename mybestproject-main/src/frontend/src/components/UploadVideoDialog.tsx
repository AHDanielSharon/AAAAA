import { Film, Upload, X, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import { useUploadVideo } from "../hooks/useQueries";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadVideoDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadVideo = useUploadVideo();

  const handleFileChange = (file: File | undefined) => {
    if (!file?.type.startsWith("video/")) return;
    setVideoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title.trim()) return;
    try {
      const arrayBuffer = await videoFile.arrayBuffer();
      const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer))
        .withUploadProgress((pct) => setUploadProgress(pct));
      await uploadVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        file: blob,
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoFile(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-premium-md hover:opacity-90 active:scale-95 transition-all gap-2">
            <Upload size={18} />
            Share Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg glass-morphism border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black tracking-tighter">Share a New Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div 
            onClick={() => inputRef.current?.click()}
            className={`relative h-64 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all duration-300 cursor-pointer ${
              videoFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} />
            
            <AnimatePresence mode="wait">
              {videoFile ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-3"
                >
                  <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold truncate max-w-[250px]">{videoFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(1)}MB</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Change Video
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-3"
                >
                  <div className="w-20 h-20 rounded-[1.5rem] bg-muted flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Film size={40} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">Select a video file</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, or WebM up to 500MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Catchy title for your video"
                className="w-full bg-muted/50 rounded-2xl p-4 text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's happening in this video?"
                rows={3}
                className="w-full bg-muted/50 rounded-2xl p-4 text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-primary">Uploading {uploadProgress}%</p>
              </div>
            )}

            <Button 
              type="submit"
              disabled={uploadVideo.isPending || !videoFile || !title.trim()}
              className="w-full h-14 rounded-3xl bg-primary text-primary-foreground font-black text-lg shadow-premium-lg active:scale-95 transition-all"
            >
              {uploadVideo.isPending ? "Sharing..." : "Post Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
