import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  // Fallback defaults for preferences
  const rawPreferences = profile.notification_preferences as Record<string, unknown> | null;
  const preferences = {
    messages:
      typeof rawPreferences?.messages === "boolean"
        ? rawPreferences.messages
        : true,
    applications:
      typeof rawPreferences?.applications === "boolean"
        ? rawPreferences.applications
        : true,
    weekly_digest:
      typeof rawPreferences?.weekly_digest === "boolean"
        ? rawPreferences.weekly_digest
        : true,
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-ink">
          Settings
        </h1>
      </header>

      <SettingsClient
        initialEmail={user.email || ""}
        initialPreferences={preferences}
      />
    </div>
  );
}
