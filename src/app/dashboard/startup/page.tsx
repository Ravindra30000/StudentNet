import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  createStartup,
  updateStartup,
  addStartupRole,
} from "./actions";
import { revalidatePath } from "next/cache";
import {
  Rocket,
  Plus,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  Eye,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import type { StartupRole, StartupApplication } from "@/lib/types";
import DeleteStartupButton from "@/components/ui/delete-startup-button";

export const dynamic = "force-dynamic";

export default async function StartupDashboardPage({
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

  // Fetch startup owned by user
  const { data: startup } = await supabase
    .from("startups")
    .select("*, startup_roles(*)")
    .eq("founder_id", user.id)
    .maybeSingle();

  // Fetch applications if startup exists
  let applications: (StartupApplication & {
    role?: { title: string };
    applicant?: { full_name: string; username: string; avatar_url: string | null; bio: string | null };
  })[] = [];

  if (startup && startup.startup_roles && startup.startup_roles.length > 0) {
    const roleIds = (startup.startup_roles as StartupRole[]).map((r) => r.id);
    const { data: apps } = await supabase
      .from("startup_applications")
      .select(`
        *,
        role:startup_roles!role_id (title),
        applicant:profiles!applicant_id (full_name, username, avatar_url, bio)
      `)
      .in("role_id", roleIds)
      .order("created_at", { ascending: false });
    applications = (apps as unknown as typeof applications) || [];
  }

  // Action to delete a role inline
  async function handleDeleteRole(formData: FormData) {
    "use server";
    const roleId = String(formData.get("role_id") ?? "");
    const supabase = await createClient();
    await supabase.from("startup_roles").delete().eq("id", roleId);
    revalidatePath("/dashboard/startup");
  }

  // Action to update applicant status inline
  async function handleAppStatus(formData: FormData) {
    "use server";
    const appId = String(formData.get("app_id") ?? "");
    const status = String(formData.get("status") ?? "") as "accepted" | "rejected";
    const supabase = await createClient();
    await supabase.from("startup_applications").update({ status }).eq("id", appId);
    revalidatePath("/dashboard/startup");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="bg-accent-gold/10 border border-accent-gold/30 text-ink p-4 rounded-xl mb-6 text-xs font-mono">
        DEBUG INFO: Logged in as: {user.email} (ID: {user.id}). Startup profile: {startup ? `"${startup.name}" (ID: ${startup.id}, Founder: ${startup.founder_id})` : "None (State A)"}
      </div>
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-8">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-ink">
            Startup Builder
          </h1>
          <p className="text-muted mt-2 text-sm">
            Launch your idea, recruit co-founders or developers, and manage applicants.
          </p>
        </div>
        {startup && (
          <div className="flex items-center gap-3">
            <Link
              href={`/startups/${startup.slug}`}
              className="w-fit rounded-full border border-border bg-surface px-5 py-2.5 font-semibold text-sm text-ink hover:bg-surface-sunken flex items-center gap-2 transition-all duration-200"
            >
              <Eye size={16} /> View public page
            </Link>
            <DeleteStartupButton startupId={startup.id} startupName={startup.name} compact />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm font-semibold">
          {decodeURIComponent(error)}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl bg-success/15 text-success px-4 py-3 text-sm font-semibold">
          Action completed successfully!
        </div>
      )}

      {!startup ? (
        /* STATE A: No startup registered yet */
        <div className="mt-12 max-w-xl mx-auto text-center py-16 px-6 bg-surface border border-border/40 rounded-3xl shadow-card flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center text-muted mb-6 border border-border/50 shadow-sm">
            <Rocket size={28} className="text-accent-green" />
          </div>
          <h3 className="font-heading text-2xl font-extrabold text-ink">
            Build your startup profile
          </h3>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Define your idea and the roles you need. Students can discover your startup, view open opportunities, and apply to join your team.
          </p>

          <form action={createStartup} className="w-full mt-8 flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Startup Name</label>
              <input
                name="name"
                required
                placeholder="e.g. CampusCart"
                className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">Industry</label>
                <input
                  name="industry"
                  required
                  placeholder="e.g. E-Commerce, EdTech"
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">Current Stage</label>
                <select
                  name="stage"
                  defaultValue="Idea"
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
                >
                  <option value="Idea">Idea Stage</option>
                  <option value="MVP">MVP Stage</option>
                  <option value="Funded">Funded / Post-Revenue</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">The Idea / Description</label>
              <textarea
                name="idea"
                required
                rows={4}
                placeholder="Describe what you are building, the problem you solve, and your vision..."
                className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              className="mt-4 rounded-full bg-ink px-6 py-3.5 text-base font-semibold text-white hover:bg-accent-green transition-colors cursor-pointer text-center shadow-sm"
            >
              Create Startup Profile
            </button>
          </form>
        </div>
      ) : (
        /* STATE B: Has startup, show editor + roles + applications */
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Panel: Profile Editor */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className="bg-surface rounded-2xl border border-border/40 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="text-accent-green" size={24} />
                <h3 className="font-heading text-xl font-bold text-ink">Startup Details</h3>
              </div>

              <form action={updateStartup} className="flex flex-col gap-5">
                <input type="hidden" name="id" value={startup.id} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">Startup Name</label>
                  <input
                    name="name"
                    required
                    defaultValue={startup.name}
                    className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Industry</label>
                    <input
                      name="industry"
                      required
                      defaultValue={startup.industry}
                      className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Current Stage</label>
                    <select
                      name="stage"
                      defaultValue={startup.stage}
                      className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
                    >
                      <option value="Idea">Idea Stage</option>
                      <option value="MVP">MVP Stage</option>
                      <option value="Funded">Funded / Post-Revenue</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">The Idea / Description</label>
                  <textarea
                    name="idea"
                    required
                    rows={4}
                    defaultValue={startup.idea}
                    className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-fit rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </section>

            {/* Open Roles section */}
            <section className="bg-surface rounded-2xl border border-border/40 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-accent-green" size={24} />
                  <h3 className="font-heading text-xl font-bold text-ink">Open Roles</h3>
                </div>
              </div>

              {/* Add Role Inline Form */}
              <div className="mb-8 p-5 bg-surface-secondary rounded-xl border border-border/50">
                <h4 className="font-heading text-sm font-bold text-ink mb-4">Add a New Role</h4>
                <form action={addStartupRole} className="flex flex-col gap-4">
                  <input type="hidden" name="startup_id" value={startup.id} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted">Role Title</label>
                      <input
                        name="title"
                        required
                        placeholder="e.g. Lead Frontend Engineer"
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted">Commitment</label>
                      <select
                        name="commitment"
                        defaultValue="Part-time"
                        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted">Equity Offered</label>
                      <input
                        name="equity_offered"
                        placeholder="e.g. 0.5% - 2.0%"
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted">Skills Required (comma-separated)</label>
                      <input
                        name="skills_required"
                        placeholder="e.g. React, TypeScript, Next.js"
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-fit rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white hover:opacity-90 flex items-center gap-1.5 self-end mt-2 cursor-pointer"
                  >
                    <Plus size={14} /> Add Open Role
                  </button>
                </form>
              </div>

              {/* Roles List */}
              {startup.startup_roles && startup.startup_roles.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {startup.startup_roles.map((role: StartupRole) => (
                    <div
                      key={role.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-secondary rounded-xl border border-border/40 gap-4"
                    >
                      <div>
                        <h4 className="font-heading text-base font-bold text-ink">{role.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ink/5 text-ink">
                            {role.commitment}
                          </span>
                          {role.equity_offered && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent-green/10 text-accent-green">
                              {role.equity_offered} equity
                            </span>
                          )}
                        </div>
                        {role.skills_required && role.skills_required.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {role.skills_required.map((skill) => (
                              <span key={skill} className="text-[10px] font-medium px-2 py-0.5 bg-surface rounded-full border border-border/40 text-muted">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <form action={handleDeleteRole}>
                        <input type="hidden" name="role_id" value={role.id} />
                        <button
                          type="submit"
                          className="p-2 rounded-full border border-border text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors cursor-pointer"
                          title="Remove Role"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted text-sm">
                  No open roles posted yet. Add roles above to find team members!
                </div>
              )}
            </section>

            {/* Danger Zone — founder only */}
            <section className="rounded-2xl border-2 border-danger/30 bg-danger/5 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="text-danger shrink-0" size={20} />
                <h3 className="font-heading text-base font-bold text-danger">Danger Zone</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-5">
                Permanently delete{" "}
                <span className="font-semibold text-ink">{startup.name}</span>{" "}
                and all its open roles and applications. Accepted applicants will be notified. This action is irreversible.
              </p>
              <DeleteStartupButton startupId={startup.id} startupName={startup.name} />
            </section>
          </div>

          {/* Right Panel: Applicants list */}
          <div className="bg-surface rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Users className="text-accent-green" size={24} />
              <h3 className="font-heading text-lg font-bold text-ink">Applicants</h3>
            </div>

            {applications.length > 0 ? (
              <div className="flex flex-col gap-6">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 bg-surface-secondary rounded-xl border border-border/50 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/u/${app.applicant?.username}`} className="font-heading text-sm font-bold text-ink hover:underline">
                          {app.applicant?.full_name}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">Applied for <span className="font-semibold text-ink">{app.role?.title}</span></p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        app.status === "pending"
                          ? "bg-surface-sunken text-muted"
                          : app.status === "accepted"
                          ? "bg-success/15 text-success"
                          : "bg-danger/10 text-danger"
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed italic bg-surface p-2.5 rounded-lg border border-border/30">
                      &ldquo;{app.message}&rdquo;
                    </p>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <Link
                        href={`/dashboard/messages?startWith=${app.applicant_id}`}
                        className="text-xs font-semibold text-ink hover:underline flex items-center gap-1"
                      >
                        <MessageSquare size={12} /> Chat
                      </Link>

                      {app.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <form action={handleAppStatus}>
                            <input type="hidden" name="app_id" value={app.id} />
                            <input type="hidden" name="status" value="accepted" />
                            <button
                              type="submit"
                              className="bg-accent-green text-white hover:opacity-90 transition-opacity font-semibold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={12} /> Accept
                            </button>
                          </form>
                          <form action={handleAppStatus}>
                            <input type="hidden" name="app_id" value={app.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button
                              type="submit"
                              className="bg-surface border border-border text-danger hover:bg-red-50 transition-colors font-semibold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle size={12} /> Decline
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted text-sm">
                No applications received yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
