import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { registerForEvent, unregisterFromEvent } from "../actions";
import { revalidatePath } from "next/cache";
import {
  Calendar,
  MapPin,
  Video,
  ArrowLeft,
  Check,
  Building,
  Clock,
  ExternalLink,
} from "lucide-react";
import type { Profile } from "@/lib/types";

interface RegistrationWithProfile {
  id: string;
  profile: Profile | null;
}

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch event
  const { data: event } = await supabase
    .from("events")
    .select("*, community:communities(id, name, slug)")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  // Fetch registered attendees
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("*, profile:profiles(*)")
    .eq("event_id", event.id);

  const attendees: Profile[] = (registrations as unknown as RegistrationWithProfile[] || [])
    .map((r) => r.profile)
    .filter((p): p is Profile => !!p);

  const isRegistered = user ? attendees.some((a) => a.id === user.id) : false;

  // Inline action for registration
  async function handleRegisterInline() {
    "use server";
    await registerForEvent(event.id);
    revalidatePath(`/events/${event.slug}`);
  }

  async function handleUnregisterInline() {
    "use server";
    await unregisterFromEvent(event.id);
    revalidatePath(`/events/${event.slug}`);
  }

  // Helpers
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (starts: string, ends: string) => {
    const s = new Date(starts);
    const e = new Date(ends);
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return `${s.toLocaleTimeString("en-US", options)} - ${e.toLocaleTimeString("en-US", options)}`;
  };

  const getEventGradient = (name: string) => {
    const gradients = [
      "from-zinc-950 via-green-950 to-teal-950",
      "from-teal-950 via-emerald-950 to-zinc-900",
      "from-green-950 via-zinc-950 to-teal-900",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="mx-auto max-w-5xl px-6">
        {/* Back Link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        {/* Large Cover Banner */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getEventGradient(event.title)} px-8 py-20 text-surface shadow-sm`}>
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-5xl leading-tight">
              {event.title}
            </h1>
            {event.community && (
              <p className="mt-4 text-sm font-semibold text-surface/85">
                Hosted by{" "}
                <Link
                  href={`/communities/${event.community.slug}`}
                  className="underline hover:text-surface"
                >
                  {event.community.name}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left / Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-ink mb-4">About this event</h2>
              {event.description ? (
                <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              ) : (
                <p className="text-muted text-sm italic">No description provided for this event.</p>
              )}
            </div>

            {/* Who's Going Section */}
            <div className="rounded-3xl bg-surface p-8 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-ink mb-4">
                Attendees ({attendees.length})
              </h2>

              {attendees.length === 0 ? (
                <p className="text-sm text-muted italic">No one has registered for this event yet.</p>
              ) : (
                <div>
                  {/* Row of avatars */}
                  <div className="flex flex-wrap items-center gap-3">
                    {attendees.map((attendee) => (
                      <Link
                        href={`/u/${attendee.username}`}
                        key={attendee.id}
                        title={attendee.full_name}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken font-bold text-ink text-xs hover:-translate-y-0.5 transition-transform"
                      >
                        {attendee.avatar_url ? (
                          <Image
                            src={attendee.avatar_url}
                            alt={attendee.full_name}
                            width={40}
                            height={40}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          attendee.full_name?.substring(0, 2).toUpperCase() || "ST"
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column / Details Sidebar */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="rounded-3xl bg-surface p-6 shadow-sm">
              <h3 className="font-heading text-sm font-bold text-ink border-b border-border/40 pb-3 mb-4">
                Event Logistics
              </h3>

              <div className="space-y-4 text-xs font-semibold text-ink">
                {/* Date */}
                <div className="flex items-center gap-3 py-1">
                  <Calendar className="h-4 w-4 text-accent-green" />
                  <div>
                    <p className="text-[10px] text-muted">Date</p>
                    <p className="mt-0.5">{formatDate(event.starts_at)}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3 py-1 border-t border-border/30 pt-3">
                  <Clock className="h-4 w-4 text-accent-green" />
                  <div>
                    <p className="text-[10px] text-muted">Time</p>
                    <p className="mt-0.5">{formatTime(event.starts_at, event.ends_at)}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 py-1 border-t border-border/30 pt-3">
                  {event.is_online ? (
                    <>
                      <Video className="h-4 w-4 text-accent-green" />
                      <div>
                        <p className="text-[10px] text-muted">Location</p>
                        <p className="mt-0.5 text-accent-green hover:underline">
                          {event.location ? (
                            <a href={event.location} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5">
                              Online Join Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            "Online (Link to be shared)"
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-accent-green" />
                      <div>
                        <p className="text-[10px] text-muted">Venue</p>
                        <p className="mt-0.5">{event.location || "To Be Announced"}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Host */}
                {event.community && (
                  <div className="flex items-center gap-3 py-1 border-t border-border/30 pt-3">
                    <Building className="h-4 w-4 text-accent-green" />
                    <div>
                      <p className="text-[10px] text-muted">Hosted By</p>
                      <Link href={`/communities/${event.community.slug}`} className="mt-0.5 text-accent-green hover:underline block">
                        {event.community.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration Actions */}
              {user && (
                <div className="mt-6 pt-4 border-t border-border/40">
                  {isRegistered ? (
                    <form action={handleUnregisterInline}>
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-semibold text-surface hover:opacity-90 transition-opacity"
                      >
                        <Check className="h-4 w-4" />
                        Cancel Registration
                      </button>
                    </form>
                  ) : (
                    <form action={handleRegisterInline}>
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-accent-green px-4 py-3 text-xs font-semibold text-surface hover:opacity-95 transition-opacity"
                      >
                        Register for Event
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
