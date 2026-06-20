import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { splitLongTechTags } from "@/components/profile/project-card";
import {
  createTeam,
  addTeamMember,
  removeTeamMember,
  deleteTeam,
  toggleProjectTeamLink,
} from "./actions";
import { revalidatePath } from "next/cache";
import {
  Users,
  Plus,
  Trash2,
  FolderKanban,
  ExternalLink,
  Shield,
  PlusCircle,
  Building,
} from "lucide-react";
import type { TeamMember, Profile, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch team created by the current user
  const { data: team } = await supabase
    .from("teams")
    .select("*, team_members(*)")
    .eq("created_by", user.id)
    .maybeSingle();

  // If team exists, fetch member profiles and projects linked or linkable
  let members: (TeamMember & { profile: Profile | null })[] = [];
  let linkableProjects: Project[] = [];

  if (team) {
    const { data: membersData } = await supabase
      .from("team_members")
      .select("*, profile:profiles(*)")
      .eq("team_id", team.id);
    
    members = (membersData as unknown as (TeamMember & { profile: Profile | null })[]) || [];

    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("owner_id", user.id);

    linkableProjects = (projectsData as unknown as Project[]) || [];
  }

  // Inline action for removing a member
  async function handleRemoveMemberInline(formData: FormData) {
    "use server";
    const profileId = String(formData.get("profile_id") ?? "");
    const teamId = String(formData.get("team_id") ?? "");
    await removeTeamMember(teamId, profileId);
    revalidatePath("/dashboard/team");
  }

  // Inline action for deleting team
  async function handleDeleteTeamInline(formData: FormData) {
    "use server";
    const teamId = String(formData.get("team_id") ?? "");
    await deleteTeam(teamId);
    revalidatePath("/dashboard/team");
  }

  // Inline action for project link toggle
  async function handleToggleProjectInline(formData: FormData) {
    "use server";
    const projectId = String(formData.get("project_id") ?? "");
    const teamId = formData.get("team_id") ? String(formData.get("team_id")) : null;
    await toggleProjectTeamLink(projectId, teamId);
    revalidatePath("/dashboard/team");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-20">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-8">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-ink">
            Team & Agency Manager
          </h1>
          <p className="text-muted mt-2 text-sm">
            Form a student collective, present works as an agency, and link projects.
          </p>
        </div>
        {team && (
          <form action={handleDeleteTeamInline} className="flex">
            <input type="hidden" name="team_id" value={team.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-danger/40 px-4 py-2 text-xs font-medium text-danger hover:bg-danger/5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Team
            </button>
          </form>
        )}
      </div>

      {/* Alert Feed */}
      {error && (
        <div className="mt-6 rounded-2xl bg-danger/10 p-4 text-sm font-medium text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 rounded-2xl bg-success/10 p-4 text-sm font-medium text-success">
          {success}
        </div>
      )}

      {!team ? (
        /* State A: Create Team Form */
        <div className="mt-12 max-w-2xl rounded-3xl bg-surface p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10 text-accent-green">
            <Building className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-ink">Launch Your Team</h2>
          <p className="text-muted mt-1 text-sm">
            Create an agency profile to present group portfolio items and work together.
          </p>

          <form action={createTeam} className="mt-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink">
                Team / Agency Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g., PixelForge Studio"
                className="mt-2 block w-full rounded-full border border-border px-4 py-3 text-sm focus:border-ink focus:outline-none bg-surface-sunken"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ink">
                Description & Vision
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="What does your team focus on? What stack do you use?"
                className="mt-2 block w-full rounded-2xl border border-border px-4 py-3 text-sm focus:border-ink focus:outline-none bg-surface-sunken resize-none"
              />
            </div>

            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium text-ink">
                Logo / Avatar URL (Optional)
              </label>
              <input
                type="url"
                id="avatar_url"
                name="avatar_url"
                placeholder="e.g., https://example.com/logo.png"
                className="mt-2 block w-full rounded-full border border-border px-4 py-3 text-sm focus:border-ink focus:outline-none bg-surface-sunken"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-surface hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Create Team Profile
            </button>
          </form>
        </div>
      ) : (
        /* State B: Team Dashboard Console */
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left / Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Team Info Card */}
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-green text-surface font-heading text-2xl font-bold">
                  {team.avatar_url ? (
                    <Image src={team.avatar_url} alt={team.name} width={64} height={64} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    team.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-ink">{team.name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-accent-green/10 px-2.5 py-0.5 text-xs font-semibold text-accent-green">
                      Active Team
                    </span>
                    <Link
                      href={`/teams/${team.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View public profile
                    </Link>
                  </div>
                </div>
              </div>
              {team.description && <p className="text-muted mt-6 text-sm leading-relaxed">{team.description}</p>}
            </div>

            {/* Link Projects Card */}
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <FolderKanban className="h-5 w-5 text-accent-green" />
                <h3 className="font-heading text-lg font-bold text-ink">Associate Portfolio Projects</h3>
              </div>
              <p className="text-muted mt-2 text-xs">
                Select which of your portfolio projects were built by this team/agency. They will show up on the team profile.
              </p>

              {linkableProjects.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-surface-sunken p-6 text-center text-sm text-muted">
                  No projects found. Add one in the{" "}
                  <Link href="/dashboard/portfolio" className="text-accent-green underline">
                    Portfolio
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <div className="mt-6 divide-y divide-border/30">
                  {linkableProjects.map((proj) => {
                    const isLinked = proj.team_id === team.id;
                    return (
                      <div key={proj.id} className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-sm font-semibold text-ink">{proj.title}</p>
                          {proj.tech_stack && (() => {
                            const rawItems = proj.tech_stack
                              .flatMap(item => item.split(/[,\/;]+/))
                              .map(item => item.trim())
                              .filter(item => item.length > 0 && item.toLowerCase() !== "null");
                            const items = Array.from(new Set(splitLongTechTags(rawItems)));
                            if (items.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {items.map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded-full bg-surface-sunken px-2 py-0.5 text-[9px] font-medium text-ink border border-border/10"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        <form action={handleToggleProjectInline}>
                          <input type="hidden" name="project_id" value={proj.id} />
                          <input type="hidden" name="team_id" value={isLinked ? "" : team.id} />
                          <button
                            type="submit"
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                              isLinked
                                ? "bg-accent-green text-surface"
                                : "border border-border text-ink hover:bg-surface-sunken"
                            }`}
                          >
                            {isLinked ? "Linked" : "Link"}
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column / Member Management */}
          <div className="space-y-8">
            {/* Add Members Card */}
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <Users className="h-5 w-5 text-accent-green" />
                <h3 className="font-heading text-lg font-bold text-ink">Add Team Member</h3>
              </div>

              <form action={addTeamMember} className="mt-6 space-y-4">
                <input type="hidden" name="team_id" value={team.id} />
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-ink">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    placeholder="e.g., aditi_sharma"
                    className="mt-2 block w-full rounded-full border border-border px-4 py-2 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-xs font-semibold text-ink">
                    Role in Team
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    required
                    placeholder="e.g., Lead Developer"
                    className="mt-2 block w-full rounded-full border border-border px-4 py-2 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-surface hover:opacity-90 transition-opacity"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add Member
                </button>
              </form>
            </div>

            {/* Active Members List */}
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-ink border-b border-border/40 pb-4">
                Members ({members.length})
              </h3>
              <div className="mt-6 divide-y divide-border/30">
                {members.map((mem) => (
                  <div key={mem.profile_id} className="flex items-center justify-between py-4">
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
                          <p className="text-xs font-bold text-ink">{mem.profile?.full_name}</p>
                          {mem.role === "Lead" && <Shield className="h-3 w-3 text-accent-green" />}
                        </div>
                        <p className="text-[10px] text-muted">{mem.role}</p>
                      </div>
                    </div>

                    {mem.profile_id !== user.id && (
                      <form action={handleRemoveMemberInline}>
                        <input type="hidden" name="team_id" value={team.id} />
                        <input type="hidden" name="profile_id" value={mem.profile_id} />
                        <button
                          type="submit"
                          className="p-1.5 rounded-full hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
