import Link from "next/link";
import { login } from "./actions";
import Logo from "@/components/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const { error, redirect } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20 bg-background">
      <main className="w-full max-w-[440px] flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="xl" />
        </div>

        {/* Main Card */}
        <div className="w-full bg-surface rounded-[28px] shadow-card border border-border/40 p-8 sm:p-10 flex flex-col gap-8">
          {/* Header */}
          <div className="text-center flex flex-col gap-2">
            <h2 className="font-heading text-3xl font-bold text-ink">
              Welcome back
            </h2>
            <p className="text-sm text-muted">
              Log in to continue building your profile.
            </p>
          </div>

          {/* Form */}
          <form action={login} className="flex flex-col gap-6 w-full">
            {redirect && <input type="hidden" name="redirect" value={redirect} />}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-ink"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-surface border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none transition-all shadow-inner"
                placeholder="name@university.edu"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-ink"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-muted hover:text-ink transition-colors font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full bg-surface border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-[12px] p-3">
                <p className="text-xs text-danger font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-ink text-white font-semibold text-sm rounded-full py-4 mt-2 hover:opacity-90 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Log in
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-2">
            <p className="text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-ink font-bold underline hover:text-accent-green transition-colors underline-offset-2"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
