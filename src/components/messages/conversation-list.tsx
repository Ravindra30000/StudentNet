"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: string;
  college: string | null;
  branch: string | null;
}

interface LastMessage {
  body: string;
  created_at: string;
  sender_id: string;
  read_at: string | null;
}

interface ConversationItem {
  id: string;
  recipient: Profile;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  currentUserId: string;
}

export default function ConversationList({
  conversations,
  currentUserId,
}: ConversationListProps) {
  const searchParams = useSearchParams();
  const activeId = searchParams.get("id");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.recipient?.full_name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border shrink-0 w-full md:w-[320px] lg:w-[380px]">
      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="relative flex items-center">
          <svg
            className="absolute left-4 h-5 w-5 text-muted pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-surface-sunken py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition-all focus:border-accent-green focus:bg-surface focus:ring-1 focus:ring-accent-green"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeId;
            const recipient = conv.recipient;
            const lastMsg = conv.lastMessage;
            const isUnread = conv.unreadCount > 0;

            const charSum = recipient?.full_name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) ?? 0;
            const gradients = [
              "from-emerald-400 to-teal-600",
              "from-amber-400 to-orange-500",
              "from-rose-400 to-red-600",
              "from-sky-400 to-blue-600",
              "from-violet-400 to-purple-600",
            ];
            const gradient = gradients[charSum % gradients.length];
            const initials = recipient?.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <Link
                key={conv.id}
                href={`/dashboard/messages?id=${conv.id}`}
                className={`flex items-center gap-3.5 p-3 rounded-[16px] transition-all duration-200 hover:bg-surface-sunken relative group ${
                  isActive ? "bg-surface-sunken border border-border/60" : "border border-transparent"
                }`}
              >
                {/* Unread Dot indicator */}
                {isUnread && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ink" />
                )}

                {/* Avatar */}
                <div className={`relative shrink-0 w-12 h-12 rounded-full overflow-hidden ${isUnread ? "ml-2" : ""}`}>
                  {recipient?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={recipient.avatar_url}
                      alt={recipient.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                      {initials}
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-sm text-ink truncate block ${isUnread ? "font-bold" : "font-semibold"}`}>
                      {recipient?.full_name}
                    </span>
                    {lastMsg && (
                      <span className={`text-xs ${isUnread ? "text-accent-green font-bold" : "text-muted"}`}>
                        {formatTime(lastMsg.created_at)}
                      </span>
                    )}
                  </div>
                  {lastMsg ? (
                    <p className={`text-sm truncate ${isUnread ? "text-ink font-semibold" : "text-muted"}`}>
                      {lastMsg.sender_id === currentUserId ? "You: " : ""}
                      {lastMsg.body}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted">No messages yet</p>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted text-sm">
            {searchQuery ? "No conversations match search" : "No conversations found"}
          </div>
        )}
      </div>
    </div>
  );
}
