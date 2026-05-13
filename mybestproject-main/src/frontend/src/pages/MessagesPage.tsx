import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  ArrowLeft, Check, Edit3, MessageCircle, MoreVertical,
  Paperclip, Phone, Search, Send, Smile, Video as VideoIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import VideoCallDialog from "../components/VideoCallDialog";
import { useGetFriends, useGetMessagesWithUser, useGetUserProfile, useSendMessage } from "../hooks/useQueries";
import { getCurrentUid } from "../firebase";

export default function MessagesPage() {
  const { identity } = useInternetIdentity();
  const myUid = identity?.getPrincipal()?.toString() || getCurrentUid();
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [currentView, setCurrentView] = useState<"list" | "chat">("list");
  const [messageInput, setMessageInput] = useState("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const { data: friends = [] } = useGetFriends();
  const { data: messages = [], refetch: refetchMessages } = useGetMessagesWithUser(selectedFriend);
  const { data: selectedProfile } = useGetUserProfile(selectedFriend);
  const sendMessageMutation = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-refresh messages every 3 seconds for real-time feel
  useEffect(() => {
    if (!selectedFriend) return;
    const interval = setInterval(() => refetchMessages(), 3000);
    return () => clearInterval(interval);
  }, [selectedFriend, refetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedFriend || !messageInput.trim()) return;
    sendMessageMutation.mutate({
      recipient: selectedFriend,
      content: messageInput.trim(),
      attachments: null
    }, {
      onSuccess: () => {
        setMessageInput("");
        setTimeout(() => refetchMessages(), 500);
      }
    });
  };

  const formatTime = (timestamp: any) => {
    try {
      const ms = typeof timestamp === "bigint" ? Number(timestamp / BigInt(1000000)) : Number(timestamp);
      const date = new Date(ms);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const ChatList = () => (
    <div className="flex flex-col h-full bg-background animate-page-in">
      <header className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black tracking-tighter">Messages</h1>
          <button className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Edit3 size={20} />
          </button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full glass-morphism !rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 ring-primary/20"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {friends.length > 0 ? (
          friends.map((friend: any) => (
            <FriendItem 
              key={friend.toString()} 
              friend={friend} 
              onClick={() => {
                setSelectedFriend(friend);
                setCurrentView("chat");
              }} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <MessageCircle size={64} className="mb-4" />
            <p className="font-bold text-lg">No chats yet</p>
            <p className="text-sm">Follow someone first, then start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );

  const ChatView = () => (
    <div className="flex flex-col h-screen bg-background animate-page-in">
      <header className="flex items-center gap-4 p-4 glass border-none shadow-premium-sm sticky top-0 z-10">
        <button onClick={() => setCurrentView("list")} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedProfile?.avatar?.getDirectURL()} />
            <AvatarFallback>{selectedProfile?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold leading-none">{selectedProfile?.name || "User"}</h4>
            <p className="text-[11px] text-green-500 font-bold mt-1">● Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2.5 rounded-full hover:bg-muted transition-colors text-primary"><Phone size={20} /></button>
          <button
            onClick={() => setShowVideoCall(true)}
            className="p-2.5 rounded-full hover:bg-muted transition-colors text-primary"
          >
            <VideoIcon size={20} />
          </button>
          <button className="p-2.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"><MoreVertical size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-20 opacity-30">
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        )}
        {messages.map((msg: any, idx: number) => {
          const isMe = msg.sender.toString() === myUid;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-premium-sm ${
                isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/50 rounded-bl-sm"
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end opacity-60" : "opacity-40"}`}>
                  <span className="text-[10px] font-medium">{formatTime(msg.timestamp)}</span>
                  {isMe && <Check size={12} />}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 safe-bottom">
        <div className="flex items-center gap-2 glass !rounded-full p-2 pl-4 border-none shadow-premium-lg">
          <button className="text-muted-foreground hover:text-primary transition-colors"><Smile size={24} /></button>
          <button className="text-muted-foreground hover:text-primary transition-colors"><Paperclip size={24} /></button>
          <input 
            type="text" 
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-transparent outline-none text-sm px-2"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all shadow-premium-md disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="h-screen w-full">
      {currentView === "list" ? <ChatList /> : <ChatView />}

      {/* Video Call */}
      {showVideoCall && selectedFriend && (
        <VideoCallDialog
          open={true}
          targetUserId={selectedFriend.toString()}
          targetUserName={selectedProfile?.name || "User"}
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </div>
  );
}

function FriendItem({ friend, onClick }: { friend: any, onClick: () => void }) {
  const { data: profile } = useGetUserProfile(friend);
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 w-full p-4 hover:bg-muted/30 rounded-[2rem] transition-colors group"
    >
      <div className="relative">
        <Avatar className="h-14 w-14 shadow-premium-sm border-2 border-background">
          <AvatarImage src={profile?.avatar?.getDirectURL()} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">{profile?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-4 border-background" />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-base group-hover:text-primary transition-colors">{profile?.name || "User"}</h4>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1 font-medium">
          Tap to chat...
        </p>
      </div>
    </button>
  );
}
