"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markAsRead } from "@/app/dashboard/messages/actions";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: string;
  college: string | null;
  branch: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface MessageThreadProps {
  conversationId: string;
  recipient: Profile;
  initialMessages: Message[];
  currentUserId: string;
}

export default function MessageThread({
  conversationId,
  recipient,
  initialMessages,
  currentUserId,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [prevInitialMessages, setPrevInitialMessages] = useState<Message[]>(initialMessages);

  if (initialMessages !== prevInitialMessages) {
    setPrevInitialMessages(initialMessages);
    setMessages(initialMessages);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Trigger mark as read when conversationId changes
  useEffect(() => {
    markAsRead(conversationId);
  }, [conversationId]);

  // Subscribe to Realtime messages INSERT events
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) return prev;
            // Filter out the optimistic message matching this body and sender
            const filtered = prev.filter(
              (m) => !(m.sender_id === newMessage.sender_id && m.body === newMessage.body && m.id.startsWith("temp-"))
            );
            return [...filtered, newMessage];
          });

          // Mark incoming message as read
          if (newMessage.sender_id !== currentUserId) {
            markAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, supabase]);

  // Listen to optimistic messages sent by MessageComposer
  useEffect(() => {
    const handleOptimistic = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newMsg = { ...customEvent.detail };
      
      if (newMsg.conversation_id !== conversationId) return;

      newMsg.sender_id = currentUserId;

      setMessages((prev) => {
        // Prevent duplicate
        if (prev.some((m) => m.id === newMsg.id || (m.body === newMsg.body && m.sender_id === currentUserId))) {
          return prev;
        }
        return [...prev, newMsg];
      });
    };

    const handleFailed = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id } = customEvent.detail;
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    window.addEventListener("optimistic-message", handleOptimistic);
    window.addEventListener("optimistic-message-failed", handleFailed);
    return () => {
      window.removeEventListener("optimistic-message", handleOptimistic);
      window.removeEventListener("optimistic-message-failed", handleFailed);
    };
  }, [conversationId, currentUserId]);

  // Scroll to bottom on message change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const formatDateSeparator = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  };

  // Avatar variables
  const charSum = recipient.full_name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-600",
    "from-sky-400 to-blue-600",
    "from-violet-400 to-purple-600",
  ];
  const gradient = gradients[charSum % gradients.length];
  const initials = recipient.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const renderedMessages: React.ReactNode[] = [];
  let lastDateStr = "";

  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== lastDateStr) {
      renderedMessages.push(
        <div key={`sep-${msg.id}`} className="flex justify-center my-4 select-none">
          <span className="px-3 py-1 bg-surface-sunken text-muted text-[11px] font-semibold rounded-full uppercase tracking-wider">
            {formatDateSeparator(msg.created_at)}
          </span>
        </div>
      );
      lastDateStr = msgDate;
    }

    const isMe = msg.sender_id === currentUserId;
    const isOptimistic = msg.id.startsWith("temp-");
    
    renderedMessages.push(
      <div
        key={msg.id}
        className={`flex items-end gap-2.5 max-w-[80%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}
      >
        {!isMe && (
          <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden mb-1">
            {recipient.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={recipient.avatar_url} alt={recipient.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-xs`}>
                {initials}
              </div>
            )}
          </div>
        )}
        <div className={`space-y-1 ${isMe ? "flex flex-col items-end" : ""}`}>
          <div
            className={`px-4 py-2.5 rounded-[20px] shadow-sm text-sm inline-block ${
              isMe
                ? "bg-ink text-white rounded-br-sm"
                : "bg-surface-sunken text-ink rounded-bl-sm"
            } ${isOptimistic ? "opacity-60 animate-pulse" : ""}`}
          >
            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
          </div>
          <span className="text-[10px] text-muted block mt-0.5 px-1">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-surface min-w-0">
      {/* Header */}
      <div className="h-16 px-6 flex items-center border-b border-border shrink-0 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/messages"
            className="md:hidden flex items-center justify-center -ml-2 p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface-sunken transition-all cursor-pointer mr-1"
            aria-label="Back to conversations"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden">
            {recipient.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={recipient.avatar_url} alt={recipient.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink truncate">{recipient.full_name}</h2>
            <p className="text-xs text-muted truncate">
              {recipient.role === "student"
                ? [recipient.branch, recipient.college].filter(Boolean).join(" • ")
                : recipient.role.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col scroll-smooth"
      >
        {renderedMessages.length > 0 ? (
          renderedMessages
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted">
            Send a message to start the conversation!
          </div>
        )}
      </div>
    </div>
  );
}
