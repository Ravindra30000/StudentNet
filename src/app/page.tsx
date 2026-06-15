import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProfileCard, { ProfileCardData } from "@/components/discover/profile-card";
import ProjectCard from "@/components/profile/project-card";
import Footer from "@/components/layout/footer";
import { ArrowRight } from "lucide-react";

interface ProjectResponse {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  cover_image_url: string | null;
  project_images?: string[] | null;
  video_url?: string | null;
  demo_url: string | null;
  github_url: string | null;
}

export default async function Home() {
  const supabase = await createClient();

  // Fetch featured builders (role = 'student')
  const { data: dbProfiles } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      college,
      branch,
      graduation_year,
      company,
      profession,
      role,
      bio,
      profile_skills (
        verified,
        skills (
          id,
          name,
          category
        )
      )
    `)
    .eq("role", "student")
    .limit(4);

  const featuredBuilders = (dbProfiles ?? []) as unknown as ProfileCardData[];

  // Fetch featured projects
  const { data: dbProjects } = await supabase
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
      github_url
    `)
    .limit(3);

  const featuredProjects = ((dbProjects as unknown as ProjectResponse[]) || []).map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    techStack: project.tech_stack,
    coverImageUrl: project.cover_image_url,
    projectImages: project.project_images,
    videoUrl: project.video_url,
    demoUrl: project.demo_url,
    githubUrl: project.github_url,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28 items-center">
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-ink sm:text-6xl md:text-7xl leading-[1.05]">
            Where students build careers before graduation.
          </h1>
          <p className="text-lg text-muted max-w-xl leading-relaxed">
            The elite network for India&apos;s next generation of builders. Showcase your projects,
            connect with startups, and launch your career.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <Link
              href="/signup"
              className="rounded-full bg-ink px-8 py-4 text-sm font-medium text-white hover:opacity-90 transition-all duration-200"
            >
              Create your profile
            </Link>
            <Link
              href="/students"
              className="rounded-full border border-border bg-transparent px-8 py-4 text-sm font-medium text-ink hover:bg-white transition-all duration-200"
            >
              Browse talent
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="bg-[#FDFBF7] p-6 rounded-[28px] shadow-card border border-border/30">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px]">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpFmiBQUPIPCbZ3UkVS3V3jxhFPXH5Yh6P6iXBAcECpenYzd6LSzOIj5Qa22HUY3RlO4X1oFf8x4ZE6J1a1I-lni22FNpzdUq6wOXjvdtkEs-heytybfogNExcthfRO4olN1NuSIsmd40i7ybr_P1X81RX3Ce4zxYUa_wM8UXv3lJAwRCWVwemYU9qcbZge9lBczAlFDJq-c1df8GIwdWEAFsLSgfYuERd0xkO9MITLVDP1XNvPQjgofCPUmlku4WEIwWKZza9y3E"
                alt="Young Indian students collaborating in a modern campus setting"
                fill
                priority
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Builders Section */}
      <section className="mx-auto w-full max-w-6xl px-6 mb-20">
        <div className="flex justify-between items-end mb-8">
          <h2 className="font-heading text-2xl font-bold text-ink">
            Featured builders
          </h2>
          <Link
            href="/students"
            className="text-sm font-medium text-accent-green hover:underline flex items-center gap-1 transition-all"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBuilders.map((builder) => (
            <ProfileCard key={builder.username} profile={builder} />
          ))}
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 mb-24">
          <div className="flex justify-between items-end mb-8">
            <h2 className="font-heading text-2xl font-bold text-ink">
              Featured projects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
