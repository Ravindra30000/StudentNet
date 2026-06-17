"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronDown,
  User,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Briefcase,
  Rocket,
  Building,
  Users,
  Settings,
  ExternalLink,
} from "lucide-react";

interface NavbarUserMenuProps {
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export default function NavbarUserMenu({
  username,
  fullName,
  avatarUrl,
}: NavbarUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface hover:bg-surface-sunken p-1.5 pr-3 transition-colors text-ink focus:outline-none cursor-pointer"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-green font-heading text-xs font-bold text-white overflow-hidden">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={32} height={32} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="text-xs font-bold text-ink max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-60 origin-top-right rounded-2xl bg-surface p-2 shadow-pop border border-border/80 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-border/40 mb-1.5">
            <p className="text-xs font-bold text-ink truncate">{displayName}</p>
            {username && <p className="text-[10px] text-muted truncate">@{username}</p>}
          </div>

          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-accent-green" />
              Dashboard Home
            </Link>

            <Link
              href="/dashboard?tab=edit"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <User className="h-4 w-4 text-accent-green" />
              Edit Profile
            </Link>

            {username && (
              <Link
                href={`/u/${username}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-accent-green" />
                My Profile
              </Link>
            )}

            <Link
              href="/dashboard/messages"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-accent-green" />
              Messages Inbox
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <Settings className="h-4 w-4 text-accent-green" />
              Settings
            </Link>
          </div>

          <div className="my-1.5 border-t border-border/40" />

          <div className="px-3 py-1 mb-1">
            <span className="text-[9px] font-bold text-accent-green uppercase tracking-wider">Builder Hub</span>
          </div>

          <div className="space-y-0.5">
            <Link
              href="/dashboard/services"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <Briefcase className="h-4 w-4 text-accent-green" />
              Freelance Services
            </Link>

            <Link
              href="/dashboard/startup"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <Rocket className="h-4 w-4 text-accent-green" />
              Startup Workspace
            </Link>

            <Link
              href="/dashboard/team"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <Building className="h-4 w-4 text-accent-green" />
              Team / Agency Manager
            </Link>

            <Link
              href="/dashboard/communities"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <Users className="h-4 w-4 text-accent-green" />
              Community Panel
            </Link>
          </div>

          <div className="my-1.5 border-t border-border/40" />

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5 transition-colors text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
