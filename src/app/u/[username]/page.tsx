import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Project, Skill } from "@/lib/types";
import ProjectCard from "@/components/profile/project-card";
import ServiceCard, { ServiceCardProps } from "@/components/services/service-card";
import { startConversation } from "@/app/dashboard/messages/actions";
import { Star } from "lucide-react";


const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  founder: "Startup Founder",
  community_leader: "Community Leader",
  client: "Client",
};



export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showMessageButton = !user || user.id !== profile.id;

  const handleMessageAction = async () => {
    "use server";
    await startConversation(profile.id);
  };

  const [{ data: skillLinks }, { data: projects }, { data: services }, { data: profileReviews }] = await Promise.all([
    supabase
      .from("profile_skills")
      .select("skills(id, name, category)")
      .eq("profile_id", profile.id),
    supabase
      .from("projects")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("*")
      .eq("owner_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select(`
        id,
        overall,
        comment,
        created_at,
        reviewer:profiles!reviewer_id (
          full_name,
          avatar_url,
          username
        )
      `)
      .eq("reviewee_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const ratings = profileReviews?.map((r) => Number(r.overall)) || [];
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, val) => sum + val, 0) / ratings.length).toFixed(1)
    : null;

  const skills: Skill[] = (skillLinks ?? [])
    .map((row) => row.skills as unknown as Skill)
    .filter(Boolean);

  const serviceOwnerData = {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    college: profile.college,
    avg_rating: avgRating ? Number(avgRating) : null,
    review_count: ratings.length,
  };

  const servicesWithOwner = (services ?? []).map((s) => ({
    ...s,
    owner: serviceOwnerData,
  }));



  const charSum = profile.full_name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-600",
    "from-sky-400 to-blue-600",
    "from-violet-400 to-purple-600",
  ];
  const gradient = gradients[charSum % gradients.length];
  const initials = profile.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-20">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar Container */}
          <div className="relative w-28 h-28 shrink-0">
            {profile.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.avatar_url}
                alt={`${profile.full_name} profile picture`}
                className="w-full h-full rounded-full object-cover border border-border/40 shadow-sm"
              />
            ) : (
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-heading font-extrabold text-3xl shadow-sm`}>
                {initials}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-accent-green uppercase tracking-wider">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">
              {profile.full_name}
            </h1>
            <p className="mt-2 text-base text-muted">
              {profile.profession && profile.company
                ? `${profile.profession} at ${profile.company}`
                : profile.profession || profile.company
                ? profile.profession || profile.company
                : [profile.branch, profile.college].filter(Boolean).join(" · ")}
              {!profile.company && !profile.profession && profile.graduation_year
                ? ` · Class of ${profile.graduation_year}`
                : ""}
            </p>
            {avgRating !== null && (
              <div className="flex items-center gap-1.5 mt-3 bg-accent-gold/5 border border-accent-gold/20 rounded-full px-3 py-1 w-fit text-accent-gold font-semibold text-xs shadow-sm">
                <Star className="w-3.5 h-3.5 fill-accent-gold" />
                <span className="font-heading text-ink">{avgRating}</span>
                <span className="text-[10px] text-muted">({ratings.length} {ratings.length === 1 ? "review" : "reviews"})</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 mt-4 md:mt-0">
          {showMessageButton && (
            <form action={handleMessageAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-green transition-all duration-200 shadow-sm cursor-pointer"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Message</span>
              </button>
            </form>
          )}
          {profile.github_url && (
            <SocialLink href={profile.github_url} label="GitHub" />
          )}
          {profile.linkedin_url && (
            <SocialLink href={profile.linkedin_url} label="LinkedIn" />
          )}
          {profile.portfolio_url && (
            <SocialLink href={profile.portfolio_url} label="Website" />
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-muted">
          {profile.bio}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-medium text-muted">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Freelance Services */}
      {servicesWithOwner && servicesWithOwner.length > 0 && (
        <div className="mt-16">
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-heading text-xl font-bold text-ink">Freelance Offerings</h2>
            <Link
              href={`/services?seller=${profile.username}`}
              className="text-xs font-semibold text-accent-green hover:underline"
            >
              View all offerings
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {servicesWithOwner.map((service: ServiceCardProps["service"]) => (
              <ServiceCard key={service.id} service={service} currentUserId={user?.id} />
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <div className="mt-16">
        <h2 className="text-sm font-medium text-muted">Projects</h2>
        {projects && projects.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {projects.map((project: Project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description}
                techStack={project.tech_stack}
                coverImageUrl={project.cover_image_url}
                projectImages={project.project_images}
                videoUrl={project.video_url}
                demoUrl={project.demo_url}
                githubUrl={project.github_url}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted">No projects yet.</p>
        )}
      </div>

      {/* Reviews Section */}
      {profileReviews && profileReviews.length > 0 && (
        <div className="mt-16 border-t border-border/40 pt-12">
          <div className="flex items-center gap-2 mb-8">
            <h2 className="font-heading text-xl font-bold text-ink">Client Reviews</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-sunken border border-border text-muted">
              {profileReviews.length}
            </span>
          </div>

          <div className="space-y-6">
            {profileReviews.map((rev) => {
              const dateStr = new Date(rev.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });

              const reviewer = (Array.isArray(rev.reviewer) ? rev.reviewer[0] : rev.reviewer) as {
                full_name: string;
                avatar_url: string | null;
                username: string;
              } | null;

              return (
                <div key={rev.id} className="bg-surface p-6 rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      {reviewer?.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={reviewer.avatar_url}
                          alt={reviewer.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-border/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center border border-border/50">
                          <span className="text-xs font-bold text-muted">
                            {reviewer?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-ink">{reviewer?.full_name}</h4>
                        <p className="text-[10px] text-muted">
                          @{reviewer?.username} • {dateStr}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-accent-gold/10 px-2 py-1 rounded-full text-accent-gold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold">{Number(rev.overall).toFixed(1)}</span>
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-sm text-muted mt-3 italic leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  const Icon = label === "GitHub" 
    ? GithubIcon 
    : label === "LinkedIn" 
    ? LinkedinIcon 
    : GlobeIcon;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition-all hover:bg-surface-sunken text-ink bg-surface shadow-sm"
    >
      <Icon className="h-4 w-4 text-muted" />
      <span>{label}</span>
    </Link>
  );
}


