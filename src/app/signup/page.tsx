import Link from "next/link";
import { signup } from "./actions";
import Logo from "@/components/logo";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check_email?: string }>;
}) {
  const { error, check_email } = await searchParams;

  if (check_email) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20 bg-background">
        <div className="w-full max-w-[440px] flex flex-col gap-8 text-center bg-surface p-8 sm:p-10 rounded-[28px] shadow-card border border-border/40">
          <div className="flex justify-center">
            <Logo size="xl" />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-bold text-ink">
              Check your inbox
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              We&apos;ve sent you a confirmation link. Click it to activate your
              account, then log in to start building.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-[440px] flex flex-col gap-8 bg-surface p-8 sm:p-10 rounded-[28px] shadow-card border border-border/40">
        <header className="flex flex-col items-center text-center gap-4">
          <div className="flex justify-center">
            <Logo size="xl" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-bold text-ink">
              Create your profile
            </h1>
            <p className="text-sm text-muted">
              Join the network of students building careers before graduation.
            </p>
          </div>
        </header>

        <form action={signup} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-ink ml-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="bg-surface border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none transition-all"
                placeholder="name@university.edu"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-ink ml-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="bg-surface border border-border/80 rounded-[16px] px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none transition-all"
                placeholder="••••••••"
              />
              <p className="text-xs text-muted ml-1">At least 6 characters</p>
            </div>
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
            className="w-full bg-ink text-white rounded-full py-4 text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.98] cursor-pointer"
          >
            Sign up
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-border"></div>
          <span className="text-xs text-muted font-medium">or</span>
          <div className="flex-1 h-[1px] bg-border"></div>
        </div>

        <button
          type="button"
          disabled
          className="w-full border border-border rounded-full py-4 text-sm font-semibold text-muted flex items-center justify-center gap-2 hover:bg-surface-sunken transition-colors opacity-50 cursor-not-allowed"
        >
          <svg
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            ></path>
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            ></path>
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            ></path>
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            ></path>
          </svg>
          <span>Continue with Google</span>
        </button>

        <footer className="text-center mt-2">
          <p className="text-sm text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-ink underline underline-offset-2 hover:text-accent-green transition-colors"
            >
              Log in
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
