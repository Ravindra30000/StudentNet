"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { createNotification } from "@/lib/notifications";

export async function startConversation(recipientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.id === recipientId) {
    throw new Error("Cannot message yourself");
  }

  // 1. Check if a 1:1 conversation already exists
  const { data: myConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);

  const myConvIds = myConvs?.map((c) => c.conversation_id) || [];

  if (myConvIds.length > 0) {
    const { data: commonConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("conversation_id", myConvIds)
      .eq("profile_id", recipientId)
      .limit(1);

    if (commonConvs && commonConvs.length > 0) {
      // Redirect to the existing conversation
      redirect(`/dashboard/messages?id=${commonConvs[0].conversation_id}`);
    }
  }

  // 2. Create new conversation if none exists
  const newConversationId = randomUUID();
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: newConversationId });

  if (convError) {
    console.error("Error creating conversation:", convError);
    throw new Error("Failed to create conversation");
  }

  const participants = [
    { conversation_id: newConversationId, profile_id: user.id },
    { conversation_id: newConversationId, profile_id: recipientId },
  ];

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(participants);

  if (partError) {
    console.error("Error adding participants:", partError);
    throw new Error("Failed to add participants to conversation");
  }

  revalidatePath("/dashboard/messages");
  redirect(`/dashboard/messages?id=${newConversationId}`);
}

export async function sendMessage(conversationId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("Message body cannot be empty");
  }

  // Double check if the user is a participant
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!participant) {
    throw new Error("Not a participant of this conversation");
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: trimmedBody,
  });

  if (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }

  // Notify other participants
  try {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("profile_id")
      .eq("conversation_id", conversationId)
      .neq("profile_id", user.id);

    if (participants && participants.length > 0) {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const senderName = senderProfile?.full_name || "Someone";
      const bodyPreview = trimmedBody.length > 50 ? trimmedBody.substring(0, 50) + "..." : trimmedBody;

      for (const p of participants) {
        await createNotification(
          supabase,
          p.profile_id,
          "message",
          {
            title: "New Message",
            message: `${senderName} sent you a message: "${bodyPreview}"`,
            link: `/dashboard/messages?id=${conversationId}`,
          }
        );
      }
    }
  } catch (notifErr) {
    console.error("Error creating message notification:", notifErr);
  }

  revalidatePath("/dashboard/messages");
}

export async function markAsRead(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Error marking messages as read:", error);
  }

  revalidatePath("/dashboard/messages");
}
