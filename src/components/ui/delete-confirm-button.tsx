"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface DeleteConfirmButtonProps {
  formAction: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
}

export default function DeleteConfirmButton({
  formAction,
  confirmMessage,
  children,
  className,
}: DeleteConfirmButtonProps) {
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <InnerButton className={className}>
        {children}
      </InnerButton>
    </form>
  );
}

function InnerButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="flex items-center gap-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          Deleting...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
