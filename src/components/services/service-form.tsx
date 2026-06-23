"use client";

import * as React from "react";
import Link from "next/link";
import { Service } from "@/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { SubmitButton } from "@/components/ui/submit-button";

interface ServiceFormProps {
  service?: Service;
  action: (formData: FormData) => Promise<void>;
  error?: string;
}

export default function ServiceForm({ service, action, error }: ServiceFormProps) {
  const isEdit = !!service;
  const [category, setCategory] = React.useState(service?.category || "Web Development");
  const [type, setType] = React.useState<'offered' | 'sought'>(
    service?.type || "offered"
  );

  return (
    <form action={action} className="mt-10 flex flex-col gap-8">
      {isEdit && <input type="hidden" name="id" value={service.id} />}
      <input type="hidden" name="type" value={type} />

      {/* Segment Selector for Offered vs Sought */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink">I want to...</label>
        <div className="flex bg-surface-sunken p-1 rounded-full border border-border w-full max-w-md">
          <button
            type="button"
            onClick={() => setType("offered")}
            className={`flex-1 text-center py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
              type === "offered"
                ? "bg-[#163832] text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Offer a Service (Delivering)
          </button>
          <button
            type="button"
            onClick={() => setType("sought")}
            className={`flex-1 text-center py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
              type === "sought"
                ? "bg-[#163832] text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Request a Service (Seeking)
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          {type === "offered" ? "Service Title" : "What service are you seeking?"}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={service?.title || ""}
          placeholder={type === "offered" 
            ? "e.g. I'll build a responsive React landing page with Tailwind"
            : "e.g. Need a freelance React developer to build our landing page"
          }
          className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
        />
        <p className="text-xs text-muted">
          {type === "offered"
            ? "Describe exactly what you will deliver. Keep it clear and action-oriented."
            : "Describe exactly what help you need. Keep it clear and action-oriented."
          }
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          {type === "offered" ? "Description" : "Service Request Details / Requirements"}
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={service?.description || ""}
          placeholder={type === "offered"
            ? "Describe your service in detail. What is your process? What will the buyer receive?"
            : "Describe the requirements in detail. What are the key skills needed? What is the expected deliverable?"
          }
          className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green min-h-[120px]"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Category
          </label>
          <Combobox
            name="category"
            options={[
              "Web Development",
              "App Development",
              "Design",
              "AI/ML",
              "Content",
              "Marketing",
              "Business"
            ]}
            value={category}
            onChange={setCategory}
            placeholder="Select a category"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="price_inr" className="text-sm font-medium">
            {type === "offered" ? "Price (INR)" : "Max Budget (INR)"}
          </label>
          <input
            id="price_inr"
            name="price_inr"
            type="number"
            min="100"
            required
            defaultValue={service?.price_inr || ""}
            placeholder={type === "offered" ? "2500" : "5000"}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="delivery_days" className="text-sm font-medium">
            {type === "offered" ? "Delivery Time (days)" : "Expected Timeline / Deadline (days)"}
          </label>
          <input
            id="delivery_days"
            name="delivery_days"
            type="number"
            min="1"
            required
            defaultValue={service?.delivery_days || ""}
            placeholder={type === "offered" ? "3" : "7"}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="delivery_label" className="text-sm font-medium">
            {type === "offered" ? "Delivery Description / Note (optional)" : "Deadline Details / Note (optional)"}
          </label>
          <input
            id="delivery_label"
            name="delivery_label"
            type="text"
            defaultValue={service?.delivery_label || ""}
            placeholder={type === "offered"
              ? "e.g. negotiable, 2 rounds of revision"
              : "e.g. flexible deadline, performance bonus if delivered early"
            }
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger font-semibold">{decodeURIComponent(error)}</p>}

      <div className="flex gap-4 items-center">
        <SubmitButton
          loadingText="Saving service..."
          className="px-7 py-3.5 text-base font-semibold"
        >
          {isEdit ? "Save Changes" : "Create Service"}
        </SubmitButton>
        <Link
          href="/dashboard/services"
          className="rounded-full border border-border bg-surface px-7 py-3.5 text-base font-semibold text-ink hover:bg-surface-sunken transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
