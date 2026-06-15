import Link from "next/link";
import Logo from "@/components/logo";

export default function Footer() {
  return (
    <footer className="w-full bg-surface-sunken py-16 border-t border-border mt-auto">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-4">
        <div className="col-span-1">
          <div className="mb-4 flex items-center">
            <Logo size="lg" />
          </div>
          <p className="text-sm text-muted mb-4">
            © {new Date().getFullYear()} StudentNet. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <Link
            href="/about"
            className="text-muted transition-colors hover:text-ink"
          >
            About Us
          </Link>
          <Link
            href="/careers"
            className="text-muted transition-colors hover:text-ink"
          >
            Careers
          </Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <Link
            href="/privacy"
            className="text-muted transition-colors hover:text-ink"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-muted transition-colors hover:text-ink"
          >
            Terms of Service
          </Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <Link
            href="/help"
            className="text-muted transition-colors hover:text-ink"
          >
            Help Center
          </Link>
          <Link
            href="/contact"
            className="text-muted transition-colors hover:text-ink"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
