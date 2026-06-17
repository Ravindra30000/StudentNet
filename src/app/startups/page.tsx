import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Rocket,
  ArrowRight,
  Building2,
} from "lucide-react";
import type { StartupRole } from "@/lib/types";
import StartupFilters from "@/components/startups/startup-filters";

export const dynamic = "force-dynamic";

export default async function StartupsBoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    industry?: string;
    stage?: string;
    commitment?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const industry = params.industry || "";
  const stage = params.stage || "";
  const commitment = params.commitment || "";
  const search = params.search || "";

  const supabase = await createClient();

  // Fetch current logged in user details if available for matching
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

  // Fetch startups with founder profile and roles
  const { data: startupsData } = await supabase
    .from("startups")
    .select(`
      *,
      founder:profiles!founder_id (full_name, avatar_url, college),
      startup_roles (*)
    `)
    .order("created_at", { ascending: false });

  let startups = startupsData || [];

  // Filter in memory for robust multi-filtering
  if (search) {
    const searchLower = search.toLowerCase();
    startups = startups.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.idea.toLowerCase().includes(searchLower) ||
        s.industry.toLowerCase().includes(searchLower)
    );
  }

  if (industry) {
    startups = startups.filter((s) =>
      s.industry.toLowerCase().includes(industry.toLowerCase())
    );
  }

  if (stage) {
    startups = startups.filter((s) => s.stage === stage);
  }

  if (commitment) {
    startups = startups.filter((s) =>
      (s.startup_roles as StartupRole[]).some((r) => r.commitment === commitment)
    );
  }

  // Get unique list of industries for filtering
  const allIndustries = Array.from(
    new Set((startupsData || []).map((s) => s.industry.trim()))
  ).filter(Boolean);

  // Sort startups by relevance score if user is logged in
  if (currentUserProfile && startups.length > 0) {
    const { getStartupRelevanceScore } = await import("@/lib/recommendations");
    startups.sort((a, b) => {
      const scoreA = getStartupRelevanceScore(currentUserProfile, a);
      const scoreB = getStartupRelevanceScore(currentUserProfile, b);
      return scoreB - scoreA;
    });
  }

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-6 pt-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-ink">
              Startups & co-founder opportunities
            </h1>
            <p className="text-muted text-lg mt-3">
              Find your next team, partner up on exciting ideas, or post your own startup.
            </p>
          </div>
          <Link
            href="/dashboard/startup"
            className="w-fit rounded-full bg-ink hover:bg-accent-green text-white font-semibold px-6 py-3.5 text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <Rocket size={16} /> + Post your startup
          </Link>
        </div>

        {/* Filter bar */}
        <StartupFilters industries={allIndustries} />

        {/* Startups Grid */}
        {startups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {startups.map((startup) => {
              // Create dynamic color avatar based on startup name
              const initials = startup.name.substring(0, 2).toUpperCase();
              const colors = [
                "bg-red-100 text-red-700",
                "bg-orange-100 text-orange-700",
                "bg-emerald-100 text-emerald-700",
                "bg-teal-100 text-teal-700",
                "bg-cyan-100 text-cyan-700",
                "bg-sky-100 text-sky-700",
                "bg-amber-100 text-amber-700",
              ];
              const colorIndex = startup.name.length % colors.length;
              const avatarClass = colors[colorIndex];

              return (
                <div
                  key={startup.id}
                  className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 shadow-card flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-heading text-lg font-extrabold ${avatarClass}`}>
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-heading text-xl font-bold text-ink">
                            {startup.name}
                          </h3>
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted mt-1 inline-block">
                            {startup.industry}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-surface-sunken border border-border/50 text-ink px-3 py-1 rounded-full uppercase">
                        {startup.stage} STAGE
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-muted text-sm mt-5 leading-relaxed line-clamp-3">
                      {startup.idea}
                    </p>

                    {/* Roles Needed */}
                    {startup.startup_roles && startup.startup_roles.length > 0 && (
                      <div className="mt-6">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted">Roles Needed</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(startup.startup_roles as StartupRole[]).map((role) => (
                            <span
                              key={role.id}
                              className="text-xs font-medium px-3 py-1 bg-surface-sunken border border-border/30 rounded-full text-ink"
                            >
                              {role.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Panel */}
                  <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {startup.founder?.avatar_url ? (
                        <Image
                          src={startup.founder.avatar_url}
                          alt={startup.founder.full_name}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center font-semibold text-xs border border-border">
                          {startup.founder?.full_name?.substring(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-ink">by {startup.founder?.full_name}</p>
                        <p className="text-[10px] text-muted">{startup.founder?.college}</p>
                      </div>
                    </div>

                    <Link
                      href={`/startups/${startup.slug}`}
                      className="text-sm font-semibold text-accent-green hover:text-ink flex items-center gap-1 transition-colors"
                    >
                      View & apply <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-surface border border-border/40 rounded-3xl mt-12 flex flex-col items-center">
            <Building2 className="text-muted mb-4" size={48} />
            <h3 className="font-heading text-xl font-bold text-ink">No opportunities found</h3>
            <p className="text-muted text-sm mt-2 max-w-sm">
              We couldn&apos;t find any startups matching your filters. Try resetting the filters or check back later!
            </p>
            <Link
              href="/startups"
              className="mt-6 rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-surface-sunken text-ink"
            >
              Reset Filters
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
