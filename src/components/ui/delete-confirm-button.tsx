"use client";

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
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
