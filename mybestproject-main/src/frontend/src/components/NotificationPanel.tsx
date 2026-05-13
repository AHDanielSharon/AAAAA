import {
  Bell, CheckCheck, Heart, MessageCircle, UserCheck, UserPlus, Video, X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useGetUserNotifications,
  useMarkNotificationAsRead,
} from "../hooks/useQueries";
import { ScrollArea } from "./ui/scroll-area";

interface NotificationPanelProps {
  onClose: () => void;
}

function getIcon(type: string) {
  switch (type) {
    case "friend_accepted": return <UserCheck className="h-4 w-4 text-green-400" />;
    case "friend_request": return <UserPlus className="h-4 w-4 text-blue-400" />;
    case "message": return <MessageCircle className="h-4 w-4 text-primary" />;
    case "video_call": return <Video className="h-4 w-4 text-purple-400" />;
    case "like": return <Heart className="h-4 w-4 text-red-400" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data: rawNotifications = [] } = useGetUserNotifications();
  const markAsRead = useMarkNotificationAsRead();

  // Normalize notification shape (works with both backend formats)
  const notifications = rawNotifications.map((n: any, i: number) => ({
    id: n.id || `n_${i}`,
    type: n.type || n.notificationType || "default",
    message: n.message || n.content || "",
    sender: n.senderName || "",
    read: n.read ?? n.isRead ?? false,
    timestamp: n.timestamp,
  }));

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-full max-w-sm z-[70] flex flex-col"
        style={{
          background: "oklch(var(--card) / 0.96)",
          backdropFilter: "blur(28px)",
          borderLeft: "1px solid oklch(var(--border) / 0.3)",
          boxShadow: "-8px 0 48px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold min-w-[22px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted/40 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-5">
                <Bell className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="font-bold text-lg mb-1">All caught up!</p>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="py-2 px-3 space-y-1">
              {notifications.map((n: any, i: number) => (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !n.read && markAsRead.mutate(n.id)}
                  className={`w-full text-left rounded-2xl px-4 py-3.5 transition-all ${
                    !n.read ? "bg-primary/8 border border-primary/15" : "border border-transparent hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{n.message || "New notification"}</p>
                      {n.sender && <p className="text-xs text-muted-foreground mt-0.5">{n.sender}</p>}
                    </div>
                    {!n.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </>
  );
}
