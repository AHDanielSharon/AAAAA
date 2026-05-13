import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Video as VideoIcon,
  X,
  CheckCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { ExternalBlob, StoryContentType } from "../backend";
import { useUploadStory } from "../hooks/useQueries";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function UploadStoryDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<StoryContentType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadStory = useUploadStory();

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    let type: StoryContentType | null = null;
    if (file.type.startsWith("image/")) type = StoryContentType.image;
    else if (file.type.startsWith("video/")) type = StoryContentType.video;
    if (!type) return;
    setContentFile(file);
    setContentType(type);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setContentFile(null);
    setContentType(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentFile || !contentType) return;
    try {
      const arrayBuffer = await contentFile.arrayBuffer();
      const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer))
        .withUploadProgress((pct) => setUploadProgress(pct));
      await uploadStory.mutateAsync({
        title: "Story",
        contentType,
        file: blob,
      });
      setOpen(false);
      clearFile();
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) clearFile(); setOpen(v); }}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex flex-col items-center gap-2 shrink-0 snap-start group">
            <div className="relative w-16 h-16 rounded-[1.5rem] bg-muted/50 flex items-center justify-center border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold">+</div>
            </div>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm glass-morphism border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0 text-center">
          <DialogTitle className="text-2xl font-black tracking-tighter">Add to Story</DialogTitle>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest pt-1">Visible for 24 hours</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div 
            onClick={() => inputRef.current?.click()}
            className={`relative h-80 rounded-[2.5rem] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              contentFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} />
            
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full relative"
                >
                  {contentType === StoryContentType.image ? (
                    <img src={previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <video src={previewUrl} className="w-full h-full object-cover" muted />
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-20 h-20 rounded-[1.8rem] bg-muted flex items-center justify-center mx-auto">
                    <Camera size={32} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Choose a Moment</p>
                    <p className="text-xs text-muted-foreground">Photo or Video · Max 50MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              disabled={uploadStory.isPending || !contentFile}
              className="w-full h-14 rounded-3xl bg-primary text-primary-foreground font-black text-lg shadow-premium-lg active:scale-95 transition-all gap-2"
            >
              {uploadStory.isPending ? "Sharing..." : (
                <>
                  <Sparkles size={20} />
                  Share Story
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
