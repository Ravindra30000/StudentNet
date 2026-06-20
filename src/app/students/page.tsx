import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard, { ProfileCardData } from "@/components/discover/profile-card";
import SearchFilters from "@/components/discover/search-filters";
import ServiceCard from "@/components/services/service-card";
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
    mode?: "talent" | "services";
    category?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { q, skill, college, role, grad_year, mode = "talent", category } = await searchParams;

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
      services(id, is_active, price_inr),
      startups(id),
      reviews:reviews!reviewee_id(overall)
    `)
    .order("created_at", { ascending: false });

  const profiles = ((profilesData as unknown as ProfileCardData[]) ?? []).map((p) => {
    const activeServices = (p.services ?? []).filter((s) => s.is_active);
    const min_service_price = activeServices.length > 0
      ? Math.min(...activeServices.map((s) => s.price_inr ?? 0))
      : null;
    return {
      ...p,
      min_service_price
    };
  });

  interface MappedService {
    id: string;
    title: string;
    description: string | null;
    category: string;
    price_inr: number;
    delivery_days: number;
    owner: {
      username: string;
      full_name: string;
      avatar_url: string | null;
      college: string | null;
      avg_rating: number | null;
      review_count: number;
    };
  }

  interface RawServiceOwner {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    college: string | null;
    reviews: { overall: number }[] | null;
  }

  interface RawService {
    id: string;
    title: string;
    description: string | null;
    category: string;
    price_inr: number;
    delivery_days: number;
    owner: RawServiceOwner | null;
  }

  // Fetch active services if mode is services
  let services: MappedService[] = [];
  if (mode === "services") {
    let queryBuilder = supabase
      .from("services")
      .select(`
        id,
        title,
        description,
        category,
        price_inr,
        delivery_days,
        created_at,
        is_active,
        owner:profiles!owner_id (
          id,
          username,
          full_name,
          avatar_url,
          college,
          reviews:reviews!reviewee_id(overall)
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (q) {
      queryBuilder = queryBuilder.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
    }

    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }

    const { data: rawServices } = await queryBuilder;
    services = ((rawServices as unknown as RawService[]) ?? []).map((s) => {
      const ratings = (s.owner?.reviews ?? []).map((r) => Number(r.overall));
      const avg_rating = ratings.length > 0
        ? ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length
        : null;
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        price_inr: s.price_inr,
        delivery_days: s.delivery_days,
        owner: {
          id: s.owner?.id ?? "",
          username: s.owner?.username ?? "",
          full_name: s.owner?.full_name ?? "",
          avatar_url: s.owner?.avatar_url ?? null,
          college: s.owner?.college ?? null,
          avg_rating,
          review_count: ratings.length,
        }
      };
    });
  }

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
          {mode === "services" ? "Find services" : "Find talent"}
        </h1>
        <p className="text-body-lg text-muted max-w-xl">
          {mode === "services"
            ? "Search student freelance services and gigs."
            : "Search students by name, skill, or college."}
        </p>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-surface-sunken rounded-full border border-border mt-2 w-fit">
          <Link
            href="/students?mode=talent"
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              mode !== "services"
                ? "bg-ink text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Talent
          </Link>
          <Link
            href="/students?mode=services"
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === "services"
                ? "bg-ink text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Services
          </Link>
        </div>
        
        {/* Search & Filters block */}
        <div className="w-full mt-4">
          <SearchFilters
            skills={allSkills}
            colleges={allColleges}
            gradYears={allGradYears}
            mode={mode}
          />
        </div>
      </header>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-sm font-bold text-ink">
            {mode === "services"
              ? `${services.length} ${services.length === 1 ? "service" : "services"} found`
              : `${filteredProfiles.length} ${filteredProfiles.length === 1 ? "student" : "students"} found`
            }
          </h2>
        </div>

        {mode === "services" ? (
          services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface rounded-[28px] border border-border/40 p-8 shadow-card">
              <p className="font-sans text-base text-muted mb-4">
                No services found matching your criteria.
              </p>
              <p className="text-xs text-muted/80 max-w-xs">
                Try adjusting your query or resetting the filters using the clear button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} currentUserId={sessionUser?.id} />
              ))}
            </div>
          )
        ) : (
          filteredProfiles.length === 0 ? (
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
          )
        )}
      </div>
    </div>
  );
}
