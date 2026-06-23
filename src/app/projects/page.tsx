import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProjectCard from "@/components/profile/project-card";
import { getProjectRelevanceScore, RecommendationBaseProfile } from "@/lib/recommendations";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Projects — StudentNet",
  description: "Browse and discover innovative products and case studies created by students.",
};

interface ProjectsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { q } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch current logged-in user profile for recommendation matching
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  let currentUserProfile: RecommendationBaseProfile | null = null;

  if (sessionUser) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select(`
        id,
        college,
        branch,
        profile_skills (
          skills (
            name
          )
        )
      `)
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (userProfile) {
      const skills = (((userProfile.profile_skills as unknown as {
        skills: { name: string } | { name: string }[] | null;
      }[]) || [])).map((ps) => {
        const s = Array.isArray(ps.skills) ? ps.skills[0] : ps.skills;
        return s?.name || "";
      }).filter(Boolean);

      currentUserProfile = {
        id: userProfile.id,
        college: userProfile.college,
        branch: userProfile.branch,
        profile_skills: skills.map(skill => ({
          skills: { name: skill }
        }))
      };
    }
  }

  // 2. Fetch projects
  const queryBuilder = supabase
    .from("projects")
    .select(`
      id,
      title,
      description,
      tech_stack,
      cover_image_url,
      project_images,
      video_url,
      demo_url,
      github_url,
      owner_id,
      owner:profiles!owner_id (
        username,
        full_name,
        avatar_url,
        college,
        branch
      )
    `);

  const { data: dbProjects } = await queryBuilder;

  interface RawProject {
    id: string;
    title: string;
    description: string | null;
    tech_stack: string[] | null;
    cover_image_url: string | null;
    project_images: string[] | null;
    video_url: string | null;
    demo_url: string | null;
    github_url: string | null;
    owner_id: string;
    owner: {
      username: string;
      full_name: string;
      avatar_url: string | null;
      college: string | null;
      branch: string | null;
    } | null;
  }

  // 3. Map, filter, and score projects
  const searchQuery = q?.toLowerCase().trim() || "";
  let mappedProjects = ((dbProjects as unknown as RawProject[]) || []).map((project) => {
    const techStack = project.tech_stack || [];
    const ownerData = project.owner ? {
      username: project.owner.username,
      full_name: project.owner.full_name,
      avatar_url: project.owner.avatar_url,
      college: project.owner.college,
    } : null;

    const projectForRelevance = {
      id: project.id,
      owner_id: project.owner_id,
      tech_stack: techStack,
      owner: project.owner ? {
        branch: project.owner.branch,
        college: project.owner.college
      } : null
    };

    const score = getProjectRelevanceScore(currentUserProfile, projectForRelevance);

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      techStack,
      coverImageUrl: project.cover_image_url,
      projectImages: project.project_images,
      videoUrl: project.video_url,
      demoUrl: project.demo_url,
      githubUrl: project.github_url,
      score,
      owner: ownerData,
    };
  });

  // Filter based on search query
  if (searchQuery) {
    mappedProjects = mappedProjects.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(searchQuery);
      const matchDesc = p.description?.toLowerCase().includes(searchQuery) || false;
      const matchTech = p.techStack.some((tech) => tech.toLowerCase().includes(searchQuery));
      const matchOwner = p.owner?.full_name.toLowerCase().includes(searchQuery) || false;
      return matchTitle || matchDesc || matchTech || matchOwner;
    });
  }

  // Sort: Recommended first (if logged in, score > 0), then alphabetical / fallback
  mappedProjects.sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-surface-sunken pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-heading text-4xl font-extrabold text-ink tracking-tight flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-accent-gold fill-accent-gold" />
                  Explore Projects
                </h1>
                <p className="text-muted mt-2 text-base">
                  Discover amazing projects, case studies, and startups built by top student talent.
                </p>
              </div>

              {/* Search Bar */}
              <form method="GET" className="relative w-full max-w-sm shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4.5 h-4.5" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q || ""}
                  placeholder="Search projects or skills..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-border bg-surface font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all shadow-sm"
                />
              </form>
            </div>
          </div>

          {/* Results Grid */}
          {mappedProjects.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border/40 p-16 text-center">
              <p className="text-muted font-sans text-base">
                No projects matched your search criteria. Try a different search query!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mappedProjects.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
