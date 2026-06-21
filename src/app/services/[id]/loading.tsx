import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceDetailLoading() {
  return (
    <div className="bg-background min-h-screen py-12">
      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Back Link Skeleton */}
        <div className="col-span-12">
          <Skeleton className="h-5 w-44" />
        </div>

        {/* Left Column (Details) Skeleton */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
          </div>

          {/* Owner Card Skeleton */}
          <div className="flex items-center gap-4 border-t border-b border-border/30 py-6">
            <Skeleton className="w-14 h-14 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Reviews List Skeleton */}
          <div className="flex flex-col gap-4 mt-6">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-border/40 rounded-2xl p-5 bg-surface space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3.5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Card) Skeleton */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface border border-border/40 rounded-3xl p-6 shadow-card space-y-6">
            <div className="flex justify-between items-baseline">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-4.5 w-36" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-4.5 w-44" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
