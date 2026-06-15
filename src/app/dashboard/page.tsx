import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { updateProfile } from "./actions";
import AvatarUploadField from "@/components/profile/avatar-upload-field";
import ProjectCard from "@/components/profile/project-card";
import DeleteProjectForm from "@/components/profile/delete-project-form";
import SkillsField from "@/components/profile/skills-field";
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Briefcase,
  Users2,
  Compass,
  Rocket,
  CheckCircle2,
  Circle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; tab?: string }>;
}) {
  const { error, saved, tab = "overview" } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  // Fetch parallel stats for projects, skills, gigs, and communities, plus recommendations candidates
  const [
    { data: skills },
    { data: mySkillLinks },
    { data: projects },
    { count: servicesCount },
    { count: communitiesCount },
    { data: recProfilesData },
    { data: recStartupsData }
  ] = await Promise.all([
    supabase.from("skills").select("id, name, category").order("category").order("name"),
    supabase.from("profile_skills").select("skill_id, skills(name, category)").eq("profile_id", user.id),
    supabase
      .from("projects")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", user.id),
    supabase
      .from("profiles")
      .select("id, username, full_name, college, branch, bio, avatar_url, role, profile_skills(skills(name, category))")
      .neq("id", user.id)
      .limit(50),
    supabase
      .from("startups")
      .select("*, founder:profiles!founder_id(full_name, avatar_url, college), startup_roles(*)")
      .neq("founder_id", user.id)
      .limit(50),
  ]);

  interface RecommendedStudent {
    id: string;
    username: string;
    full_name: string;
    college?: string | null;
    branch?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    role: string;
    profile_skills: {
      skills: {
        name: string;
        category?: string | null;
      } | null;
    }[];
    relevanceScore: number;
  }

  interface RecommendedStartup {
    id: string;
    slug: string;
    founder_id: string;
    name: string;
    idea: string;
    industry: string;
    stage: string;
    logo_url?: string | null;
    created_at: string;
    updated_at: string;
    relevanceScore: number;
    startup_roles: {
      skills_required: string[];
    }[];
  }

  type SkillLinkType = { skill_id: number; skills: { name: string; category: string | null } | null };

  const mySkillIds = new Set<number>(
    ((mySkillLinks as SkillLinkType[] | null) ?? []).map((row) => row.skill_id)
  );

  // Construct currentUserProfile object for recommendations scoring
  const currentUserProfile = {
    id: profile.id,
    college: profile.college,
    branch: profile.branch,
    profile_skills: ((mySkillLinks as SkillLinkType[] | null) ?? []).map((link) => ({
      skills: link.skills
    }))
  };

  let recommendedStudents: RecommendedStudent[] = [];
  let recommendedStartups: RecommendedStartup[] = [];

  if (recProfilesData) {
    const { getProfileRelevanceScore } = await import("@/lib/recommendations");
    const profilesPool = recProfilesData as unknown as RecommendedStudent[];
    recommendedStudents = [...profilesPool]
      .map((p) => ({
        ...p,
        relevanceScore: getProfileRelevanceScore(currentUserProfile, p)
      }))
      .filter((p) => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    // Fallback to latest profiles if not enough matches
    if (recommendedStudents.length < 3) {
      const existingIds = new Set(recommendedStudents.map(p => p.id));
      const fallback = profilesPool
        .filter((p) => !existingIds.has(p.id))
        .slice(0, 3 - recommendedStudents.length);
      recommendedStudents = [...recommendedStudents, ...fallback];
    }
  }

  if (recStartupsData) {
    const { getStartupRelevanceScore } = await import("@/lib/recommendations");
    const startupsPool = recStartupsData as unknown as RecommendedStartup[];
    recommendedStartups = [...startupsPool]
      .map((s) => ({
        ...s,
        relevanceScore: getStartupRelevanceScore(currentUserProfile, s)
      }))
      .filter((s) => s.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    // Fallback to latest startups if not enough matches
    if (recommendedStartups.length < 3) {
      const existingIds = new Set(recommendedStartups.map(s => s.id));
      const fallback = startupsPool
        .filter((s) => !existingIds.has(s.id))
        .slice(0, 3 - recommendedStartups.length);
      recommendedStartups = [...recommendedStartups, ...fallback];
    }
  }

  // Profile completeness calculation (points sum to 100)
  let completenessScore = 0;
  const checklistItems = [
    {
      id: "avatar",
      label: "Upload profile picture",
      completed: !!profile.avatar_url,
      points: 15,
      link: "?tab=edit",
    },
    {
      id: "bio",
      label: "Write a short bio",
      completed: !!profile.bio && profile.bio.trim().length > 0,
      points: 20,
      link: "?tab=edit#bio",
    },
    {
      id: "skills",
      label: "Add 3 or more skills",
      completed: mySkillIds.size >= 3,
      points: 20,
      link: "?tab=edit",
    },
    {
      id: "education",
      label: "Set college & branch",
      completed: !!profile.college && !!profile.branch,
      points: 15,
      link: "?tab=edit",
    },
    {
      id: "socials",
      label: "Link social profile",
      completed: !!profile.github_url || !!profile.linkedin_url || !!profile.portfolio_url,
      points: 15,
      link: "?tab=edit",
    },
    {
      id: "projects",
      label: "Showcase a project",
      completed: (projects ?? []).length >= 1,
      points: 15,
      link: "?tab=edit",
    },
  ];

  checklistItems.forEach((item) => {
    if (item.completed) {
      completenessScore += item.points;
    }
  });



  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-20">
      {/* Welcome Banner */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-accent-green/5 via-canvas to-surface border border-border/30 rounded-3xl p-6 md:p-8 shadow-sm">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
            Hey, {profile.full_name.split(" ")[0]}!
          </h1>
          <p className="text-muted mt-2 text-sm max-w-xl">
            Welcome to your Builder Hub. Showcase your work, coordinate with startups, and launch your freelance services.
          </p>
        </div>
        <Link
          href={`/u/${profile.username}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-surface hover:opacity-90 transition-opacity"
        >
          View Public Profile
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-surface-secondary border border-border/40 rounded-full w-fit mb-10">
        <Link
          href="?tab=overview"
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
            tab === "overview"
              ? "bg-ink text-surface shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Overview
        </Link>
        <Link
          href="?tab=edit"
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
            tab === "edit"
              ? "bg-ink text-surface shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          Edit Profile
        </Link>
      </div>

      {/* Success Notification */}
      {saved && (
        <div className="mb-8 rounded-2xl bg-success/10 px-4 py-3.5 text-sm text-success font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-success fill-success/10" />
          Profile updated successfully.
        </div>
      )}

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface border border-border/40 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Projects</p>
                <h3 className="font-heading text-2xl font-extrabold text-ink mt-1.5">{projects?.length || 0}</h3>
              </div>
              <div className="bg-accent-green/5 text-accent-green p-3 rounded-2xl">
                <FolderGit2 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-surface border border-border/40 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Gigs Listed</p>
                <h3 className="font-heading text-2xl font-extrabold text-ink mt-1.5">{servicesCount || 0}</h3>
              </div>
              <div className="bg-accent-green/5 text-accent-green p-3 rounded-2xl">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-surface border border-border/40 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Circles Joined</p>
                <h3 className="font-heading text-2xl font-extrabold text-ink mt-1.5">{communitiesCount || 0}</h3>
              </div>
              <div className="bg-accent-green/5 text-accent-green p-3 rounded-2xl">
                <Users2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Completeness Tracker */}
          <div className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-border/40 pb-6 lg:pb-0 lg:pr-8">
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-border/20 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-accent-green fill-none transition-all duration-500"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - completenessScore / 100)}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="font-heading text-3xl font-extrabold text-ink">{completenessScore}%</span>
                </div>
              </div>
              <h4 className="font-heading text-sm font-bold text-ink mt-4">Profile Strength</h4>
              <p className="text-xs text-muted mt-1 max-w-[180px] leading-relaxed">
                {completenessScore === 100 
                  ? "Your profile is fully complete! Ready to stand out." 
                  : "Complete pending items to stand out to campus builders."}
              </p>
            </div>

            <div className="lg:col-span-8">
              <h4 className="font-heading text-sm font-bold text-ink mb-3.5">Completeness Checklist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {checklistItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-semibold transition-all hover:bg-surface-sunken/60 ${
                      item.completed
                        ? "border-accent-green/20 bg-accent-green/5 text-accent-green"
                        : "border-border/60 bg-surface-sunken/40 text-muted"
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-accent-green shrink-0 fill-accent-green/10" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-muted/60 shrink-0" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Grid */}
          <div>
            <h3 className="font-heading text-sm font-bold text-ink mb-4">Discover & Connect</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link
                href="/students"
                className="group bg-surface border border-border/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[176px]"
              >
                <div>
                  <div className="bg-ink/5 group-hover:bg-accent-green/5 text-ink group-hover:text-accent-green p-2.5 rounded-xl w-fit transition-colors">
                    <Compass className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-ink mt-4">Discover Talent</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Search and connect with students by college, branch, and role.
                  </p>
                </div>
                <div className="text-xs font-semibold text-accent-green flex items-center gap-1 mt-4">
                  Browse talent directory
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/startups"
                className="group bg-surface border border-border/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[176px]"
              >
                <div>
                  <div className="bg-ink/5 group-hover:bg-accent-green/5 text-ink group-hover:text-accent-green p-2.5 rounded-xl w-fit transition-colors">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-ink mt-4">Startup Board</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Explore student-led projects looking for co-founders and contributors.
                  </p>
                </div>
                <div className="text-xs font-semibold text-accent-green flex items-center gap-1 mt-4">
                  Explore opportunities
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/communities"
                className="group bg-surface border border-border/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[176px]"
              >
                <div>
                  <div className="bg-ink/5 group-hover:bg-accent-green/5 text-ink group-hover:text-accent-green p-2.5 rounded-xl w-fit transition-colors">
                    <Users2 className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-ink mt-4">Builder Circles</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Join university clubs, interest communities, and sign up for hackathons.
                  </p>
                </div>
                <div className="text-xs font-semibold text-accent-green flex items-center gap-1 mt-4">
                  Browse communities
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/dashboard/services"
                className="group bg-surface border border-border/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[176px]"
              >
                <div>
                  <div className="bg-ink/5 group-hover:bg-accent-green/5 text-ink group-hover:text-accent-green p-2.5 rounded-xl w-fit transition-colors">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-ink mt-4">Freelance Services</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Publish your technical services and manage direct freelance project contracts.
                  </p>
                </div>
                <div className="text-xs font-semibold text-accent-green flex items-center gap-1 mt-4">
                  Manage gig listings
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recommended for You Feed */}
          <div className="mt-12 pt-12 border-t border-border/40">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-xl font-bold text-ink">Recommended for You</h3>
                <p className="text-xs text-muted mt-1">
                  Domain-matched peers and opportunities tailored to your skills and branch.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Peers Feed */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Matched Peers</h4>
                <div className="flex flex-col gap-4">
                  {recommendedStudents.length > 0 ? (
                    recommendedStudents.map((peer) => {
                      const initials = peer.full_name.substring(0, 2).toUpperCase();
                      return (
                        <Link
                          key={peer.id}
                          href={`/u/${peer.username}`}
                          className="group flex items-start gap-4 p-5 bg-surface border border-border/40 rounded-2xl hover:shadow-md hover:border-accent-green/30 transition-all duration-200"
                        >
                          {peer.avatar_url ? (
                            <img
                              src={peer.avatar_url}
                              alt={peer.full_name}
                              className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-surface-sunken flex items-center justify-center font-bold text-sm border border-border text-ink shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-heading text-sm font-bold text-ink group-hover:text-accent-green transition-colors truncate">
                                {peer.full_name}
                              </h5>
                              {peer.relevanceScore > 0 && (
                                <span className="text-[10px] font-bold text-accent-green bg-accent-green/5 border border-accent-green/20 px-2 py-0.5 rounded-full shrink-0">
                                  Match
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted truncate mt-0.5">
                              {peer.branch || "General"} • {peer.college || "No College"}
                            </p>
                            {peer.bio && (
                              <p className="text-xs text-muted line-clamp-2 mt-2 leading-relaxed italic">
                                &ldquo;{peer.bio}&rdquo;
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted py-6 text-center bg-surface-sunken/40 border border-dashed border-border/60 rounded-2xl">
                      No matching students found
                    </div>
                  )}
                </div>
              </div>

              {/* Startup Opportunities Feed */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Startup Opportunities</h4>
                <div className="flex flex-col gap-4">
                  {recommendedStartups.length > 0 ? (
                    recommendedStartups.map((startup) => {
                      const initials = startup.name.substring(0, 2).toUpperCase();
                      const colors = [
                        "bg-red-50 text-red-700 border-red-100",
                        "bg-orange-50 text-orange-700 border-orange-100",
                        "bg-emerald-50 text-emerald-700 border-emerald-100",
                        "bg-teal-50 text-teal-700 border-teal-100",
                        "bg-cyan-50 text-cyan-700 border-cyan-100",
                        "bg-sky-50 text-sky-700 border-sky-100",
                      ];
                      const colorIndex = startup.name.length % colors.length;
                      const colorClass = colors[colorIndex];
                      return (
                        <Link
                          key={startup.id}
                          href={`/startups/${startup.slug}`}
                          className="group flex items-start gap-4 p-5 bg-surface border border-border/40 rounded-2xl hover:shadow-md hover:border-accent-green/30 transition-all duration-200"
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-heading text-xs font-extrabold border shrink-0 ${colorClass}`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-heading text-sm font-bold text-ink group-hover:text-accent-green transition-colors truncate">
                                {startup.name}
                              </h5>
                              {startup.relevanceScore > 0 && (
                                <span className="text-[10px] font-bold text-accent-green bg-accent-green/5 border border-accent-green/20 px-2 py-0.5 rounded-full shrink-0">
                                  Match
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted truncate mt-0.5">
                              Industry: <span className="font-medium text-ink">{startup.industry}</span> • {startup.stage} Stage
                            </p>
                            <p className="text-xs text-muted line-clamp-2 mt-2 leading-relaxed">
                              {startup.idea}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted py-6 text-center bg-surface-sunken/40 border border-dashed border-border/60 rounded-2xl">
                      No startup opportunities found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Projects Manager Tab */}
      {tab === "edit" && (
        <div className="mx-auto max-w-2xl bg-surface border border-border/40 rounded-[28px] p-6 md:p-8 shadow-card mt-2">
          <h2 className="text-2xl font-bold tracking-tight text-ink mb-8">Edit profile settings</h2>
          
          <form action={updateProfile} className="flex flex-col gap-8">
            <AvatarUploadField defaultValue={profile.avatar_url} />
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                name="full_name"
                defaultValue={profile.full_name}
                required
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-ink">Username</label>
                <input
                  disabled
                  value={profile.username}
                  className="cursor-not-allowed rounded-xl border border-border bg-surface-secondary px-4 py-3 text-base text-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-ink">I am a</label>
              <select
                name="role"
                defaultValue={profile.role}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent text-ink"
              >
                <option value="student">Student / Freelancer</option>
                <option value="founder">Startup Founder</option>
                <option value="community_leader">Community Leader</option>
                <option value="client">Client</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label="College" name="college" defaultValue={profile.college ?? ""} />
              <Field label="Branch" name="branch" defaultValue={profile.branch ?? ""} />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-ink">Graduation year</label>
                <select
                  name="graduation_year"
                  defaultValue={profile.graduation_year ?? ""}
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent text-ink"
                >
                  <option value="">Select</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="bio" className="text-sm font-medium text-ink">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={profile.bio ?? ""}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent text-ink"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label="GitHub" name="github_url" defaultValue={profile.github_url ?? ""} />
              <Field label="LinkedIn" name="linkedin_url" defaultValue={profile.linkedin_url ?? ""} />
              <Field label="Portfolio" name="portfolio_url" defaultValue={profile.portfolio_url ?? ""} />
            </div>

            <div className="flex flex-col gap-5">
              <label className="text-sm font-medium text-ink">Skills</label>
              <SkillsField
                skills={skills ?? []}
                initialSelectedSkillIds={Array.from(mySkillIds)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-fit rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:bg-accent-green hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 active:scale-98 cursor-pointer"
            >
              Save changes
            </button>
          </form>

          {/* Projects List */}
          <div className="mt-20 pt-10 border-t border-border/40">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Projects</h2>
              <Link
                href="/dashboard/projects/new"
                className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:text-accent-green hover:border-accent-green hover:-translate-y-0.5 active:translate-y-0 hover:shadow-sm transition-all duration-200"
              >
                Add project
              </Link>
            </div>

            {projects && projects.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {projects.map((project: Project) => (
                  <div
                    key={project.id}
                    className="flex flex-col bg-surface rounded-2xl overflow-hidden border border-border/40 shadow-sm"
                  >
                    <div className="flex-1">
                      <ProjectCard
                        title={project.title}
                        description={project.description}
                        techStack={project.tech_stack}
                        coverImageUrl={project.cover_image_url}
                        projectImages={project.project_images}
                        videoUrl={project.video_url}
                        demoUrl={project.demo_url}
                        githubUrl={project.github_url}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-surface-secondary border-t border-border/40 mt-auto">
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="text-xs font-bold uppercase tracking-wider text-muted hover:text-accent-green hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Edit
                      </Link>
                      <span className="text-border/40">|</span>
                      <DeleteProjectForm id={project.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted italic">No projects added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent text-ink"
      />
    </div>
  );
}

