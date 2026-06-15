"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

interface StartupFiltersProps {
  industries: string[];
}

export default function StartupFilters({ industries }: StartupFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const currentIndustry = searchParams.get("industry") ?? "";
  const currentStage = searchParams.get("stage") ?? "";
  const currentCommitment = searchParams.get("commitment") ?? "";

  const [search, setSearch] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  if (currentSearch !== prevSearch) {
    setSearch(currentSearch);
    setPrevSearch(currentSearch);
  }

  const applyFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newQuery = params.toString();
    startTransition(() => {
      router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
    });
  }, [searchParams, pathname, router]);

  // Debounce effect for search term
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== currentSearch) {
        applyFilters({ search });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentSearch, applyFilters]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    applyFilters({ search });
  };

  return (
    <div className="bg-surface border border-border/40 rounded-2xl p-5 mb-8 shadow-sm">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search Input */}
        <div className="relative md:col-span-1">
          <Search className="absolute left-3.5 top-3.5 text-muted" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas, names..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-surface-sunken text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent text-ink"
          />
        </div>

        {/* Industry Filter */}
        <div className="relative">
          <select
            value={currentIndustry}
            onChange={(e) => applyFilters({ industry: e.target.value })}
            className="w-full px-4 py-2.5 rounded-full border border-border bg-surface-sunken text-sm outline-none focus:border-accent text-ink appearance-none cursor-pointer"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Stage Filter */}
        <div className="relative">
          <select
            value={currentStage}
            onChange={(e) => applyFilters({ stage: e.target.value })}
            className="w-full px-4 py-2.5 rounded-full border border-border bg-surface-sunken text-sm outline-none focus:border-accent text-ink appearance-none cursor-pointer"
          >
            <option value="">All Stages</option>
            <option value="Idea">Idea Stage</option>
            <option value="MVP">MVP Stage</option>
            <option value="Funded">Funded</option>
          </select>
        </div>

        {/* Commitment Filter */}
        <div className="flex items-center gap-2">
          <select
            value={currentCommitment}
            onChange={(e) => applyFilters({ commitment: e.target.value })}
            className="flex-1 px-4 py-2.5 rounded-full border border-border bg-surface-sunken text-sm outline-none focus:border-accent text-ink appearance-none cursor-pointer"
          >
            <option value="">Any Commitment</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
          </select>

          {isPending && (
            <div className="text-xs text-muted font-medium ml-1 animate-pulse">
              ...
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
