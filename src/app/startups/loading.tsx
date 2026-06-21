import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StartupsLoading() {
  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-6 pt-32">
        {/* Header Section Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <Skeleton className="h-12 w-96 mb-2" />
            <Skeleton className="h-5 w-120" />
          </div>
          <Skeleton className="h-12 w-48 rounded-full" />
        </div>

        {/* Filter bar Skeleton */}
        <div className="h-16 w-full bg-surface border border-border/40 rounded-3xl mb-8 flex items-center justify-between px-6">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>

        {/* Startups Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border/40 rounded-3xl p-6 md:p-8 shadow-card flex flex-col gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
