import { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationPayload {
  title: string;
  message: string;
  link?: string;
  [key: string]: unknown;
}

export async function createNotification(
  supabase: SupabaseClient,
  profileId: string,
  type: string,
  payload: NotificationPayload
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      profile_id: profileId,
      type,
      payload,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error.message);
  }
  return data;
}

export async function notifyAllUsers(
  supabase: SupabaseClient,
  type: string,
  payload: NotificationPayload,
  excludeUserId?: string
) {
  // Fetch all user profile IDs
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id");

  if (profileError || !profiles) {
    console.error("Error fetching profiles for notification:", profileError?.message);
    return;
  }

  const inserts = profiles
    .filter((p) => p.id !== excludeUserId)
    .map((p) => ({
      profile_id: p.id,
      type,
      payload,
    }));

  if (inserts.length > 0) {
    const { error } = await supabase.from("notifications").insert(inserts);
    if (error) {
      console.error("Error broadcasting notifications:", error.message);
    }
  }
}
