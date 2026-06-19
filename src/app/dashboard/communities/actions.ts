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

export async function createCommunity(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim() || null;

  if (!name) {
    redirect("/dashboard/communities?error=Community name is required");
  }

  // Generate unique slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Insert community
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .insert({
      slug,
      name,
      description,
      cover_image_url,
      leader_id: user.id,
    })
    .select()
    .single();

  if (communityError || !community) {
    redirect(`/dashboard/communities?error=${encodeURIComponent(communityError?.message || "Failed to create community")}`);
  }

  // Add leader to community_members
  const { error: memberError } = await supabase.from("community_members").insert({
    community_id: community.id,
    profile_id: user.id,
    role: "leader",
  });

  if (memberError) {
    redirect(`/dashboard/communities?error=${encodeURIComponent(memberError.message)}`);
  }

  revalidatePath("/communities");
  revalidatePath("/dashboard/communities");
  redirect(`/communities/${community.slug}`);
}

export async function joinCommunity(communityId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    profile_id: user.id,
    role: "member",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/communities");
  revalidatePath("/dashboard/communities");
}

export async function leaveCommunity(communityId: string) {
  const { supabase, user } = await requireUser();

  // Make sure they are not the leader
  const { data: community } = await supabase
    .from("communities")
    .select("leader_id")
    .eq("id", communityId)
    .single();

  if (community?.leader_id === user.id) {
    throw new Error("As the leader, you cannot leave the community. Delete it instead.");
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("profile_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/communities");
  revalidatePath("/dashboard/communities");
}

// ✅ SECURITY FIX: verify caller is a community member before posting
export async function createCommunityPost(formData: FormData) {
  const { supabase, user } = await requireUser();

  const communityId = String(formData.get("community_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const slug = String(formData.get("slug") ?? "");

  if (!communityId || !body) {
    redirect(`/communities/${slug}?error=Post body cannot be empty`);
  }

  // Verify the user is a member of this community
  const { data: membership } = await supabase
    .from("community_members")
    .select("profile_id")
    .eq("community_id", communityId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect(`/communities/${slug}?error=You must be a member to post in this community`);
  }

  // Insert post
  const { error } = await supabase.from("community_posts").insert({
    community_id: communityId,
    author_id: user.id,
    body,
  });

  if (error) {
    redirect(`/communities/${slug}?error=${encodeURIComponent(error.message)}`);
  }

  // Get community name
  let communityName = "Community";
  try {
    const { data: community } = await supabase
      .from("communities")
      .select("name")
      .eq("id", communityId)
      .maybeSingle();
    if (community) communityName = community.name;
  } catch (commErr) {
    console.error("Error fetching community name for notification:", commErr);
  }

  // Notify other community members
  try {
    const { data: members } = await supabase
      .from("community_members")
      .select("profile_id")
      .eq("community_id", communityId)
      .neq("profile_id", user.id);

    if (members && members.length > 0) {
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const authorName = authorProfile?.full_name || "A member";
      const bodyPreview = body.length > 50 ? body.substring(0, 50) + "..." : body;

      const notifications = members.map((m) => ({
        profile_id: m.profile_id,
        type: "community_post",
        payload: {
          title: `New Post in ${communityName}`,
          message: `${authorName} posted: "${bodyPreview}"`,
          link: `/communities/${slug}`,
        },
      }));

      await supabase.from("notifications").insert(notifications);
    }
  } catch (notifErr) {
    console.error("Error creating community post notifications:", notifErr);
  }

  revalidatePath(`/communities/${slug}`);
  redirect(`/communities/${slug}`);
}

export async function deleteCommunity(formData: FormData) {
  const { supabase, user } = await requireUser();
  const communityId = String(formData.get("community_id") ?? "");

  if (!communityId) redirect("/communities?error=Invalid community");

  // Verify ownership
  const { data: community, error: fetchError } = await supabase
    .from("communities")
    .select("id, name, leader_id")
    .eq("id", communityId)
    .maybeSingle();

  if (fetchError || !community) redirect("/communities?error=Community not found");
  if (community.leader_id !== user.id) redirect("/communities?error=Unauthorized");

  // Notify all members (except the leader) before deletion
  try {
    const { data: members } = await supabase
      .from("community_members")
      .select("profile_id")
      .eq("community_id", communityId)
      .neq("profile_id", user.id);

    if (members && members.length > 0) {
      const notifications = members.map((m) => ({
        profile_id: m.profile_id,
        type: "system",
        payload: {
          title: "Community Dissolved",
          message: `The community "${community.name}" has been dissolved by its leader.`,
        },
      }));
      await supabase.from("notifications").insert(notifications);
    }
  } catch (notifErr) {
    console.error("Error sending community deletion notifications:", notifErr);
  }

  // Delete community (cascade: members, posts, linked events → SET NULL)
  const { error: deleteError } = await supabase
    .from("communities")
    .delete()
    .eq("id", communityId)
    .eq("leader_id", user.id);

  if (deleteError) {
    redirect(`/communities?error=${encodeURIComponent(deleteError.message)}`);
  }

  revalidatePath("/communities");
  revalidatePath("/dashboard/communities");
  redirect("/communities");
}
