import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCommunity } from "./actions";
import { createEvent } from "@/app/events/actions";
import {
  Users,
  Plus,
  Compass,
  Calendar,
  Shield,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import type { Community } from "@/lib/types";
import DeleteCommunityButton from "@/components/ui/delete-community-button";

interface JoinedMembership {
  community_id: string;
  community: Community | null;
}

export const dynamic = "force-dynamic";

export default async function DashboardCommunitiesPage({
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

  // Fetch communities joined by user (role: member)
  const { data: joinedData } = await supabase
    .from("community_members")
    .select("*, community:communities(*)")
    .eq("profile_id", user.id)
    .eq("role", "member");

  const joinedMemberships = (joinedData as unknown as JoinedMembership[]) || [];

  // Fetch communities led by user
  const { data: ledCommunities } = await supabase
    .from("communities")
    .select("*")
    .eq("leader_id", user.id);

  const led = ledCommunities || [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-20">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-8">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-ink">
            Community Hub
          </h1>
          <p className="text-muted mt-2 text-sm">
            Launch interest groups, manage joined communities, and coordinate workshops/meetups.
          </p>
        </div>
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken transition-colors"
        >
          <Compass className="h-3.5 w-3.5" />
          Explore Directory
        </Link>
      </div>

      {/* Alert Messages */}
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

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Columns: Community Memberships & Event Coordination */}
        <div className="lg:col-span-2 space-y-8">
          {/* Led Communities Section */}
          <div className="rounded-3xl bg-surface p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-ink border-b border-border/40 pb-4 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent-green" />
              Communities You Lead
            </h2>

            {led.length === 0 ? (
              <p className="text-sm text-muted italic">You haven&apos;t launched any communities yet.</p>
            ) : (
              <div className="divide-y divide-border/30">
                {led.map((comm) => (
                  <div key={comm.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-ink">{comm.name}</h4>
                      <p className="text-xs text-muted mt-1 line-clamp-1">{comm.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/communities/${comm.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent-green hover:underline"
                      >
                        Dashboard
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <DeleteCommunityButton
                        communityId={comm.id}
                        communityName={comm.name}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Joined Communities Section */}
          <div className="rounded-3xl bg-surface p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-ink border-b border-border/40 pb-4 mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-accent-green" />
              Joined Communities
            </h2>

            {joinedMemberships.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted">You haven&apos;t joined any communities yet.</p>
                <Link
                  href="/communities"
                  className="mt-4 inline-flex text-xs font-semibold text-accent-green underline hover:opacity-90"
                >
                  Browse communities directory
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {joinedMemberships.map((membership) => (
                  <div key={membership.community_id} className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{membership.community?.name}</h4>
                      <p className="text-xs text-muted mt-1 line-clamp-1">
                        {membership.community?.description}
                      </p>
                    </div>
                    <Link
                      href={`/communities/${membership.community?.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent-green hover:underline"
                    >
                      Enter Home
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coordinate Event Form (Only if they lead at least one community) */}
          {led.length > 0 && (
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-ink border-b border-border/40 pb-4 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-green" />
                Schedule Community Event
              </h2>

              <form action={createEvent} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="community_id" className="block text-xs font-semibold text-ink">
                      Host Community
                    </label>
                    <select
                      id="community_id"
                      name="community_id"
                      required
                      className="mt-2 block w-full rounded-full border border-border px-4 py-2.5 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                    >
                      {led.map((comm) => (
                        <option key={comm.id} value={comm.id}>
                          {comm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-xs font-semibold text-ink">
                      Event Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      placeholder="e.g., Intro to Solidity Hackathon"
                      className="mt-2 block w-full rounded-full border border-border px-4 py-2.5 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-ink">
                    Event Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Provide details about dates, topics, and speakers..."
                    className="mt-2 block w-full rounded-2xl border border-border px-4 py-3 text-xs focus:border-ink focus:outline-none bg-surface-sunken resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="starts_at" className="block text-xs font-semibold text-ink">
                      Starts At
                    </label>
                    <input
                      type="datetime-local"
                      id="starts_at"
                      name="starts_at"
                      required
                      className="mt-2 block w-full rounded-full border border-border px-4 py-2.5 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                    />
                  </div>

                  <div>
                    <label htmlFor="ends_at" className="block text-xs font-semibold text-ink">
                      Ends At
                    </label>
                    <input
                      type="datetime-local"
                      id="ends_at"
                      name="ends_at"
                      required
                      className="mt-2 block w-full rounded-full border border-border px-4 py-2.5 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="location" className="block text-xs font-semibold text-ink">
                      Location / Link
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      placeholder="e.g., Zoom Link or Room 204"
                      className="mt-2 block w-full rounded-full border border-border px-4 py-2.5 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_online"
                      name="is_online"
                      value="true"
                      className="h-4 w-4 rounded border-border bg-surface-sunken text-accent-green focus:ring-accent-green"
                    />
                    <label htmlFor="is_online" className="text-xs font-semibold text-ink">
                      This is an Online event
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-bold text-surface hover:opacity-90 transition-opacity"
                >
                  <PlusCircle className="h-4 w-4" />
                  Schedule Event
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Launch New Community Form */}
        <div className="space-y-8">
          <div className="rounded-3xl bg-surface p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <PlusCircle className="h-5 w-5 text-accent-green" />
              <h3 className="font-heading text-lg font-bold text-ink">Launch Community</h3>
            </div>
            <p className="text-muted mt-2 text-xs">
              Establish a new interest circle, university club, or cohort.
            </p>

            <form action={createCommunity} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-ink">
                  Community Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g., AI Builders Club"
                  className="mt-2 block w-full rounded-full border border-border px-4 py-2.5 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-ink">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="What is this community's focus? Who is it for?"
                  className="mt-2 block w-full rounded-2xl border border-border px-4 py-3 text-xs focus:border-ink focus:outline-none bg-surface-sunken resize-none"
                />
              </div>

              <div>
                <label htmlFor="cover_image_url" className="block text-xs font-semibold text-ink">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="cover_image_url"
                  name="cover_image_url"
                  placeholder="e.g., https://example.com/banner.png"
                  className="mt-2 block w-full rounded-full border border-border px-4 py-2.5 text-xs focus:border-ink focus:outline-none bg-surface-sunken"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-bold text-surface hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4.5 w-4.5" />
                Launch Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
