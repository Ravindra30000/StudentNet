import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 flex flex-col flex-1 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8 flex flex-col gap-2 shrink-0">
        <div className="h-9 w-48 bg-surface-sunken rounded-lg" />
        <div className="h-4 w-72 bg-surface-sunken rounded-lg mt-1" />
      </div>

      {/* Main layout loading shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Sidebar Skeleton */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-4 lg:pb-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-11 w-32 lg:w-full bg-surface-sunken rounded-full shrink-0"
            />
          ))}
        </div>

        {/* Right Area Card Skeleton */}
        <div className="lg:col-span-9 bg-surface rounded-[28px] p-6 md:p-10 shadow-card border border-border/40 min-h-[460px] flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Themed Circular Loader Rotating Animation */}
            <div className="absolute w-12 h-12 rounded-full border-[3px] border-[#163832]/10" />
            <Loader2 className="w-12 h-12 text-[#163832] animate-spin relative" />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center mt-2">
            <div className="h-4 w-32 bg-surface-sunken rounded" />
            <div className="h-3 w-56 bg-surface-sunken/60 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
