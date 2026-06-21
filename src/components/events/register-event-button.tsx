"use client";

import { useTransition, useOptimistic, useEffect, useState } from "react";
import { registerForEvent, unregisterFromEvent } from "@/app/events/actions";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EventAttendeeCount({
  initialCount,
  eventId,
}: {
  initialCount: number;
  eventId: string;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.eventId === eventId) {
        setCount((prev) => prev + customEvent.detail.increment);
      }
    };

    window.addEventListener("event-registration-updated", handleUpdate);
    return () => {
      window.removeEventListener("event-registration-updated", handleUpdate);
    };
  }, [eventId]);

  return <>{count}</>;
}

export default function RegisterEventButton({
  eventId,
  initialIsRegistered,
  eventTitle,
}: {
  eventId: string;
  initialIsRegistered: boolean;
  eventTitle: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isRegistered, toggleRegistered] = useOptimistic(
    initialIsRegistered,
    (state) => !state
  );

  const handleClick = () => {
    startTransition(async () => {
      toggleRegistered({});
      window.dispatchEvent(
        new CustomEvent("event-registration-updated", {
          detail: { eventId, increment: !isRegistered ? 1 : -1 },
        })
      );

      try {
        if (!isRegistered) {
          await registerForEvent(eventId);
          toast.success(`Registered for ${eventTitle}!`);
        } else {
          await unregisterFromEvent(eventId);
          toast.success(`Registration cancelled for ${eventTitle}.`);
        }
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "Failed to update registration.");
        window.dispatchEvent(
          new CustomEvent("event-registration-updated", {
            detail: { eventId, increment: !isRegistered ? -1 : 1 },
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
      className={`w-full inline-flex justify-center items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-60 ${
        isRegistered
          ? "bg-[#14151A] text-white hover:opacity-90 active:scale-95"
          : "bg-[#163832] text-white hover:bg-[#1e4d42] active:bg-[#0f2420] active:scale-95"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRegistered ? (
        <Check className="h-4 w-4" />
      ) : null}
      {isRegistered ? "Cancel Registration" : "Register for Event"}
    </button>
  );
}
