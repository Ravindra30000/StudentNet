import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  joinCommunity,
  leaveCommunity,
  createCommunityPost,
} from "@/app/dashboard/communities/actions";
import { revalidatePath } from "next/cache";
import {
  Users,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Send,
  Shield,
  Check,
} from "lucide-react";
import type { CommunityPost, CommunityMember, Profile, Event } from "@/lib/types";
import DeleteCommunityButton from "@/components/ui/delete-community-button";

interface PostWithAuthor extends Omit<CommunityPost, 'author_id' | 'author'> {
  author_id: string;
  author: Profile | null;
}

interface MemberWithProfile extends Omit<CommunityMember, 'profile_id' | 'profile'> {
  profile_id: string;
  profile: Profile | null;
}

export const dynamic = "force-dynamic";

export default async function CommunityHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch community
  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!community) {
    notFound();
  }

  // Check membership
  let isJoined = false;
  let isLeader = false;
  if (user) {
    const { data: membership } = await supabase
      .from("community_members")
      .select("*")
      .eq("community_id", community.id)
      .eq("profile_id", user.id)
      .maybeSingle();
    isJoined = !!membership;
    isLeader = community.leader_id === user.id;
  }

  // Fetch posts
  const { data: postsData } = await supabase
    .from("community_posts")
    .select(`
      *,
      author:profiles!author_id (*)
    `)
    .eq("community_id", community.id)
    .order("created_at", { ascending: false });

  const posts = (postsData as unknown as PostWithAuthor[]) || [];

  // Fetch members
  const { data: membersData } = await supabase
    .from("community_members")
    .select(`
      *,
      profile:profiles!profile_id (*)
    `)
    .eq("community_id", community.id)
    .limit(12);

  const members = (membersData as unknown as MemberWithProfile[]) || [];

  // Fetch count of total members
  const { count: memberCount } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", community.id);

  // Fetch upcoming events
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("community_id", community.id)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(4);

  const events = (eventsData as unknown as Event[]) || [];

  // Page level inline join action
  async function handleBannerJoinInline() {
    "use server";
    await joinCommunity(community.id);
    revalidatePath(`/communities/${community.slug}`);
  }

  // Page level inline leave action
  async function handleBannerLeaveInline() {
    "use server";
    await leaveCommunity(community.id);
    revalidatePath(`/communities/${community.slug}`);
  }

  // Gradient generator
  const getBannerGradient = (name: string) => {
    const gradients = [
      "from-teal-950 via-emerald-950 to-green-950",
      "from-zinc-950 via-teal-950 to-zinc-900",
      "from-emerald-950 via-green-950 to-emerald-900",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
  };

  // Date parsing helper
  const parseDate = (isoString: string) => {
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Back Link */}
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Communities
        </Link>

        {/* Banner Card */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getBannerGradient(community.name)} px-8 py-16 text-surface shadow-sm`}>
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-heading text-4xl font-extrabold tracking-tight md:text-5xl">
                {community.name}
              </h1>
              <div className="mt-4 flex items-center gap-4 text-sm font-medium text-surface/85">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </span>
                {events.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {events.length} upcoming events
                  </span>
                )}
              </div>
            </div>

            {user && (
              <div className="shrink-0">
                {isLeader ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-gold px-4 py-2 text-xs font-bold text-accent-gold-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    Leader Console
                  </span>
                ) : isJoined ? (
                  <form action={handleBannerLeaveInline}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface/10 px-5 py-2.5 text-xs font-semibold text-surface hover:bg-surface/20 border border-surface/25 transition-all"
                    >
                      <Check className="h-4 w-4" />
                      Joined Community
                    </button>
                  </form>
                ) : (
                  <form action={handleBannerJoinInline}>
                    <button
                      type="submit"
                      className="rounded-full bg-accent-gold px-5 py-2.5 text-xs font-bold text-accent-gold-foreground hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Join Community
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-6 rounded-2xl bg-danger/10 p-4 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        {/* Danger Zone — leader only, shown above the grid so it's visible on all screen sizes */}
        {isLeader && (
          <div className="mt-6 rounded-2xl border-2 border-red-500 bg-red-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-600 text-base">&#9888;</span>
                <h3 className="font-heading text-sm font-bold text-red-600">Delete Community</h3>
              </div>
              <p className="text-xs text-red-700/70 leading-relaxed">
                Permanently dissolve this community. All posts and members will be removed. This cannot be undone.
              </p>
            </div>
            <div className="shrink-0">
              <DeleteCommunityButton
                communityId={community.id}
                communityName={community.name}
              />
            </div>
          </div>
        )}

        {/* Main Columns */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left / Feed Column (8 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Composer: visible only to joined members */}
            {isJoined && (
              <div className="rounded-3xl bg-surface p-6 shadow-sm">
                <h3 className="font-heading text-sm font-bold text-ink mb-3">Share an update</h3>
                <form action={createCommunityPost}>
                  <input type="hidden" name="community_id" value={community.id} />
                  <input type="hidden" name="slug" value={community.slug} />
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder="Ask a question, post an opportunity, or share your work..."
                    className="w-full rounded-2xl border border-border p-4 text-sm focus:border-ink focus:outline-none bg-surface-sunken resize-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-surface hover:opacity-90 transition-opacity"
                    >
                      <Send className="h-3 w-3" />
                      Post Update
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-bold text-ink mb-4">Feed</h2>
              {posts.length === 0 ? (
                <div className="rounded-3xl bg-surface p-12 text-center text-muted shadow-sm">
                  <MessageSquare className="mx-auto h-8 w-8 opacity-35 mb-2" />
                  <p className="text-sm font-medium">No posts here yet. Be the first to speak!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="rounded-3xl bg-surface p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/u/${post.author?.username}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken font-bold text-ink text-sm hover:opacity-90 transition-opacity"
                      >
                        {post.author?.avatar_url ? (
                          <Image
                            src={post.author.avatar_url}
                            alt={post.author.full_name}
                            width={40}
                            height={40}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          post.author?.full_name?.substring(0, 2).toUpperCase() || "ST"
                        )}
                      </Link>
                      <div>
                        <Link
                          href={`/u/${post.author?.username}`}
                          className="text-xs font-bold text-ink hover:underline"
                        >
                          {post.author?.full_name}
                        </Link>
                        <p className="text-[10px] text-muted">
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-ink leading-relaxed whitespace-pre-line">
                      {post.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Rail Column (4 cols) */}
          <div className="space-y-6">
            {/* Community Info & Description */}
            <div className="rounded-3xl bg-surface p-6 shadow-sm">
              <h3 className="font-heading text-sm font-bold text-ink border-b border-border/40 pb-3">
                About Community
              </h3>
              {community.description ? (
                <p className="text-muted mt-4 text-xs leading-relaxed whitespace-pre-line">
                  {community.description}
                </p>
              ) : (
                <p className="text-muted mt-4 text-xs italic">No description provided yet.</p>
              )}
            </div>

            {/* Upcoming Events list */}
            {events.length > 0 && (
              <div className="rounded-3xl bg-surface p-6 shadow-sm">
                <h3 className="font-heading text-sm font-bold text-ink border-b border-border/40 pb-3 mb-4">
                  Upcoming Events
                </h3>
                <div className="space-y-4">
                  {events.map((evt) => {
                    const { day, month } = parseDate(evt.starts_at);
                    return (
                      <Link
                        key={evt.id}
                        href={`/events/${evt.slug}`}
                        className="flex items-center gap-3 group hover:opacity-85 transition-opacity"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-sunken">
                          <span className="font-heading text-sm font-extrabold text-ink leading-none">
                            {day}
                          </span>
                          <span className="text-[9px] font-bold text-muted mt-0.5 leading-none">
                            {month}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink group-hover:underline line-clamp-1">
                            {evt.title}
                          </p>
                          <p className="text-[10px] text-muted mt-0.5">
                            {evt.is_online ? "Online" : evt.location || "In Person"}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Members Grid Card */}
            <div className="rounded-3xl bg-surface p-6 shadow-sm">
              <h3 className="font-heading text-sm font-bold text-ink border-b border-border/40 pb-3 mb-4">
                Members Directory
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {members.map((mem) => (
                  <Link
                    href={`/u/${mem.profile?.username}`}
                    key={mem.profile_id}
                    title={`${mem.profile?.full_name} (${mem.role})`}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken font-bold text-ink text-xs hover:-translate-y-0.5 transition-transform shrink-0"
                  >
                    {mem.profile?.avatar_url ? (
                      <Image
                        src={mem.profile.avatar_url}
                        alt={mem.profile.full_name}
                        width={40}
                        height={40}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      mem.profile?.full_name?.substring(0, 2).toUpperCase() || "ST"
                    )}
                    {mem.role === "leader" && (
                      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-accent-green p-0.5 border border-surface text-surface shrink-0">
                        <Shield className="h-1.5 w-1.5" />
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              {memberCount && memberCount > 12 && (
                <p className="text-[10px] text-muted text-center mt-4">
                  + {memberCount - 12} more members
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
