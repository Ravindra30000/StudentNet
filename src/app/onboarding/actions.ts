"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { sanitizeUrl } from "@/lib/validation";

export async function createProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "student") as Role;
  const college = String(formData.get("college") ?? "").trim() || null;
  const branch = String(formData.get("branch") ?? "").trim() || null;
  const graduation_year_raw = formData.get("graduation_year");
  const graduation_year = graduation_year_raw
    ? Number(graduation_year_raw)
    : null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const profession = String(formData.get("profession") ?? "").trim() || null;
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

  const customSkillsRaw = formData.getAll("custom_skills");
  const customSkillNames = customSkillsRaw
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  if (!username || !full_name) {
    redirect("/onboarding?error=Username and full name are required");
  }

  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    redirect(
      "/onboarding?error=Username must be 3-30 characters: lowercase letters, numbers, _ or -"
    );
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    full_name,
    role,
    avatar_url,
    college,
    branch,
    graduation_year,
    company,
    profession,
    bio,
    github_url,
    linkedin_url,
    portfolio_url,
  });

  if (profileError) {
    if (profileError.code === "23505") {
      redirect("/onboarding?error=That username is already taken");
    }
    redirect(`/onboarding?error=${encodeURIComponent(profileError.message)}`);
  }

  // Resolve custom skills
  const finalSkillIds = [...skillIds];
  if (customSkillNames.length > 0) {
    for (const name of customSkillNames) {
      // Find if skill already exists case-insensitively
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", name)
        .maybeSingle();

      if (existingSkill) {
        finalSkillIds.push(Number(existingSkill.id));
      } else {
        // Insert new custom skill
        const { data: newSkill, error: insertSkillError } = await supabase
          .from("skills")
          .insert({
            name,
            category: "Custom",
          })
          .select("id")
          .single();

        if (!insertSkillError && newSkill) {
          finalSkillIds.push(Number(newSkill.id));
        }
      }
    }
  }

  // Save all profile skills links
  if (finalSkillIds.length > 0) {
    // Unique list to prevent duplicates
    const uniqueSkillIds = Array.from(new Set(finalSkillIds));
    const rows = uniqueSkillIds.map((skill_id) => ({
      profile_id: user.id,
      skill_id,
    }));
    await supabase.from("profile_skills").insert(rows);
  }

  redirect(`/u/${username}`);
}
