"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { deleteProject } from "@/app/dashboard/actions";
import { Loader2 } from "lucide-react";

interface DeleteProjectFormProps {
  id: string;
}

export default function DeleteProjectForm({ id }: DeleteProjectFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    if (!confirm("Are you sure you want to remove this project?")) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteProject} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <DeleteButton />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs font-bold uppercase tracking-wider text-muted hover:text-danger hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center gap-1"
    >
      {pending && <Loader2 className="h-3 w-3 animate-spin" />}
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}
