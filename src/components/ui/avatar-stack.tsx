import React from "react";

export interface AvatarStackMember {
  avatar_url?: string | null;
  full_name?: string | null;
  username?: string | null;
}

interface AvatarStackProps {
  members: AvatarStackMember[];
  totalCount: number;
}

export default function AvatarStack({ members, totalCount }: AvatarStackProps) {
  // Show up to 3 members
  const displayMembers = members.slice(0, 3);
  
  return (
    <div className="flex items-center gap-2">
      {displayMembers.length > 0 && (
        <div className="flex -space-x-2.5 overflow-hidden">
          {displayMembers.map((member, index) => {
            const initials = (member.full_name || member.username || "U")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const colors = [
              "bg-red-100 text-red-700",
              "bg-orange-100 text-orange-700",
              "bg-emerald-100 text-emerald-700",
              "bg-teal-100 text-teal-700",
              "bg-cyan-100 text-cyan-700",
              "bg-sky-100 text-sky-700",
              "bg-amber-100 text-amber-700",
            ];
            const sum = (member.full_name || member.username || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const colorClass = colors[Math.abs(sum) % colors.length];

            return (
              <div
                key={index}
                className="relative inline-block"
              >
                {member.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={member.avatar_url}
                    alt={member.full_name || "Member avatar"}
                    className="w-6 h-6 rounded-full object-cover border-2 border-surface shrink-0 ring-1 ring-border/10"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-extrabold shrink-0 ${colorClass}`}>
                    {initials}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <span className="text-xs text-muted font-sans font-medium">
        {totalCount} {totalCount === 1 ? "member" : "members"}
      </span>
    </div>
  );
}
