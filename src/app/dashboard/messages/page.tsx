import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationList from "@/components/messages/conversation-list";
import MessageThread from "@/components/messages/message-thread";
import MessageComposer from "@/components/messages/message-composer";

export const dynamic = "force-dynamic";

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

interface ConversationItem {
  id: string;
  recipient: Profile;
  lastMessage: {
    body: string;
    created_at: string;
    sender_id: string;
    read_at: string | null;
  } | null;
  unreadCount: number;
}


export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: activeId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  // 1. Fetch conversations this user is part of
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);

  const conversationIds = participations?.map((p) => p.conversation_id) || [];

  let conversationList: ConversationItem[] = [];
  if (conversationIds.length > 0) {
    // Fetch recipient profile info for each conversation
    const { data: others } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        profile:profiles(
          id,
          full_name,
          username,
          avatar_url,
          role,
          college,
          branch
        )
      `)
      .in("conversation_id", conversationIds)
      .neq("profile_id", user.id);

    // Fetch the last message and unread count for each conversation
    conversationList = await Promise.all(
      (others ?? []).map(async (other) => {
        const { data: lastMessages } = await supabase
          .from("messages")
          .select("body, created_at, sender_id, read_at")
          .eq("conversation_id", other.conversation_id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", other.conversation_id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        const recipientRaw = other.profile;
        const recipient = (Array.isArray(recipientRaw) ? recipientRaw[0] : recipientRaw) as Profile;

        return {
          id: other.conversation_id,
          recipient,
          lastMessage: lastMessages?.[0] || null,
          unreadCount: count || 0,
        };
      })
    );

    // Sort by last message time descending
    conversationList.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }

  // 2. If activeId is provided, verify participation and load messages
  let activeRecipient: Profile | null = null;
  let messages: Message[] = [];

  if (activeId) {
    const isParticipant = conversationIds.includes(activeId);
    if (isParticipant) {
      // Get the recipient profile
      const { data: recipientParticipant } = await supabase
        .from("conversation_participants")
        .select(`
          profile:profiles(
            id,
            full_name,
            username,
            avatar_url,
            role,
            college,
            branch
          )
        `)
        .eq("conversation_id", activeId)
        .neq("profile_id", user.id)
        .maybeSingle();

      if (recipientParticipant && recipientParticipant.profile) {
        const profileRaw = recipientParticipant.profile;
        activeRecipient = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as Profile;

        // Fetch thread messages
        const { data: threadMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", activeId)
          .order("created_at", { ascending: true });

        messages = threadMessages ?? [];
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6 md:py-10 flex flex-col flex-1">
      <div className={`mb-6 justify-between items-baseline shrink-0 ${activeId ? "hidden md:flex" : "flex"}`}>
        <h1 className="text-3xl font-bold tracking-tight text-ink font-heading">
          Inbox
        </h1>
      </div>

      {/* Main Card Shell */}
      <div className={`bg-surface rounded-xl border border-border/40 shadow-sm overflow-hidden flex flex-1 ${
        activeId 
          ? "h-[calc(100vh-140px)] md:h-[calc(100vh-220px)] min-h-[450px] md:min-h-[500px]" 
          : "h-[calc(100vh-200px)] md:h-[calc(100vh-220px)] min-h-[450px] md:min-h-[500px]"
      }`}>
        {/* Left list pane */}
        <ConversationList
          conversations={conversationList}
          currentUserId={user.id}
        />

        {/* Right thread pane */}
        <div className={`flex-1 flex flex-col h-full bg-surface min-w-0 ${
          activeId ? "flex" : "hidden md:flex"
        }`}>
          {activeId && activeRecipient ? (
            <>
              <MessageThread
                conversationId={activeId}
                recipient={activeRecipient}
                initialMessages={messages}
                currentUserId={user.id}
              />
              <MessageComposer conversationId={activeId} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface select-none">
              <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center text-muted mb-4 border border-border/50">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink">No Conversation Selected</h3>
              <p className="text-sm text-muted max-w-xs mt-1.5 leading-relaxed">
                Choose a chat from your inbox, or visit a student&apos;s public profile to send them a message!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
