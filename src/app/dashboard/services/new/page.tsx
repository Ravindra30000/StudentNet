import Link from "next/link";
import { createService } from "../actions";
import ServiceForm from "@/components/services/service-form";

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

      <h1 className="text-4xl font-semibold tracking-tight mt-6 font-heading">Create a service</h1>
      <p className="mt-3 text-muted">
        Offer your talent to college students and startup founders on StudentNet.
      </p>

      <ServiceForm action={createService} error={error} />
    </div>
  );
}
