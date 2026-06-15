"use client";

import { deleteProject } from "@/app/dashboard/actions";

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
      <button type="submit" className="text-xs font-bold uppercase tracking-wider text-muted hover:text-danger hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        Remove
      </button>
    </form>
  );
}
