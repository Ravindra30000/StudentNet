"use client";

import { useState } from "react";
import type { StartupRole } from "@/lib/types";
import ApplyModal from "./apply-modal";

interface RoleListProps {
  roles: StartupRole[];
  startupName: string;
  redirectSlug: string;
  founderId: string;
  userId: string | null;
  hasAppliedMap: Record<string, boolean>;
}

export default function RoleList({
  roles,
  startupName,
  redirectSlug,
  founderId,
  userId,
  hasAppliedMap,
}: RoleListProps) {
  const [selectedRole, setSelectedRole] = useState<StartupRole | null>(null);

  const isFounder = userId === founderId;

  return (
    <div className="flex flex-col gap-6">
      {roles.map((role) => {
        const hasApplied = hasAppliedMap[role.id] || false;

        return (
          <div
            key={role.id}
            className="bg-surface-secondary border border-border/40 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:border-border/80 transition-colors"
          >
            <div className="flex-1">
              <h4 className="font-heading text-lg font-bold text-ink">{role.title}</h4>
              <div className="flex flex-wrap items-center gap-2.5 mt-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-ink/5 text-ink">
                  {role.commitment}
                </span>
                {role.equity_offered && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-accent-green/10 text-accent-green">
                    {role.equity_offered} equity
                  </span>
                )}
              </div>

              {role.skills_required && role.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {role.skills_required.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-medium px-2.5 py-0.5 bg-surface border border-border/40 text-muted rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              {isFounder ? (
                <span className="text-xs font-semibold text-muted bg-surface border border-border px-4 py-2 rounded-full inline-block">
                  You are the founder
                </span>
              ) : !userId ? (
                <a
                  href="/login"
                  className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity block text-center"
                >
                  Log in to apply
                </a>
              ) : hasApplied ? (
                <span className="text-xs font-bold text-success bg-success/10 border border-success/20 px-4 py-2.5 rounded-full inline-block">
                  ✓ Applied
                </span>
              ) : (
                <button
                  onClick={() => setSelectedRole(role)}
                  className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:bg-accent-green transition-all shadow-sm cursor-pointer"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        );
      })}

      {selectedRole && (
        <ApplyModal
          roleId={selectedRole.id}
          roleTitle={selectedRole.title}
          startupName={startupName}
          redirectSlug={redirectSlug}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </div>
  );
}
