import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateService } from "../../actions";
import ServiceForm from "@/components/services/service-form";
import Link from "next/link";

export default async function EditServicePage({
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

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!service) redirect("/dashboard/services");

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-20">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/services"
          className="text-sm font-semibold text-muted hover:text-ink transition-colors"
        >
          ← Back to Services Hub
        </Link>
      </div>

      <h1 className="text-4xl font-semibold tracking-tight mt-6 font-heading">Edit service</h1>
      <p className="mt-3 text-muted">Update details of your freelance service offering.</p>

      <ServiceForm service={service} action={updateService} error={error} />
    </div>
  );
}
