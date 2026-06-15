"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { sanitizeUrl } from "@/lib/validation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "student") as Role;
  const college = String(formData.get("college") ?? "").trim() || null;
  const branch = String(formData.get("branch") ?? "").trim() || null;
  const graduation_year_raw = formData.get("graduation_year");
  const graduation_year = graduation_year_raw
    ? Number(graduation_year_raw)
    : null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  // ✅ SECURITY FIX: sanitize URL fields to prevent javascript: URI injection
  const github_url = sanitizeUrl(String(formData.get("github_url") ?? ""));
  const linkedin_url = sanitizeUrl(String(formData.get("linkedin_url") ?? ""));
  const portfolio_url = sanitizeUrl(String(formData.get("portfolio_url") ?? ""));
  const avatar_url = sanitizeUrl(String(formData.get("avatar_url") ?? ""));
  const skillIds = formData
    .getAll("skills")
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      role,
      avatar_url,
      college,
      branch,
      graduation_year,
      bio,
      github_url,
      linkedin_url,
      portfolio_url,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/dashboard?tab=edit&error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("profile_skills").delete().eq("profile_id", user.id);
  if (skillIds.length > 0) {
    await supabase
      .from("profile_skills")
      .insert(skillIds.map((skill_id) => ({ profile_id: user.id, skill_id })));
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?tab=edit&saved=1");
}

export async function addProject(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const tech_stack = String(formData.get("tech_stack") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const demo_url = String(formData.get("demo_url") ?? "").trim() || null;
  const github_url = String(formData.get("github_url") ?? "").trim() || null;
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim() || null;
  const project_images = formData.getAll("project_images").map(url => String(url).trim()).filter(Boolean);
  const video_url = null;

  if (project_images.length > 2) {
    redirect("/dashboard/projects/new?error=You can upload at most 2 gallery images");
  }

  if (!title) {
    redirect("/dashboard/projects/new?error=Title is required");
  }

  const { error } = await supabase.from("projects").insert({
    owner_id: user.id,
    title,
    description,
    tech_stack,
    demo_url,
    github_url,
    cover_image_url,
    project_images,
    video_url,
  });

  if (error) {
    redirect(`/dashboard/projects/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?tab=edit");
}

export async function updateProject(formData: FormData) {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const tech_stack = String(formData.get("tech_stack") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const demo_url = String(formData.get("demo_url") ?? "").trim() || null;
  const github_url = String(formData.get("github_url") ?? "").trim() || null;
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim() || null;
  const project_images = formData.getAll("project_images").map(url => String(url).trim()).filter(Boolean);
  const video_url = null;

  if (project_images.length > 2) {
    redirect(`/dashboard/projects/${id}/edit?error=You can upload at most 2 gallery images`);
  }

  if (!id) {
    redirect("/dashboard?tab=edit&error=Project ID is missing");
  }
  if (!title) {
    redirect(`/dashboard/projects/${id}/edit?error=Title is required`);
  }

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      description,
      tech_stack,
      demo_url,
      github_url,
      cover_image_url,
      project_images,
      video_url,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/dashboard/projects/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?tab=edit");
}

export async function deleteProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");

  await supabase.from("projects").delete().eq("id", id).eq("owner_id", user.id);

  revalidatePath("/dashboard");
}
