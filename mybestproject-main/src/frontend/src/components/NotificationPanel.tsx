import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Notification } from "../backend";
import {
  useGetUserNotifications,
  useMarkNotificationAsRead,
} from "../hooks/useQueries";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface NotificationPanelProps {
  onClose: () => void;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

function NotificationIcon({
  type,
}: { type: Notification["notificationType"] }) {
  switch (type) {
    case "friendRequest":
      return (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-2xl shrink-0"
          style={{
            background: "oklch(0.72 0.25 185 / 0.2)",
            border: "1px solid oklch(0.72 0.25 185 / 0.4)",
          }}
        >
          <UserPlus className="h-4 w-4 text-secondary" />
        </div>
      );
    case "friendRequestAccepted":
      return (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-2xl shrink-0"
          style={{
            background: "oklch(0.68 0.28 320 / 0.2)",
            border: "1px solid oklch(0.68 0.28 320 / 0.4)",
          }}
        >
          <UserCheck className="h-4 w-4 text-accent" />
        </div>
      );
    case "newMessage":
      return (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-2xl shrink-0"
          style={{
            background: "oklch(var(--primary) / 0.2)",
            border: "1px solid oklch(var(--primary) / 0.4)",
          }}
        >
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
      );
    default:
      return (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-2xl shrink-0"
          style={{ background: "oklch(var(--muted) / 0.5)" }}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
      );
  }
}

function typeLabel(type: Notification["notificationType"]): string {
  switch (type) {
    case "friendRequest":
      return "Friend Request";
    case "friendRequestAccepted":
      return "Request Accepted";
    case "newMessage":
      return "New Message";
    default:
      return "Notification";
  }
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data: notifications = [] } = useGetUserNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const unreadIds = notifications
    .map((n, i) => ({ n, i }))
    .filter(({ n }) => !n.isRead)
    .map(({ n, i }) => `notification_${n.timestamp.toString()}_${i}`);

  const handleMarkAll = async () => {
    for (const id of unreadIds) {
      await markAsRead.mutateAsync(id);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (!isRead) await markAsRead.mutateAsync(id);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-40 w-full cursor-default"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
        aria-label="Close notifications"
      />

      {/* Slide-in panel */}
      <motion.div
        initial={{ opacity: 0, x: 72, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 72, scale: 0.97 }}
        transition={SPRING}
        className="fixed top-0 right-0 h-full w-full sm:w-96 z-50 flex flex-col"
        style={{
          background: "oklch(var(--card) / 0.94)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderLeft: "1px solid oklch(var(--border) / 0.4)",
          boxShadow: "-8px 0 48px rgba(0,0,0,0.35)",
        }}
        data-ocid="notifications.panel"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid oklch(var(--border) / 0.3)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: "oklch(var(--primary) / 0.15)" }}
            >
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Notifications
            </h2>
            {unreadIds.length > 0 && (
              <span
                className="flex items-center justify-center rounded-full text-white text-xs font-bold px-2 py-0.5"
                style={{
                  background: "oklch(0.65 0.28 15)",
                  minWidth: 22,
                  fontSize: 11,
                }}
              >
                {unreadIds.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadIds.length > 0 && (
              <motion.button
                type="button"
                onClick={handleMarkAll}
                whileTap={{ scale: 0.95 }}
                data-ocid="notifications.mark_all_read_button"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </motion.button>
            )}
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={SPRING}
              data-ocid="notifications.close_button"
              aria-label="Close notifications"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/40"
            >
              <X className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            </motion.button>
          </div>
        </div>

        {/* Notifications list */}
        <ScrollArea className="flex-1 hide-scrollbar">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.1 }}
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              data-ocid="notifications.empty_state"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "oklch(var(--muted) / 0.6)" }}
              >
                <Bell className="h-8 w-8 text-muted-foreground opacity-60" />
              </div>
              <p className="font-semibold text-foreground mb-1">
                All caught up!
              </p>
              <p className="text-sm text-muted-foreground">
                You have no notifications right now.
              </p>
            </motion.div>
          ) : (
            <div className="py-2 flex flex-col gap-0.5 px-2">
              {notifications.map((notification, index) => {
                const notificationId = `notification_${notification.timestamp.toString()}_${index}`;
                const timestamp = Number(notification.timestamp) / 1_000_000;
                const timeAgo = formatDistanceToNow(new Date(timestamp), {
                  addSuffix: true,
                });
                const isUnread = !notification.isRead;

                return (
                  <motion.button
                    key={notificationId}
                    type="button"
                    onClick={() =>
                      handleMarkAsRead(notificationId, notification.isRead)
                    }
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING, delay: index * 0.04 }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    data-ocid={`notifications.item.${index + 1}`}
                    className="w-full text-left rounded-2xl px-4 py-3.5 transition-colors relative overflow-hidden"
                    style={{
                      background: isUnread
                        ? "oklch(var(--primary) / 0.08)"
                        : "transparent",
                      border: isUnread
                        ? "1px solid oklch(var(--primary) / 0.2)"
                        : "1px solid transparent",
                    }}
                  >
                    {/* Unread left bar */}
                    {isUnread && (
                      <span
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                        style={{ background: "oklch(var(--primary))" }}
                      />
                    )}

                    <div className="flex items-start gap-3">
                      <NotificationIcon type={notification.notificationType} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {typeLabel(notification.notificationType)}
                          </p>
                          {isUnread && (
                            <span
                              className="flex-shrink-0 w-2 h-2 rounded-full"
                              style={{ background: "oklch(var(--primary))" }}
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          <span className="font-medium text-foreground">
                            {notification.senderName}
                          </span>{" "}
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1.5">
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </>
  );
}
