"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteStartup } from "@/app/dashboard/startup/actions";

export default function DeleteStartupButton({
  startupId,
  startupName,
  compact = false,
}: {
  startupId: string;
  startupName: string;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        `Delete "${startupName}"?\n\nAll open roles and applications will be permanently removed. This cannot be undone.`
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set("startup_id", startupId);
    startTransition(() => deleteStartup(fd));
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title={isPending ? "Deleting…" : "Delete Startup"}
        className="flex items-center justify-center rounded-full border border-danger/40 bg-danger/10 p-2.5 text-danger hover:bg-danger/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Trash2 size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 rounded-full border border-danger/40 bg-danger/10 px-5 py-2.5 text-sm font-bold text-danger hover:bg-danger/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Trash2 size={14} />
      {isPending ? "Deleting…" : "Delete Startup"}
    </button>
  );
}
