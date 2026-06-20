import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Calendar,
  Users,
  MessageSquare,
  ArrowLeft,
  Briefcase,
  Layers,
} from "lucide-react";
import RoleList from "@/components/startups/role-list";
import DeleteStartupButton from "@/components/ui/delete-startup-button";

export const dynamic = "force-dynamic";

export default async function StartupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { slug } = await params;
  const { error, success } = await searchParams;

  const supabase = await createClient();

  // Fetch user session (optional, for apply logic)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch startup details
  const { data: startup, error: fetchError } = await supabase
    .from("startups")
    .select(`
      *,
      founder:profiles!founder_id (id, full_name, username, avatar_url, bio, college),
      startup_roles (*)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError || !startup) {
    notFound();
  }

  // Fetch applicant applications if user logged in
  const hasAppliedMap: Record<string, boolean> = {};
  if (user) {
    const { data: apps } = await supabase
      .from("startup_applications")
      .select("role_id")
      .eq("applicant_id", user.id);
    if (apps) {
      apps.forEach((app: { role_id: string }) => {
        hasAppliedMap[app.role_id] = true;
      });
    }
  }

  // Initials for logo placeholder
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
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-6 pt-32">
        {/* Back Link */}
        <Link
          href="/startups"
          className="w-fit text-sm font-semibold text-muted hover:text-ink flex items-center gap-1.5 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to startups
        </Link>

        {error && (
          <div className="mb-6 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm font-semibold">
            {decodeURIComponent(error)}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-success/15 text-success px-4 py-3 text-sm font-semibold">
            Application submitted successfully! The founder will review it.
          </div>
        )}

        {/* Danger Zone — founder only, shown above the grid so it's visible on all screen sizes */}
        {user?.id === startup.founder.id && (
          <div className="mb-12 rounded-3xl border border-danger/30 bg-danger/5 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-danger text-base font-bold">&#9888;</span>
                <h3 className="font-heading text-sm font-bold text-danger">Delete Startup</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Permanently delete <span className="font-semibold text-ink">{startup.name}</span> and all its open roles and applications. This action is irreversible.
              </p>
            </div>
            <div className="shrink-0">
              <DeleteStartupButton startupId={startup.id} startupName={startup.name} />
            </div>
          </div>
        )}

        {/* Header Block */}
        <div className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-heading text-2xl font-extrabold ${avatarClass} shrink-0`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink break-words">
                  {startup.name}
                </h1>
                <span className="text-xs font-bold bg-surface-sunken border border-border/50 text-ink px-3 py-1 rounded-full uppercase shrink-0">
                  {startup.stage} STAGE
                </span>
              </div>
              <p className="text-muted text-base mt-2 break-words">
                Building in <span className="font-semibold text-ink">{startup.industry}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {user?.id === startup.founder.id && (
              <Link
                href="/dashboard/startup"
                className="w-full sm:w-auto rounded-full bg-ink hover:opacity-90 px-5 py-3 font-semibold text-xs text-white flex items-center justify-center gap-2 transition-opacity"
              >
                Manage Startup
              </Link>
            )}
            {user?.id !== startup.founder.id && (
              <Link
                href={`/dashboard/messages?startWith=${startup.founder.id}`}
                className="w-full sm:w-auto rounded-full border border-border bg-surface hover:bg-surface-sunken px-5 py-3 font-semibold text-xs text-ink flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare size={16} /> Message founder
              </Link>
            )}
          </div>
        </div>

        {/* 8-col Left + 4-col Right Rail layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Main Info */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            {/* About */}
            <section className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-ink mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-accent-green" /> About this startup
              </h2>
              <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">
                {startup.idea}
              </p>
            </section>

            {/* Open Roles */}
            <section className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-ink mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-accent-green" /> Open Roles
              </h2>

              {startup.startup_roles && startup.startup_roles.length > 0 ? (
                <RoleList
                  roles={startup.startup_roles}
                  startupName={startup.name}
                  redirectSlug={startup.slug}
                  founderId={startup.founder.id}
                  userId={user ? user.id : null}
                  hasAppliedMap={hasAppliedMap}
                />
              ) : (
                <p className="text-sm text-muted text-center py-6">
                  No open roles posted at the moment.
                </p>
              )}
            </section>
          </div>

          {/* Right Rail */}
          <div className="flex flex-col gap-8">
            {/* Stats Card */}
            <div className="bg-surface border border-border/40 rounded-3xl p-6 shadow-sm">
              <h3 className="font-heading text-base font-bold text-ink mb-4 pb-3 border-b border-border/40">
                Startup Info
              </h3>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted flex items-center gap-1.5 shrink-0"><Layers size={16} /> Industry</span>
                  <span className="font-semibold text-ink text-right break-words min-w-0">
                    {startup.industry}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted flex items-center gap-1.5 shrink-0"><Calendar size={16} /> Founded</span>
                  <span className="font-semibold text-ink shrink-0">
                    {new Date(startup.created_at).getFullYear()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted flex items-center gap-1.5 shrink-0"><Users size={16} /> Open Roles</span>
                  <span className="font-semibold text-ink shrink-0">
                    {startup.startup_roles ? startup.startup_roles.length : 0} positions
                  </span>
                </div>
              </div>
            </div>

            {/* Founder Card */}
            <div className="bg-surface border border-border/40 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-heading text-base font-bold text-ink pb-3 border-b border-border/40">
                Founded by
              </h3>
              <div className="flex items-center gap-4">
                {startup.founder.avatar_url ? (
                  <Image
                    src={startup.founder.avatar_url}
                    alt={startup.founder.full_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center font-bold border border-border">
                    {startup.founder.full_name.substring(0, 1)}
                  </div>
                )}
                <div>
                  <Link
                    href={`/u/${startup.founder.username}`}
                    className="font-heading text-sm font-bold text-ink hover:underline"
                  >
                    {startup.founder.full_name}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">{startup.founder.college}</p>
                </div>
              </div>
              {startup.founder.bio && (
                <p className="text-xs text-muted leading-relaxed line-clamp-3 italic">
                  &ldquo;{startup.founder.bio}&rdquo;
                </p>
              )}
              {user?.id !== startup.founder.id && (
                <Link
                  href={`/dashboard/messages?startWith=${startup.founder.id}`}
                  className="rounded-full bg-ink text-white font-semibold text-xs py-2.5 hover:opacity-90 block text-center transition-opacity"
                >
                  Message {startup.founder.full_name.split(" ")[0]}
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
