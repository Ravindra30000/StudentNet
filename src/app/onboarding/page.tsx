import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Skill } from "@/lib/types";
import { createProfile } from "./actions";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    redirect(`/u/${existingProfile.username}`);
  }

  const { data: skills } = await supabase
    .from("skills")
    .select("id, name, category")
    .order("category")
    .order("name");

  const skillsByCategory = (skills ?? []).reduce<Record<string, Skill[]>>(
    (acc, skill) => {
      const category = skill.category ?? "Other";
      acc[category] = acc[category] ?? [];
      acc[category].push(skill);
      return acc;
    },
    {}
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="flex flex-1 flex-col py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <main className="max-w-[680px] w-full mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-ink mb-2">
            Set up your profile
          </h1>
          <p className="text-lg text-muted">
            This is what people will see first. You can edit it anytime.
          </p>
        </header>

        {/* Onboarding Form Client Component */}
        <OnboardingForm
          skillsByCategory={skillsByCategory}
          action={createProfile}
          error={error}
          years={years}
        />
      </main>
    </div>
  );
}
