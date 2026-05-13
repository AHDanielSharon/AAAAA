import { useAppActor } from "./useAppActor";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Comment,
  ExternalBlob,
  FriendRequest,
  FriendRequestStatus,
  Message,
  Notification,
  ReelStats,
  SearchUsersResult,
  Story,
  UploadStoryRequest,
  UploadVideoRequest,
  UserProfile,
  Video,
} from "../backend";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useAppActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) return null; // Gracefully handle missing actor
      try {
        return await actor.getCallerUserProfile();
      } catch (e) {
        console.warn("Failed to fetch profile:", e);
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useAppActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal?.toString() || "none"],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useUpdateProfileImage() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: ExternalBlob) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateProfileImage(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile picture updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile image: ${error.message}`);
    },
  });
}

export function useGetAllVideos() {
  const { actor, isFetching } = useAppActor();

  return useQuery<Video[]>({
    queryKey: ["videos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByCreator(creator: Principal | null) {
  const { actor, isFetching } = useAppActor();

  return useQuery<Video[]>({
    queryKey: ["videos", "creator", creator?.toString() || "none"],
    queryFn: async () => {
      if (!actor || !creator) return [];
      return actor.getVideosByCreator(creator);
    },
    enabled: !!actor && !isFetching && !!creator,
  });
}

export function useUploadVideo() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UploadVideoRequest) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadVideo(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast.success("Video uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload video: ${error.message}`);
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteVideo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast.success("Video deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete video: ${error.message}`);
    },
  });
}

export function useSearchVideos(searchTerm: string) {
  const { actor, isFetching } = useAppActor();

  return useQuery<Video[]>({
    queryKey: ["videos", "search", searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchVideos(searchTerm);
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
  });
}

export function useGetAllActiveStories() {
  const { actor, isFetching } = useAppActor();

  return useQuery<Story[]>({
    queryKey: ["stories", "active"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveStories();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60000,
  });
}

export function useGetActiveStoriesByUser(principal: Principal | null) {
  const { actor, isFetching } = useAppActor();

  return useQuery<Story[]>({
    queryKey: ["stories", "user", principal?.toString() || "none"],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getActiveStoriesByUser(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useUploadStory() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UploadStoryRequest) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadStory(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload story: ${error.message}`);
    },
  });
}

export function useDeleteStory() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteOwnStory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete story: ${error.message}`);
    },
  });
}

// Friend Request Hooks
export function useSendFriendRequest() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipient: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendFriendRequest(recipient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequestStatus"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Friend request sent");
    },
    onError: (error: Error) => {
      toast.error(`Failed to send friend request: ${error.message}`);
    },
  });
}

export function useAcceptFriendRequest() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sender: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.acceptFriendRequest(sender);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequestStatus"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Friend request accepted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to accept friend request: ${error.message}`);
    },
  });
}

export function useRejectFriendRequest() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sender: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rejectFriendRequest(sender);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequestStatus"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Friend request rejected");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject friend request: ${error.message}`);
    },
  });
}

export function useGetFriends() {
  const { actor, isFetching } = useAppActor();

  return useQuery<Principal[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useSearchUsers(searchTerm: string) {
  const { actor, isFetching } = useAppActor();

  return useQuery<SearchUsersResult>({
    queryKey: ["searchUsers", searchTerm],
    queryFn: async () => {
      if (!actor) return { profiles: [], friends: [], pendingRequests: [] };
      const result = await actor.searchUsers(searchTerm);
      return result;
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
    refetchInterval: 5000,
  });
}

export function useGetFriendRequestStatus(otherUser: Principal | null) {
  const { actor, isFetching } = useAppActor();

  return useQuery<FriendRequestStatus | null>({
    queryKey: ["friendRequestStatus", otherUser?.toString()],
    queryFn: async () => {
      if (!actor || !otherUser) return null;
      try {
        return await actor.getFriendRequestStatus(otherUser);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!otherUser,
    retry: false,
    refetchInterval: 3000,
  });
}

// Messaging Hooks
export function useSendMessage() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      content,
      attachments,
    }: {
      recipient: Principal;
      content: string;
      attachments?: ExternalBlob[] | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendMessage(recipient, content, attachments || null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.recipient.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["allMessages"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

export function useGetMessagesWithUser(otherUser: Principal | null) {
  const { actor, isFetching } = useAppActor();

  return useQuery<Message[]>({
    queryKey: ["messages", otherUser?.toString() || "none"],
    queryFn: async () => {
      if (!actor || !otherUser) return [];
      return actor.getMessagesWithUser(otherUser);
    },
    enabled: !!actor && !isFetching && !!otherUser,
    refetchInterval: 3000,
  });
}

export function useGetAllMessages() {
  const { actor, isFetching } = useAppActor();

  return useQuery<Message[]>({
    queryKey: ["allMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useStartChatWithUser() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUser: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.startChatWithUser(targetUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allMessages"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to start chat: ${error.message}`);
    },
  });
}

// Reel Interaction Hooks
export function useGetReelStats(reelId: string) {
  const { actor, isFetching } = useAppActor();

  return useQuery<ReelStats>({
    queryKey: ["reelStats", reelId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getReelStats(reelId);
    },
    enabled: !!actor && !isFetching && !!reelId,
    refetchInterval: 5000,
  });
}

export function useLikeReel() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.likeReel(reelId);
    },
    onSuccess: (_, reelId) => {
      queryClient.invalidateQueries({ queryKey: ["reelStats", reelId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to like reel: ${error.message}`);
    },
  });
}

export function useDislikeReel() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.dislikeReel(reelId);
    },
    onSuccess: (_, reelId) => {
      queryClient.invalidateQueries({ queryKey: ["reelStats", reelId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to dislike reel: ${error.message}`);
    },
  });
}

export function useAddComment() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reelId,
      comment,
    }: { reelId: string; comment: Comment }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addComment(reelId, comment);
    },
    onSuccess: (_, { reelId }) => {
      queryClient.invalidateQueries({ queryKey: ["reelStats", reelId] });
      toast.success("Comment added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

export function useShareReel() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.shareReel(reelId);
    },
    onSuccess: (_, reelId) => {
      queryClient.invalidateQueries({ queryKey: ["reelStats", reelId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to share reel: ${error.message}`);
    },
  });
}

export function useIncrementViews() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.incrementViews(reelId);
    },
    onSuccess: (_, reelId) => {
      queryClient.invalidateQueries({ queryKey: ["reelStats", reelId] });
    },
  });
}

export function useGetAllComments(reelId: string) {
  const { actor, isFetching } = useAppActor();

  return useQuery<Comment[]>({
    queryKey: ["comments", reelId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllComments(reelId);
    },
    enabled: !!actor && !isFetching && !!reelId,
  });
}

// Notification Hooks
export function useGetUserNotifications() {
  const { actor, isFetching } = useAppActor();

  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching } = useAppActor();

  return useQuery<bigint>({
    queryKey: ["unreadNotificationCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadNotificationCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useMarkNotificationAsRead() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });
}

// WebRTC Signaling Hooks
export function useStoreSignalingData() {
  const { actor } = useAppActor();

  return useMutation({
    mutationFn: async ({
      sessionId,
      dataType,
      data,
    }: {
      sessionId: string;
      dataType: string;
      data: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.storeSignalingData(sessionId, dataType, data);
    },
  });
}

export function useGetSignalingData(sessionId: string, enabled = true) {
  const { actor, isFetching } = useAppActor();

  return useQuery<
    Array<{ dataType: string; data: string; sender: { toString(): string } }>
  >({
    queryKey: ["signalingData", sessionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSignalingData(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId && enabled,
  });
}

export function useClearSignalingData() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearSignalingData(sessionId);
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["signalingData", sessionId] });
    },
  });
}

// Logo Hooks
export function useGetLogo() {
  const { actor, isFetching } = useAppActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ["logo"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLogo();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Web Push subscription hooks ───────────────────────────────────────────────
// IMPORTANT: The backend must expose registerPushSubscription(endpoint, p256dhKey, authKey)
// and removePushSubscription() methods for these hooks to call.
// See contracts.backend.newFunctions in the project dispatch.
// VITE_VAPID_PUBLIC_KEY must be set in your .env file (see usePushNotifications.ts).

export function useRegisterPushSubscription() {
  const { actor } = useAppActor();

  return useMutation({
    mutationFn: async ({
      endpoint,
      p256dhKey,
      authKey,
    }: {
      endpoint: string;
      p256dhKey: string;
      authKey: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // Cast to any to support backend versions that have the method
      // biome-ignore lint/suspicious/noExplicitAny: dynamic backend method check
      const a = actor as unknown as {
        registerPushSubscription?: (e: string, p: string, k: string) => unknown;
      };
      if (typeof a.registerPushSubscription !== "function") {
        console.warn(
          "[Push] registerPushSubscription not available in backend yet.",
        );
        return;
      }
      await (a.registerPushSubscription(
        endpoint,
        p256dhKey,
        authKey,
      ) as Promise<unknown>);
    },
  });
}

export function useRemovePushSubscription() {
  const { actor } = useAppActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      // biome-ignore lint/suspicious/noExplicitAny: dynamic backend method check
      const a = actor as unknown as { removePushSubscription?: () => unknown };
      if (typeof a.removePushSubscription !== "function") {
        console.warn(
          "[Push] removePushSubscription not available in backend yet.",
        );
        return;
      }
      await (a.removePushSubscription() as Promise<unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pushSubscription"] });
    },
  });
}
