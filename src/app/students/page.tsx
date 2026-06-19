import { createClient } from "@/lib/supabase/server";
import ProfileCard, { ProfileCardData } from "@/components/discover/profile-card";
import SearchFilters from "@/components/discover/search-filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Talent — StudentNet",
  description: "Search and discover students by name, skills, college, and role on StudentNet.",
};

interface StudentsPageProps {
  searchParams: Promise<{
    q?: string;
    skill?: string;
    college?: string;
    role?: string;
    grad_year?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { q, skill, college, role, grad_year } = await searchParams;

  const supabase = await createClient();

  // 1. Fetch current logged in user details if available for matching
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  let currentUserProfile: {
    id: string;
    college: string | null;
    branch: string | null;
    profile_skills: {
      skills: {
        name: string;
        category: string | null;
      } | null;
    }[];
  } | null = null;
  if (sessionUser) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id, college, branch, profile_skills(skills(name, category))")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (currentProfile) {
      type ProfileSkillType = {
        skills: {
          name: string;
          category: string | null;
        }[] | {
          name: string;
          category: string | null;
        } | null;
      };
      currentUserProfile = {
        id: currentProfile.id,
        college: currentProfile.college,
        branch: currentProfile.branch,
        profile_skills: ((currentProfile.profile_skills as unknown as ProfileSkillType[]) ?? []).map((ps) => ({
          skills: Array.isArray(ps.skills) ? ps.skills[0] : ps.skills
        }))
      };
    }
  }

  // 1. Fetch all profiles with skills for filtering
  const { data: profilesData } = await supabase
    .from("profiles")
    .select(`
      id, username, full_name, college, branch, graduation_year, company, profession, role, bio, avatar_url,
      profile_skills(verified, skills(id, name, category)),
      services(id, is_active),
      startups(id),
      reviews:reviews!reviewee_id(overall)
    `)
    .order("created_at", { ascending: false });

  const profiles = (profilesData ?? []) as unknown as ProfileCardData[];

  // 2. Fetch distinct skills from skills table
  const { data: skillsData } = await supabase
    .from("skills")
    .select("name")
    .order("name", { ascending: true });
  
  const allSkills = Array.from(new Set((skillsData ?? []).map((s) => s.name)));

  // 3. Compute distinct colleges and graduation years from the database profiles list
  const allColleges = Array.from(
    new Set(profiles.map((p) => p.college).filter(Boolean) as string[])
  ).sort();

  const allGradYears = Array.from(
    new Set(
      profiles.map((p) => p.graduation_year?.toString()).filter(Boolean) as string[]
    )
  ).sort();

  // 4. Apply Filters
  const query = (q ?? "").trim().toLowerCase();
  
  const filteredProfiles = profiles.filter((p) => {
    // A. Query Filter (name, college, branch, company, profession, bio, skill names)
    if (query) {
      const haystack = [
        p.full_name,
        p.college ?? "",
        p.branch ?? "",
        p.company ?? "",
        p.profession ?? "",
        p.bio ?? "",
        ...p.profile_skills.map((ps) => ps.skills?.name ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      
      if (!haystack.includes(query)) return false;
    }

    // B. Skill Filter
    if (skill) {
      const hasSkill = p.profile_skills.some(
        (ps) => ps.skills?.name.toLowerCase() === skill.toLowerCase()
      );
      if (!hasSkill) return false;
    }

    // C. College Filter
    if (college) {
      if (p.college?.toLowerCase() !== college.toLowerCase()) return false;
    }

    // D. Role Filter
    if (role) {
      if (p.role !== role) return false;
    }

    // E. Graduation Year Filter
    if (grad_year) {
      if (p.graduation_year?.toString() !== grad_year) return false;
    }

    return true;
  });

  // 5. Sort by relevance if user is authenticated
  if (currentUserProfile) {
    const { getProfileRelevanceScore } = await import("@/lib/recommendations");
    filteredProfiles.sort((a, b) => {
      const scoreA = getProfileRelevanceScore(currentUserProfile, a);
      const scoreB = getProfileRelevanceScore(currentUserProfile, b);
      return scoreB - scoreA;
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      {/* Header Section */}
      <header className="mb-12 flex flex-col gap-4 text-center md:text-left items-center md:items-start">
        <h1 className="font-heading text-display-2 text-ink tracking-tight font-extrabold">
          Find talent
        </h1>
        <p className="text-body-lg text-muted max-w-xl">
          Search students by name, skill, or college.
        </p>
        
        {/* Search & Filters block */}
        <div className="w-full mt-4">
          <SearchFilters
            skills={allSkills}
            colleges={allColleges}
            gradYears={allGradYears}
          />
        </div>
      </header>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-sm font-bold text-ink">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? "student" : "students"} found
          </h2>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface rounded-[28px] border border-border/40 p-8 shadow-card">
            <p className="font-sans text-base text-muted mb-4">
              No students found matching your criteria.
            </p>
            <p className="text-xs text-muted/80 max-w-xs">
              Try adjusting your query or resetting the filters using the clear button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
