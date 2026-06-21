import * as React from "react";
import { Skeleton, SkeletonGrid } from "@/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
      {/* Header Skeleton */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar Category Skeleton */}
        <aside className="lg:col-span-1 border border-border/40 rounded-3xl p-6 bg-surface hidden lg:block space-y-6">
          <Skeleton className="h-5 w-32" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4.5 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </aside>

        {/* Right Columns: Filtering & Service Grid Skeletons */}
        <div className="lg:col-span-3 space-y-6">
          {/* Toolbar Skeleton */}
          <div className="h-14 w-full bg-surface border border-border/40 rounded-2xl flex items-center justify-between px-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>

          {/* Results Info Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4.5 w-24" />
          </div>

          {/* Grid Skeletons */}
          <SkeletonGrid count={6} />
        </div>
      </div>
    </div>
  );
}
