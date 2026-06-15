"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireUser();

  const communityId = String(formData.get("community_id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const starts_at = String(formData.get("starts_at") ?? "").trim();
  const ends_at = String(formData.get("ends_at") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const is_online = formData.get("is_online") === "true";

  if (!title || !starts_at || !ends_at) {
    redirect("/dashboard/communities?error=Title, starts at, and ends at dates are required");
  }

  // If communityId is provided, verify user leads it
  if (communityId) {
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("leader_id")
      .eq("id", communityId)
      .single();

    if (communityError || !community || community.leader_id !== user.id) {
      redirect("/dashboard/communities?error=Unauthorized: You do not lead this community");
    }
  }

  // Generate unique slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Insert event
  const { error } = await supabase.from("events").insert({
    slug,
    community_id: communityId,
    title,
    description,
    starts_at,
    ends_at,
    location,
    is_online,
  });

  if (error) {
    redirect(`/dashboard/communities?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  if (communityId) {
    // Revalidate community detail page
    const { data: comm } = await supabase
      .from("communities")
      .select("slug")
      .eq("id", communityId)
      .single();
    if (comm) {
      revalidatePath(`/communities/${comm.slug}`);
    }
  }

  revalidatePath("/dashboard/communities");
  redirect("/dashboard/communities?success=Event scheduled successfully!");
}

export async function registerForEvent(eventId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    profile_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/events");
  
  // Revalidate specific event page by fetching its slug
  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single();

  if (event) {
    revalidatePath(`/events/${event.slug}`);
  }
}

export async function unregisterFromEvent(eventId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/events");

  // Revalidate specific event page by fetching its slug
  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single();

  if (event) {
    revalidatePath(`/events/${event.slug}`);
  }
}
