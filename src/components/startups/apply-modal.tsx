"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { applyToRole } from "@/app/dashboard/startup/actions";

interface ApplyModalProps {
  roleId: string;
  roleTitle: string;
  startupName: string;
  redirectSlug: string;
  onClose: () => void;
}

export default function ApplyModal({
  roleId,
  roleTitle,
  startupName,
  redirectSlug,
  onClose,
}: ApplyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-lg rounded-3xl border border-border/50 shadow-pop p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full border border-border text-muted hover:bg-surface-sunken transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-green bg-accent-green/10 px-2.5 py-1 rounded-full">
            Role Application
          </span>
          <h3 className="font-heading text-2xl font-extrabold text-ink mt-3">
            Apply to {roleTitle}
          </h3>
          <p className="text-xs text-muted mt-1">
            at {startupName}
          </p>
        </div>

        {/* Form */}
        <form
          action={async (formData) => {
            setIsSubmitting(true);
            try {
              await applyToRole(formData);
            } catch (err) {
              console.error(err);
            } finally {
              setIsSubmitting(false);
              onClose();
            }
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="role_id" value={roleId} />
          <input type="hidden" name="redirect_slug" value={redirectSlug} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Why are you a good fit?
            </label>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Highlight your skills, background, and why you are excited to build with this startup..."
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent text-ink"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold hover:bg-surface-sunken text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
