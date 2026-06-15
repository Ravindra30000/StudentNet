import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavbarUserMenu from "@/components/navbar-user-menu";
import Logo from "@/components/logo";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let fullName: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    username = profile?.username ?? null;
    fullName = profile?.full_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-border/50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity flex items-center"
        >
          <Logo size="lg" />
        </Link>
        <div className="flex items-center gap-6 md:gap-8">
          <Link
            href="/students"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Talent
          </Link>
          <Link
            href="/startups"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Startups
          </Link>
          <Link
            href="/communities"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Communities
          </Link>
          <Link
            href="/events"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Events
          </Link>
          {user ? (
            <NavbarUserMenu
              username={username}
              fullName={fullName}
              avatarUrl={avatarUrl}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-all duration-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
