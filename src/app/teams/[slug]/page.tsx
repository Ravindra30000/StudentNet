import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { splitLongTechTags } from "@/components/profile/project-card";
import {
  Users,
  Building,
  ExternalLink,
  Shield,
  ArrowLeft,
  Globe,
} from "lucide-react";
import type { TeamMember, Profile, Project } from "@/lib/types";

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

export const dynamic = "force-dynamic";

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch team
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) {
    notFound();
  }

  // Fetch members
  const { data: membersData } = await supabase
    .from("team_members")
    .select("*, profile:profiles(*)")
    .eq("team_id", team.id);

  const members = (membersData as unknown as (TeamMember & { profile: Profile })[]) || [];

  // Fetch team projects
  const { data: projectsData } = await supabase
    .from("projects")
    .select("*, owner:profiles(*)")
    .eq("team_id", team.id);

  const projects = (projectsData as unknown as (Project & { owner: Profile })[]) || [];

  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Back Link */}
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        {/* Team Profile Canvas */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left / Main Column: Bio and Projects */}
          <div className="lg:col-span-2 space-y-8">
            {/* Team Main Info */}
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent-green text-surface font-heading text-3xl font-bold">
                  {team.avatar_url ? (
                    <Image
                      src={team.avatar_url}
                      alt={team.name}
                      width={80}
                      height={80}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    team.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
                    {team.name}
                  </h1>
                  <p className="text-muted mt-1 text-sm">Collective / Agency Profile</p>
                </div>
              </div>

              {team.description ? (
                <div className="mt-8 border-t border-border/40 pt-6">
                  <h3 className="font-heading text-sm font-bold text-ink mb-2">About Team</h3>
                  <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
                    {team.description}
                  </p>
                </div>
              ) : (
                <p className="text-muted mt-8 border-t border-border/40 pt-6 text-sm italic">
                  No team description provided yet.
                </p>
              )}
            </div>

            {/* Team Projects Section */}
            <div>
              <h2 className="font-heading text-xl font-bold text-ink mb-6">Team Portfolio</h2>
              {projects.length === 0 ? (
                <div className="rounded-3xl bg-surface p-12 text-center text-muted shadow-sm">
                  <Building className="mx-auto h-8 w-8 opacity-40 mb-3" />
                  <p className="text-sm font-medium">No projects associated with this team yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                      <div>
                        {project.cover_image_url ? (
                          <div className="mb-4 h-40 w-full overflow-hidden rounded-2xl bg-surface-sunken">
                            <Image
                              src={project.cover_image_url}
                              alt={project.title}
                              width={400}
                              height={160}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="mb-4 flex h-40 w-full items-center justify-center rounded-2xl bg-accent-green/5 text-accent-green">
                            <Building className="h-10 w-10 opacity-30" />
                          </div>
                        )}
                        <h3 className="font-heading text-lg font-bold text-ink">{project.title}</h3>
                        {project.description && (
                          <p className="text-muted mt-2 line-clamp-2 text-xs leading-relaxed">
                            {project.description}
                          </p>
                        )}
                        {project.tech_stack && (() => {
                          const rawItems = project.tech_stack
                            .flatMap(item => item.split(/[,\/;]+/))
                            .map(item => item.trim())
                            .filter(item => item.length > 0 && item.toLowerCase() !== "null");
                          const items = Array.from(new Set(splitLongTechTags(rawItems)));
                          if (items.length === 0) return null;
                          return (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {items.map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[10px] font-medium text-ink border border-border/10"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                        <span className="text-[10px] text-muted">
                          By @{project.owner?.username}
                        </span>
                        <div className="flex gap-2">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-full hover:bg-surface-sunken text-muted hover:text-ink transition-colors"
                            >
                              <GithubIcon className="h-4 w-4" />
                            </a>
                          )}
                          {project.demo_url && (
                            <a
                              href={project.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-full hover:bg-surface-sunken text-muted hover:text-ink transition-colors"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Members Directory */}
          <div className="space-y-8">
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <Users className="h-5 w-5 text-accent-green" />
                <h3 className="font-heading text-lg font-bold text-ink">Active Members</h3>
              </div>

              <div className="mt-6 divide-y divide-border/30">
                {members.map((mem) => (
                  <Link
                    href={`/u/${mem.profile?.username}`}
                    key={mem.profile_id}
                    className="flex items-center justify-between py-4 group hover:opacity-85 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken font-bold text-ink text-sm">
                        {mem.profile?.avatar_url ? (
                          <Image
                            src={mem.profile.avatar_url}
                            alt={mem.profile.full_name}
                            width={40}
                            height={40}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          mem.profile?.full_name?.substring(0, 2).toUpperCase() || "TM"
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-ink group-hover:underline">
                            {mem.profile?.full_name}
                          </p>
                          {mem.role === "Lead" && (
                            <Shield className="h-3 w-3 text-accent-green" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted">{mem.role}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted group-hover:text-ink" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
