"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

      {/* Premium High-Contrast Drawer Overlay Menu */}
      {isOpen && (
        <div className="absolute inset-x-0 top-full h-[calc(100vh-100%)] z-50 flex flex-col bg-accent-green border-t border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex-1 overflow-y-auto p-6 space-y-7 pb-12">
            
            {/* User Profile Card (Frosted Glass Style) */}
            {user && (
              <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 font-heading text-sm font-bold text-accent-gold overflow-hidden border border-white/15">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={displayName} width={48} height={48} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                  {username && <p className="text-xs text-white/60 truncate">@{username}</p>}
                </div>
              </div>
            )}

            {/* Main Navigation Links */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-white/55 uppercase tracking-wider block">Explore Directory</span>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/students"
                  className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:text-accent-gold transition-colors"
                >
                  Talent
                </Link>
                <Link
                  href="/startups"
                  className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:text-accent-gold transition-colors"
                >
                  Startups
                </Link>
                <Link
                  href="/communities"
                  className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:text-accent-gold transition-colors"
                >
                  Communities
                </Link>
                <Link
                  href="/events"
                  className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 py-3.5 text-sm font-semibold text-white hover:bg-white/10 hover:text-accent-gold transition-colors"
                >
                  Events
                </Link>
              </div>
            </div>

            {/* Dashboard / User Workspace Links */}
            {user ? (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-white/55 uppercase tracking-wider block">Builder Hub & Panel</span>
                <div className="space-y-1 bg-black/15 rounded-2xl p-2 border border-white/5">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard className="h-4.5 w-4.5 text-accent-gold" />
                    Dashboard Home
                  </Link>

                  <Link
                    href="/dashboard?tab=edit"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="h-4.5 w-4.5 text-accent-gold" />
                    Edit Profile
                  </Link>

                  {username && (
                    <Link
                      href={`/u/${username}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <ExternalLink className="h-4.5 w-4.5 text-accent-gold" />
                      View Public Profile
                    </Link>
                  )}

                  <Link
                    href="/dashboard/messages"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <MessageSquare className="h-4.5 w-4.5 text-accent-gold" />
                    Messages Inbox
                  </Link>

                  <Link
                    href="/dashboard/services"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Briefcase className="h-4.5 w-4.5 text-accent-gold" />
                    Freelance Services
                  </Link>

                  <Link
                    href="/dashboard/startup"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Rocket className="h-4.5 w-4.5 text-accent-gold" />
                    Startup Workspace
                  </Link>

                  <Link
                    href="/dashboard/team"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Building className="h-4.5 w-4.5 text-accent-gold" />
                    Team & Agency Manager
                  </Link>

                  <Link
                    href="/dashboard/communities"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Users className="h-4.5 w-4.5 text-accent-gold" />
                    Community Panel
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="h-4.5 w-4.5 text-accent-gold" />
                    Account Settings
                  </Link>
                </div>
              </div>
            ) : null}

            {/* CTAs / Bottom Actions */}
            {!user ? (
              <div className="flex flex-col gap-3 pt-5 border-t border-white/10">
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-full border border-white/20 bg-transparent text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex h-11 items-center justify-center rounded-full bg-accent-gold text-sm font-bold text-accent-gold-foreground hover:opacity-90 transition-all duration-200"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/10">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left cursor-pointer"
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
