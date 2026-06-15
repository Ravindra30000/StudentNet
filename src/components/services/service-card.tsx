"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Service, Profile } from "@/lib/types";
import { toggleServiceActive, deleteService } from "@/app/dashboard/services/actions";
import { Edit2, Play, Pause, Trash2 } from "lucide-react";

interface ServiceCardProps {
  service: Service & { profiles?: Profile | null };
  isOwner: boolean;
}

export default function ServiceCard({ service, isOwner }: ServiceCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleServiceActive(service.id, service.is_active);
      } catch {
        alert("Failed to update service status.");
      }
    });
  };

  const categoryColors: Record<string, string> = {
    "Web Development": "bg-accent-green/10 text-accent-green",
    "App Development": "bg-success/10 text-success",
    "Design": "bg-amber-100 text-amber-800",
    "Content": "bg-blue-100 text-blue-800",
    "Marketing": "bg-purple-100 text-purple-800",
    "AI/ML": "bg-rose-100 text-rose-800",
    "Business": "bg-indigo-100 text-indigo-800",
  };

  const categoryColor = categoryColors[service.category] || "bg-surface-sunken text-muted";

  return (
    <article className="glass-card p-6 md:p-8 flex flex-col gap-4 bg-surface rounded-xl shadow-card relative hover:shadow-card-hover transition-all duration-300">
      <div className="flex justify-between items-start">
        <span className={`font-label-sm text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${categoryColor}`}>
          {service.category}
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${service.is_active ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>
          <div className={`w-2 h-2 rounded-full ${service.is_active ? 'bg-success' : 'bg-muted'}`}></div>
          <span className="font-label-sm text-xs font-semibold">{service.is_active ? 'Active' : 'Paused'}</span>
        </div>
      </div>

      <div>
        <h4 className="font-heading text-lg font-bold text-ink leading-tight mb-2">
          {service.title}
        </h4>
        <p className="font-sans text-sm text-muted line-clamp-3">
          {service.description || "No description provided."}
        </p>
      </div>

      <div className="flex items-center gap-4 mt-2 py-4 border-y border-border/50">
        <div>
          <p className="font-sans text-xs text-muted">Starting at</p>
          <p className="font-heading text-lg font-bold text-ink">₹{service.price_inr.toLocaleString()}</p>
        </div>
        <div className="h-8 w-px bg-border/50"></div>
        <div>
          <p className="font-sans text-xs text-muted">Delivery</p>
          <p className="font-sans text-sm font-semibold text-ink">{service.delivery_days} {service.delivery_days === 1 ? 'day' : 'days'}</p>
        </div>
      </div>

      {isOwner ? (
        <div className="flex gap-3 mt-auto pt-2">
          <Link
            href={`/dashboard/services/${service.id}/edit`}
            className="flex-1 text-center bg-surface border border-border text-ink font-semibold text-xs py-2.5 rounded-full hover:bg-surface-sunken transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit2 size={14} /> Edit
          </Link>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="flex-1 bg-surface border border-border text-ink font-semibold text-xs py-2.5 rounded-full hover:bg-surface-sunken transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {service.is_active ? (
              <>
                <Pause size={14} /> Pause
              </>
            ) : (
              <>
                <Play size={14} /> Activate
              </>
            )}
          </button>
          <form
            action={deleteService}
            onSubmit={(e) => {
              if (!confirm("Are you sure you want to delete this service?")) {
                e.preventDefault();
              }
            }}
            className="flex"
          >
            <input type="hidden" name="id" value={service.id} />
            <button
              type="submit"
              className="p-2.5 rounded-full border border-border text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors"
              title="Delete Service"
            >
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3 mt-auto pt-2">
          <Link
            href={`/services/${service.id}`}
            className="flex-1 text-center bg-ink text-white font-semibold text-xs py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            View Details
          </Link>
        </div>
      )}
    </article>
  );
}
