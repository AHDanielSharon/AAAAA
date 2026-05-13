import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import type { UserProfile } from "../backend";
import {
  useSaveCallerUserProfile,
  useUpdateProfileImage,
} from "../hooks/useQueries";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface EditProfileDialogProps {
  currentProfile: UserProfile;
}

export default function EditProfileDialog({
  currentProfile,
}: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentProfile.name);
  const [bio, setBio] = useState(currentProfile.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveProfile = useSaveCallerUserProfile();
  const updateProfileImage = useUpdateProfileImage();

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  useEffect(() => {
    if (open) {
      setName(currentProfile.name);
      setBio(currentProfile.bio || "");
      setAvatarFile(null);
      setPreviewUrl(null);
    }
  }, [open, currentProfile.name, currentProfile.bio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      let avatarBlob = currentProfile?.avatar;

      // Upload avatar to Firebase Storage for a permanent URL
      if (avatarFile) {
        try {
          const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const { storage, getCurrentUid } = await import("../firebase");
          const uid = getCurrentUid();
          const storageRef = ref(storage, `avatars/${uid}_${Date.now()}`);
          await uploadBytes(storageRef, avatarFile);
          const downloadUrl = await getDownloadURL(storageRef);
          avatarBlob = {
            getDirectURL: () => downloadUrl,
            getBytes: async () => new Uint8Array(await avatarFile.arrayBuffer()),
          } as any;
        } catch (err) {
          console.error("Avatar upload failed:", err);
          // Fallback to local blob URL
          const localUrl = URL.createObjectURL(avatarFile);
          avatarBlob = {
            getDirectURL: () => localUrl,
            getBytes: async () => new Uint8Array(await avatarFile.arrayBuffer()),
          } as any;
        }
      }

      await saveProfile.mutateAsync({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatar: avatarBlob,
        balance: currentProfile?.balance,
      });
      setOpen(false);
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  const getInitials = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const currentAvatarUrl = currentProfile.avatar?.getDirectURL();
  const displayAvatar = previewUrl || currentAvatarUrl;
  const isPending = saveProfile.isPending || updateProfileImage.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-ocid="profile.edit_button"
          className="flex items-center gap-1.5 h-9 px-4 rounded-full border border-border/60 text-sm font-semibold text-foreground glass-btn transition-all duration-200"
        >
          Edit Profile
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-3xl border border-border/30 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <div className="animate-spring-in">
          {/* Header */}
          <DialogHeader className="relative flex flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-border/20">
            {/* Cancel */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              data-ocid="profile.edit_cancel_button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium min-h-[44px] flex items-center"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <DialogTitle className="text-base font-bold text-foreground absolute left-1/2 -translate-x-1/2">
              Edit Profile
            </DialogTitle>
            {/* Empty spacer for centering */}
            <div className="w-14" />
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* Avatar Section */}
            <div className="flex flex-col items-center pt-6 pb-5 px-5 border-b border-border/20">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group"
                data-ocid="profile.avatar_edit_button"
                aria-label="Change profile photo"
              >
                {/* Gradient ring */}
                <div className="p-[3px] rounded-full bg-gradient-to-br from-primary via-accent to-secondary shadow-lg transition-transform duration-200 group-active:scale-95">
                  <div className="p-[2px] rounded-full bg-card">
                    <Avatar className="h-24 w-24">
                      {displayAvatar ? (
                        <AvatarImage src={displayAvatar} alt={name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                        {getInitials(name || "?")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                {/* Camera overlay badge */}
                <div className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                {/* Camera badge bottom-right */}
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background">
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-sm text-primary font-semibold hover:text-primary/80 transition-colors duration-200"
              >
                Change Profile Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-ocid="profile.avatar_upload"
              />
            </div>

            {/* Form Fields */}
            <div className="px-5 pt-5 pb-4 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label
                  htmlFor="edit-name"
                  className="block text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-ocid="profile.name_input"
                  className="glass-input w-full px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label
                  htmlFor="edit-bio"
                  className="block text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  placeholder="Tell people about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  data-ocid="profile.bio_input"
                  className="glass-input w-full px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="px-5 pb-6">
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                data-ocid="profile.save_button"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
