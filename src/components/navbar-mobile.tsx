"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  LayoutDashboard,
  User as UserIcon,
  ExternalLink,
  MessageSquare,
  Settings,
  Briefcase,
  Rocket,
  Building,
  Users,
  LogOut,
} from "lucide-react";

import { User } from "@supabase/supabase-js";

interface NavbarMobileProps {
  user: User | null;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export default function NavbarMobile({
  user,
  username,
  fullName,
  avatarUrl,
}: NavbarMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close drawer when path changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  const displayName = fullName || username || "Student";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="md:hidden">
      {/* Hamburger Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-sunken transition-colors text-ink focus:outline-none cursor-pointer"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
      </button>

      {/* Drawer Overlay Menu */}
      {isOpen && (
        <div className="fixed inset-x-0 top-[77px] bottom-0 z-50 flex flex-col bg-surface/95 backdrop-blur-md border-t border-border animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
            {/* Logged In User Summary */}
            {user && (
              <div className="flex items-center gap-3 border-b border-border/40 pb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-green font-heading text-sm font-bold text-white overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink truncate">{displayName}</p>
                  {username && <p className="text-xs text-muted truncate">@{username}</p>}
                </div>
              </div>
            )}

            {/* Main Navigation Links */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Explore</span>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/students"
                  className="flex items-center justify-center rounded-xl bg-background border border-border/40 py-3.5 text-sm font-semibold text-ink hover:bg-surface-sunken transition-colors"
                >
                  Talent
                </Link>
                <Link
                  href="/startups"
                  className="flex items-center justify-center rounded-xl bg-background border border-border/40 py-3.5 text-sm font-semibold text-ink hover:bg-surface-sunken transition-colors"
                >
                  Startups
                </Link>
                <Link
                  href="/communities"
                  className="flex items-center justify-center rounded-xl bg-background border border-border/40 py-3.5 text-sm font-semibold text-ink hover:bg-surface-sunken transition-colors"
                >
                  Communities
                </Link>
                <Link
                  href="/events"
                  className="flex items-center justify-center rounded-xl bg-background border border-border/40 py-3.5 text-sm font-semibold text-ink hover:bg-surface-sunken transition-colors"
                >
                  Events
                </Link>
              </div>
            </div>

            {/* Dashboard / User Workspace Links */}
            {user ? (
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Dashboard & Hub</span>
                <div className="space-y-1 bg-background rounded-2xl p-2 border border-border/40">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <LayoutDashboard className="h-4.5 w-4.5 text-accent-green" />
                    Dashboard Home
                  </Link>

                  <Link
                    href="/dashboard?tab=edit"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <UserIcon className="h-4.5 w-4.5 text-accent-green" />
                    Edit Profile
                  </Link>

                  {username && (
                    <Link
                      href={`/u/${username}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                    >
                      <ExternalLink className="h-4.5 w-4.5 text-accent-green" />
                      View Public Profile
                    </Link>
                  )}

                  <Link
                    href="/dashboard/messages"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <MessageSquare className="h-4.5 w-4.5 text-accent-green" />
                    Messages Inbox
                  </Link>

                  <Link
                    href="/dashboard/services"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <Briefcase className="h-4.5 w-4.5 text-accent-green" />
                    Freelance Services
                  </Link>

                  <Link
                    href="/dashboard/startup"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <Rocket className="h-4.5 w-4.5 text-accent-green" />
                    Startup Workspace
                  </Link>

                  <Link
                    href="/dashboard/team"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <Building className="h-4.5 w-4.5 text-accent-green" />
                    Team & Agency Manager
                  </Link>

                  <Link
                    href="/dashboard/communities"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <Users className="h-4.5 w-4.5 text-accent-green" />
                    Community Panel
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <Settings className="h-4.5 w-4.5 text-accent-green" />
                    Account Settings
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Logged Out / Action CTA Row */}
            {!user ? (
              <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-ink hover:bg-surface-sunken transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white hover:opacity-90 transition-all duration-200"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-border/40">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-danger hover:bg-danger/5 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
