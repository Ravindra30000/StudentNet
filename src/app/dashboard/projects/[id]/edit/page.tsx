import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProject } from "../../../actions";
import ProjectCoverUpload from "@/components/profile/project-cover-upload";
import ProjectImagesUpload from "@/components/profile/project-images-upload";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!project) redirect("/dashboard");

  const techStackString = Array.isArray(project.tech_stack)
    ? project.tech_stack.join(", ")
    : "";

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

      <h1 className="text-4xl font-semibold tracking-tight mt-6">Edit project</h1>
      <p className="mt-3 text-muted">Update your project showpiece.</p>

      <form action={updateProject} className="mt-10 flex flex-col gap-8">
        <input type="hidden" name="id" value={project.id} />

        <Field
          label="Title"
          name="title"
          required
          placeholder="AI Resume Builder"
          defaultValue={project.title}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="What does it do, what problem does it solve, what was your role?"
            defaultValue={project.description ?? ""}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        <Field
          label="Tech stack"
          name="tech_stack"
          placeholder="React, Supabase, Tailwind (comma separated)"
          defaultValue={techStackString}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Live demo URL"
            name="demo_url"
            placeholder="https://..."
            defaultValue={project.demo_url ?? ""}
          />
          <Field
            label="GitHub URL"
            name="github_url"
            placeholder="https://github.com/..."
            defaultValue={project.github_url ?? ""}
          />
        </div>

        <hr className="border-border/40 my-2" />

        {/* Media Uploads */}
        <ProjectCoverUpload defaultValue={project.cover_image_url} />
        <ProjectImagesUpload defaultValues={project.project_images} />

        {error && <p className="text-sm text-red-600 font-semibold">{decodeURIComponent(error)}</p>}

        <SubmitButton
          loadingText="Saving changes..."
          className="w-fit px-7 py-3.5 text-base font-semibold mt-4 shadow-sm"
        >
          Save changes
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
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
      />
    </div>
  );
}
