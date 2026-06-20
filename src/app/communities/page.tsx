import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { joinCommunity, leaveCommunity } from "@/app/dashboard/communities/actions";
import { revalidatePath } from "next/cache";
import { Users, Plus, Check, ArrowRight } from "lucide-react";
import type { Community } from "@/lib/types";
import ExpandableText from "@/components/ui/expandable-text";

interface RawCommunity extends Omit<Community, 'leader_id' | 'leader'> {
  leader_id: string;
  community_members: { profile_id: string }[];
  leader: { full_name: string; username: string } | null;
}

export const dynamic = "force-dynamic";

export default async function CommunitiesDirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all communities
  const { data: rawCommunities } = await supabase
    .from("communities")
    .select(`
      *,
      community_members (profile_id),
      leader:profiles!leader_id (full_name, username)
    `)
    .order("created_at", { ascending: false });

  const communities = (rawCommunities as unknown as RawCommunity[] || []).map((comm) => {
    return {
      ...comm,
      memberCount: comm.community_members?.length || 0,
      memberIds: comm.community_members?.map((m) => m.profile_id) || [],
    };
  });

  // User memberships list
  const joinedCommunityIds = new Set<string>();
  if (user && rawCommunities) {
    communities.forEach((comm) => {
      if (comm.memberIds.includes(user.id)) {
        joinedCommunityIds.add(comm.id);
      }
    });
  }

  // Server actions for page buttons
  async function handleJoin(formData: FormData) {
    "use server";
    const communityId = String(formData.get("community_id") ?? "");
    try {
      await joinCommunity(communityId);
    } catch {
      // Ignore or log
    }
    revalidatePath("/communities");
  }

  async function handleLeave(formData: FormData) {
    "use server";
    const communityId = String(formData.get("community_id") ?? "");
    try {
      await leaveCommunity(communityId);
    } catch {
      // Ignore or log
    }
    revalidatePath("/communities");
  }

  // Function to generate consistent gradients for community placeholder banners
  const getGradient = (name: string) => {
    const gradients = [
      "from-teal-900 to-emerald-800",
      "from-green-900 to-emerald-950",
      "from-zinc-900 to-emerald-900",
      "from-emerald-900 to-cyan-900",
      "from-teal-950 to-green-900",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Page Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-10">
          <div>
            <h1 className="font-heading text-5xl font-extrabold tracking-tight text-ink md:text-6xl">
              Communities
            </h1>
            <p className="text-muted mt-3 text-base md:text-lg">
              Find your people — by college, interest, or skill.
            </p>
          </div>
          {user && (
            <Link
              href="/dashboard/communities"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-surface hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Manage Communities
            </Link>
          )}
        </div>

        {/* Communities Grid */}
        {communities.length === 0 ? (
          <div className="mt-16 rounded-3xl bg-surface p-16 text-center text-muted shadow-sm">
            <Users className="mx-auto h-12 w-12 opacity-35 mb-4" />
            <h3 className="font-heading text-lg font-bold text-ink">No Communities Found</h3>
            <p className="text-sm mt-1">Start the first community of builders!</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((comm) => {
              const isJoined = joinedCommunityIds.has(comm.id);
              const isLeader = comm.leader_id === user?.id;
              
              return (
                <div
                  key={comm.id}
                  className="flex flex-col justify-between overflow-hidden rounded-3xl bg-surface shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div>
                    {/* Cover Image Strip */}
                    <div className={`h-24 w-full bg-gradient-to-r ${getGradient(comm.name)}`} />
                    
                    <div className="p-6">
                      <h3 className="font-heading text-lg font-bold text-ink hover:underline">
                        <Link href={`/communities/${comm.slug}`}>{comm.name}</Link>
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {comm.memberCount} {comm.memberCount === 1 ? "member" : "members"}
                        </span>
                      </div>
                      {comm.description && (
                        <ExpandableText
                          text={comm.description}
                          limit={120}
                          className="text-muted mt-3 text-xs leading-relaxed"
                        />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-border/30 px-6 py-4 bg-surface-sunken">
                    <Link
                      href={`/communities/${comm.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent-green hover:underline"
                    >
                      Enter Home
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    {user && (
                      isLeader ? (
                        <span className="rounded-full bg-accent-green/10 px-3 py-1 text-[10px] font-semibold text-accent-green">
                          Leader
                        </span>
                      ) : isJoined ? (
                        <form action={handleLeave}>
                          <input type="hidden" name="community_id" value={comm.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-full bg-ink px-3.5 py-1 text-[10px] font-semibold text-surface hover:opacity-95 transition-opacity"
                          >
                            <Check className="h-3 w-3" />
                            Joined
                          </button>
                        </form>
                      ) : (
                        <form action={handleJoin}>
                          <input type="hidden" name="community_id" value={comm.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-border px-3.5 py-1 text-[10px] font-semibold text-ink hover:bg-surface transition-colors"
                          >
                            Join
                          </button>
                        </form>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
