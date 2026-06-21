import { addProject } from "../../actions";
import ProjectCoverUpload from "@/components/profile/project-cover-upload";
import ProjectImagesUpload from "@/components/profile/project-images-upload";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-20">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-muted hover:text-ink transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-4xl font-semibold tracking-tight mt-6">Add a project</h1>
      <p className="mt-3 text-muted">
        Show what you&apos;ve built. Projects appear on your public profile.
      </p>

      <form action={addProject} className="mt-10 flex flex-col gap-8">
        <Field label="Title" name="title" required placeholder="AI Resume Builder" />

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="What does it do, what problem does it solve, what was your role?"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        <Field
          label="Tech stack"
          name="tech_stack"
          placeholder="React, Supabase, Tailwind (comma separated)"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Live demo URL" name="demo_url" placeholder="https://..." />
          <Field label="GitHub URL" name="github_url" placeholder="https://github.com/..." />
        </div>

        <hr className="border-border/40 my-2" />

        {/* Media Uploads */}
        <ProjectCoverUpload />
        <ProjectImagesUpload />

        {error && <p className="text-sm text-red-600 font-semibold">{decodeURIComponent(error)}</p>}

        <SubmitButton
          loadingText="Adding project..."
          className="w-fit px-7 py-3.5 text-base font-semibold mt-4 shadow-sm"
        >
          Add project
        </SubmitButton>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
      />
    </div>
  );
}
