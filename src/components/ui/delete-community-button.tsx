"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCommunity } from "@/app/dashboard/communities/actions";

export default function DeleteCommunityButton({
  communityId,
  communityName,
}: {
  communityId: string;
  communityName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        `Delete "${communityName}"?\n\nAll posts and members will be permanently removed. This cannot be undone.`
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set("community_id", communityId);
    startTransition(() => deleteCommunity(fd));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-xs font-bold text-danger hover:bg-danger/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Trash2 size={13} />
      {isPending ? "Deleting…" : "Delete Community"}
    </button>
  );
}
