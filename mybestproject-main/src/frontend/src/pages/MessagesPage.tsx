import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import {
  ArrowLeft,
  Check,
  Edit3,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video as VideoIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useGetFriends, useGetMessagesWithUser, useGetUserProfile, useSendMessage } from "../hooks/useQueries";

export default function MessagesPage() {
  const { identity } = useInternetIdentity();
  const [selectedFriend, setSelectedFriend] = useState<Principal | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "chat">("list");
  const [messageInput, setMessageInput] = useState("");
  const { data: friends = [] } = useGetFriends();
  const { data: messages = [] } = useGetMessagesWithUser(selectedFriend);
  const { data: selectedProfile } = useGetUserProfile(selectedFriend);
  const sendMessageMutation = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      onSuccess: () => setMessageInput("")
    });
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
          friends.map((friend) => (
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
            <p className="text-sm">Start a conversation with your friends</p>
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
          <button className="p-2.5 rounded-full hover:bg-muted transition-colors text-primary"><VideoIcon size={20} /></button>
          <button className="p-2.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"><MoreVertical size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.sender.toString() === identity?.getPrincipal().toString();
          return (
            <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-premium-sm ${
                isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/50 rounded-bl-sm"
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end opacity-60" : "opacity-40"}`}>
                  <span className="text-[10px] font-medium">10:42 PM</span>
                  {isMe && <Check size={12} />}
                </div>
              </div>
            </div>
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
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all shadow-premium-md"
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
    </div>
  );
}

function FriendItem({ friend, onClick }: { friend: Principal, onClick: () => void }) {
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
          <span className="text-[10px] font-bold text-muted-foreground">12m ago</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1 font-medium italic">
          Tap to chat...
        </p>
      </div>
    </button>
  );
}
