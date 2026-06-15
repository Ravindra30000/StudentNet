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

export async function createTeam(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const avatar_url = String(formData.get("avatar_url") ?? "").trim() || null;

  if (!name) {
    redirect("/dashboard/team?error=Team name is required");
  }

  // Generate slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Create team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      slug,
      name,
      description,
      avatar_url,
      created_by: user.id,
    })
    .select()
    .single();

  if (teamError || !team) {
    redirect(`/dashboard/team?error=${encodeURIComponent(teamError?.message || "Failed to create team")}`);
  }

  // Add creator as Lead member
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    profile_id: user.id,
    role: "Lead",
  });

  if (memberError) {
    redirect(`/dashboard/team?error=${encodeURIComponent(memberError.message)}`);
  }

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

export async function addTeamMember(formData: FormData) {
  const { supabase, user } = await requireUser();

  const teamId = String(formData.get("team_id") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "Member").trim();

  if (!teamId || !username) {
    redirect(`/dashboard/team?error=Username is required`);
  }

  // Verify user is owner/creator of the team
  const { data: team, error: teamFetchError } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  if (teamFetchError || !team || team.created_by !== user.id) {
    redirect(`/dashboard/team?error=You do not have permission to add members to this team`);
  }

  // Find profile of the user to add
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    redirect(`/dashboard/team?error=User '${username}' not found`);
  }

  // Add user to team
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: teamId,
    profile_id: profile.id,
    role,
  });

  if (memberError) {
    // Check if error is key duplicate
    if (memberError.code === "23505") {
      redirect(`/dashboard/team?error=User is already a member of this team`);
    }
    redirect(`/dashboard/team?error=${encodeURIComponent(memberError.message)}`);
  }

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

export async function removeTeamMember(teamId: string, profileId: string) {
  const { supabase, user } = await requireUser();

  // Verify owner
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  if (teamError || !team || team.created_by !== user.id) {
    throw new Error("Unauthorized");
  }

  if (profileId === user.id) {
    throw new Error("You cannot remove yourself from your own team. Delete the team instead.");
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/team");
}

export async function deleteTeam(teamId: string) {
  const { supabase, user } = await requireUser();

  // Verify owner
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  if (teamError || !team || team.created_by !== user.id) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

export async function toggleProjectTeamLink(projectId: string, teamId: string | null) {
  const { supabase, user } = await requireUser();

  if (teamId) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("created_by")
      .eq("id", teamId)
      .single();

    if (teamError || !team || team.created_by !== user.id) {
      throw new Error("Unauthorized");
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ team_id: teamId })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/team");
}
