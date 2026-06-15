"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  MessageSquare,
  Calendar,
  Rocket,
  Briefcase,
  Info,
  CheckCheck,
} from "lucide-react";

interface NavbarNotificationsProps {
  userId: string;
}

interface Notification {
  id: string;
  type: string;
  payload: {
    title: string;
    message: string;
    link?: string;
  };
  read_at: string | null;
  created_at: string;
}

export default function NavbarNotifications({ userId }: NavbarNotificationsProps) {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Helper: Format relative timestamp
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // 1. Fetch initial counts
  const fetchUnreadMessageCount = useCallback(async () => {
    try {
      // Get all conversations user is a participant of
      const { data: convs, error: convError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", userId);

      if (convError || !convs || convs.length === 0) {
        setUnreadMessageCount(0);
        return;
      }

      const convIds = convs.map((c) => c.conversation_id);

      // Get count of unread messages from others in those conversations
      const { count, error: countError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .is("read_at", null)
        .neq("sender_id", userId);

      if (!countError && count !== null) {
        setUnreadMessageCount(count);
      }
    } catch (err) {
      console.error("Error fetching unread message count:", err);
    }
  }, [userId, supabase]);

  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch recent 10 notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data as Notification[]);
        // Filter out unread ones
        const unreadCount = data.filter((n) => !n.read_at).length;
        setUnreadNotificationCount(unreadCount);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [userId, supabase]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch initial data and set up realtime subscriptions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnreadMessageCount();
    fetchNotifications();

    // Messages subscription: any inserts or updates in messages
    const messageChannel = supabase
      .channel("navbar-messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          // Verify if it belongs to user's conversations
          const { data } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("profile_id", userId)
            .eq("conversation_id", payload.new.conversation_id)
            .maybeSingle();

          if (data && payload.new.sender_id !== userId) {
            fetchUnreadMessageCount();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          fetchUnreadMessageCount();
        }
      )
      .subscribe();

    // Notifications subscription: updates or inserts on user's notifications
    const notifChannel = supabase
      .channel("navbar-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [userId, supabase, fetchUnreadMessageCount, fetchNotifications]);

  // Mark a single notification as read
  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read_at) {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notif.id);

      if (!error) {
        fetchNotifications();
      }
    }
    setIsOpen(false);
    if (notif.payload.link) {
      router.push(notif.payload.link);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);

    if (!error) {
      fetchNotifications();
    }
  };

  // Notification icon selector
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application":
        return <Briefcase className="h-4 w-4 text-accent-green" />;
      case "event":
        return <Calendar className="h-4 w-4 text-accent-green" />;
      case "startup":
        return <Rocket className="h-4 w-4 text-accent-green" />;
      default:
        return <Info className="h-4 w-4 text-accent-green" />;
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Messages Shortcut Button */}
      <Link
        href="/dashboard/messages"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-sunken text-muted hover:text-ink transition-colors cursor-pointer"
        aria-label="Messages"
      >
        <MessageSquare className="h-4.5 w-4.5" />
        {unreadMessageCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface animate-pulse">
            {unreadMessageCount}
          </span>
        )}
      </Link>

      {/* Notification Bell Dropdown Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-sunken transition-colors cursor-pointer focus:outline-none ${
            isOpen ? "text-ink bg-surface-sunken" : "text-muted hover:text-ink"
          }`}
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Dropdown Card */}
        {isOpen && (
          <div className="absolute right-0 mt-3.5 w-80 md:w-96 origin-top-right rounded-2xl bg-surface p-2 shadow-pop border border-border/80 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40 mb-1.5">
              <span className="text-xs font-bold text-ink font-heading">Notifications</span>
              {unreadNotificationCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[10px] font-bold text-accent-green hover:underline cursor-pointer"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-0.5 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Bell className="h-8 w-8 text-muted/30 mb-2" />
                  <p className="text-xs font-semibold text-muted">All caught up!</p>
                  <p className="text-[10px] text-muted/70 mt-0.5">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer hover:bg-surface-sunken/80 ${
                      !notif.read_at ? "bg-surface-sunken/40 font-semibold" : ""
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-green/10 border border-accent-green/20 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs text-ink truncate ${!notif.read_at ? "font-bold" : "font-semibold"}`}>
                          {notif.payload.title}
                        </p>
                        <span className="text-[9px] text-muted shrink-0">
                          {getRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted mt-0.5 leading-relaxed break-words">
                        {notif.payload.message}
                      </p>
                    </div>
                    {!notif.read_at && (
                      <span className="h-2 w-2 rounded-full bg-accent-green shrink-0 mt-2.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
