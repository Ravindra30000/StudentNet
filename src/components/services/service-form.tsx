import Link from "next/link";
import { Service } from "@/lib/types";

interface ServiceFormProps {
  service?: Service;
  action: (formData: FormData) => Promise<void>;
  error?: string;
}

export default function ServiceForm({ service, action, error }: ServiceFormProps) {
  const isEdit = !!service;

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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={service?.category || "Web Development"}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent-green"
          >
            <option value="Web Development">Web Development</option>
            <option value="App Development">App Development</option>
            <option value="Design">Design</option>
            <option value="AI/ML">AI/ML</option>
            <option value="Content">Content</option>
            <option value="Marketing">Marketing</option>
            <option value="Business">Business</option>
          </select>
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
      </div>

      {error && <p className="text-sm text-danger font-semibold">{decodeURIComponent(error)}</p>}

      <div className="flex gap-4 items-center">
        <button
          type="submit"
          className="rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 shadow-sm cursor-pointer"
        >
          {isEdit ? "Save Changes" : "Save Changes"}
        </button>
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
