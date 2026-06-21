"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  loadingText?: string;
  loading?: boolean;
}

export function SubmitButton({
  children,
  loadingText,
  className,
  variant = "primary",
  disabled,
  loading,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = pending || !!loading;

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={isPending || disabled}
      className={className}
      {...props}
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          {loadingText || children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
