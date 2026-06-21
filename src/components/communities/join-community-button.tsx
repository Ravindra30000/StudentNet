"use client";

import { useTransition, useOptimistic, useEffect, useState } from "react";
import { joinCommunity, leaveCommunity } from "@/app/dashboard/communities/actions";
import { Check, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export function CommunityMemberCount({
  initialCount,
  communityId,
}: {
  initialCount: number;
  communityId: string;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.communityId === communityId) {
        setCount((prev) => prev + customEvent.detail.increment);
      }
    };

    window.addEventListener("community-membership-updated", handleUpdate);
    return () => {
      window.removeEventListener("community-membership-updated", handleUpdate);
    };
  }, [communityId]);

  return (
    <span className="flex items-center gap-1.5">
      <Users className="h-4 w-4" />
      {count} {count === 1 ? "member" : "members"}
    </span>
  );
}

export default function JoinCommunityButton({
  communityId,
  initialIsJoined,
  communityName,
}: {
  communityId: string;
  initialIsJoined: boolean;
  communityName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isJoined, toggleJoined] = useOptimistic(
    initialIsJoined,
    (state) => !state
  );

  const handleClick = () => {
    startTransition(async () => {
      toggleJoined({});
      window.dispatchEvent(
        new CustomEvent("community-membership-updated", {
          detail: { communityId, increment: !isJoined ? 1 : -1 },
        })
      );

      try {
        if (!isJoined) {
          await joinCommunity(communityId);
          toast.success(`Joined ${communityName}!`);
        } else {
          await leaveCommunity(communityId);
          toast.success(`Left ${communityName}.`);
        }
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "Failed to update membership.");
        window.dispatchEvent(
          new CustomEvent("community-membership-updated", {
            detail: { communityId, increment: !isJoined ? -1 : 1 },
          })
        );
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-60 ${
        isJoined
          ? "bg-surface/10 text-surface hover:bg-surface/20 border border-surface/25 active:scale-95"
          : "bg-[#F5B83D] text-[#14151A] hover:bg-[#e8a82a] active:bg-[#d49920] active:scale-95"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isJoined ? (
        <Check className="h-4 w-4" />
      ) : null}
      {isJoined ? "Joined Community" : "Join Community"}
    </button>
  );
}
