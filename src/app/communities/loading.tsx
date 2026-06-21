import * as React from "react";
import { Skeleton, SkeletonGrid } from "@/components/ui/skeleton";

export default function CommunitiesLoading() {
  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Page Header Skeleton */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-10">
          <div>
            <Skeleton className="h-12 w-64 md:h-14 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>

        {/* Communities Grid Skeleton */}
        <div className="mt-12">
          <SkeletonGrid count={6} />
        </div>
      </div>
    </div>
  );
}
