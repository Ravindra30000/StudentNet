"use client";

import { useState, useTransition } from "react";
import { sendMessage } from "@/app/dashboard/messages/actions";

interface MessageComposerProps {
  conversationId: string;
}

export default function MessageComposer({ conversationId }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || isPending) return;

    setBody(""); // Optimistically clear input immediately

    startTransition(async () => {
      try {
        await sendMessage(conversationId, text);
      } catch (err) {
        console.error("Failed to send message:", err);
        setBody(text); // Restore text on failure
      }
    });
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-4 border-t border-border bg-surface shrink-0"
    >
      <div className="flex items-center gap-2.5 bg-surface-sunken rounded-full px-4 py-2 ring-1 ring-border focus-within:ring-accent-green focus-within:ring-2 transition-all">
        <input
          type="text"
          placeholder="Type a message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-transparent border-none text-ink text-sm outline-none placeholder:text-muted py-2 px-1 focus:ring-0"
        />

        <button
          type="submit"
          disabled={!body.trim() || isPending}
          aria-label="Send message"
          className="w-10 h-10 rounded-full bg-ink hover:bg-accent-green disabled:bg-muted/40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4Z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
