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

  return (
    <form action={action} className="mt-10 flex flex-col gap-8">
      {isEdit && <input type="hidden" name="id" value={service.id} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Service Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={service?.title || ""}
          placeholder="e.g. I'll build a responsive React landing page with Tailwind"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
        />
        <p className="text-xs text-muted">Describe exactly what you will deliver. Keep it clear and action-oriented.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={service?.description || ""}
          placeholder="Describe your service in detail. What is your process? What will the buyer receive?"
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
            Price (INR)
          </label>
          <input
            id="price_inr"
            name="price_inr"
            type="number"
            min="100"
            required
            defaultValue={service?.price_inr || ""}
            placeholder="2500"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="delivery_days" className="text-sm font-medium">
            Delivery Time (days)
          </label>
          <input
            id="delivery_days"
            name="delivery_days"
            type="number"
            min="1"
            required
            defaultValue={service?.delivery_days || ""}
            placeholder="3"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="delivery_label" className="text-sm font-medium">
            Delivery Description / Note (optional)
          </label>
          <input
            id="delivery_label"
            name="delivery_label"
            type="text"
            defaultValue={service?.delivery_label || ""}
            placeholder="e.g. negotiable, 2 rounds of revision"
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
