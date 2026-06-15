import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { registerForEvent, unregisterFromEvent } from "./actions";
import { revalidatePath } from "next/cache";
import { Calendar, MapPin, Video, Check } from "lucide-react";
import type { Event } from "@/lib/types";

interface RawEvent extends Omit<Event, 'community_id' | 'community'> {
  community_id: string;
  community: { name: string; slug: string } | null;
  event_registrations: { profile_id: string }[];
}

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const filter = (await searchParams).filter || "all";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all upcoming events (or active events)
  const { data: rawEvents } = await supabase
    .from("events")
    .select(`
      *,
      community:communities(name, slug),
      event_registrations(profile_id)
    `)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  let events = (rawEvents as unknown as RawEvent[] || []).map((e) => ({
    ...e,
    registrationCount: e.event_registrations?.length || 0,
    isRegistered: user ? e.event_registrations?.some((r) => r.profile_id === user.id) : false,
  }));

  // Apply filter
  if (filter === "online") {
    events = events.filter((e) => e.is_online);
  } else if (filter === "in-person") {
    events = events.filter((e) => !e.is_online);
  } else if (filter === "hackathons") {
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes("hackathon") ||
        e.description?.toLowerCase().includes("hackathon")
    );
  } else if (filter === "workshops") {
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes("workshop") ||
        e.description?.toLowerCase().includes("workshop")
    );
  }

  // Server actions for page buttons
  async function handleRegister(formData: FormData) {
    "use server";
    const eventId = String(formData.get("event_id") ?? "");
    try {
      await registerForEvent(eventId);
    } catch {
      // Ignore or log
    }
    revalidatePath("/events");
  }

  async function handleUnregister(formData: FormData) {
    "use server";
    const eventId = String(formData.get("event_id") ?? "");
    try {
      await unregisterFromEvent(eventId);
    } catch {
      // Ignore or log
    }
    revalidatePath("/events");
  }

  // Date parsing helper
  const parseDate = (isoString: string) => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Hackathons", value: "hackathons" },
    { label: "Workshops", value: "workshops" },
    { label: "Online", value: "online" },
    { label: "In-Person", value: "in-person" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="mx-auto max-w-4xl px-6">
        {/* Page Header */}
        <div className="border-b border-border/40 pb-8">
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-ink md:text-6xl">
            Events
          </h1>
          <p className="text-muted mt-3 text-base md:text-lg">
            Hackathons, workshops, and meetups for student builders.
          </p>
        </div>

        {/* Filter Row */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          {filterOptions.map((opt) => {
            const isActive = filter === opt.value;
            return (
              <Link
                key={opt.value}
                href={`/events?filter=${opt.value}`}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-ink text-surface shadow-sm"
                    : "border border-border text-ink hover:bg-surface-sunken"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="mt-12 rounded-3xl bg-surface p-16 text-center text-muted shadow-sm">
            <Calendar className="mx-auto h-12 w-12 opacity-35 mb-4" />
            <h3 className="font-heading text-lg font-bold text-ink">No Events Found</h3>
            <p className="text-sm mt-1">Check back later or explore other categories.</p>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {events.map((evt) => {
              const { day, month } = parseDate(evt.starts_at);
              return (
                <div
                  key={evt.id}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-surface p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Date Badge */}
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-sunken">
                      <span className="font-heading text-2xl font-extrabold text-ink leading-none">
                        {day}
                      </span>
                      <span className="text-[10px] font-bold text-muted mt-1 leading-none">
                        {month}
                      </span>
                    </div>

                    {/* Meta */}
                    <div>
                      <h3 className="font-heading text-lg font-bold text-ink hover:underline">
                        <Link href={`/events/${evt.slug}`}>{evt.title}</Link>
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted font-medium">
                        {evt.community && (
                          <span>
                            Hosted by{" "}
                            <Link
                              href={`/communities/${evt.community.slug}`}
                              className="text-accent-green hover:underline"
                            >
                              {evt.community.name}
                            </Link>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {evt.is_online ? (
                            <>
                              <Video className="h-3.5 w-3.5" />
                              Online
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5" />
                              {evt.location || "In Person"}
                            </>
                          )}
                        </span>
                        <span>{evt.registrationCount} going</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 sm:shrink-0">
                    <Link
                      href={`/events/${evt.slug}`}
                      className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken transition-colors"
                    >
                      Details
                    </Link>

                    {user && (
                      evt.isRegistered ? (
                        <form action={handleUnregister}>
                          <input type="hidden" name="event_id" value={evt.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-surface hover:opacity-90 transition-opacity"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Going
                          </button>
                        </form>
                      ) : (
                        <form action={handleRegister}>
                          <input type="hidden" name="event_id" value={evt.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-accent-green px-4 py-2 text-xs font-semibold text-surface hover:opacity-95 transition-opacity"
                          >
                            Register
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
