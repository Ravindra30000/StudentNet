"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, X } from "lucide-react";

export default function ServicesFiltersToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") ?? "";
  const currentSort = searchParams.get("sort") ?? "relevant";
  const currentMaxPrice = searchParams.get("max_price") ?? "";
  const currentDelivery = searchParams.get("delivery") ?? "any";

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const [prevSearch, setPrevSearch] = useState(currentSearch);
  const [prevMaxPrice, setPrevMaxPrice] = useState(currentMaxPrice);

  if (currentSearch !== prevSearch) {
    setSearchQuery(currentSearch);
    setPrevSearch(currentSearch);
  }

  if (currentMaxPrice !== prevMaxPrice) {
    setMaxPrice(currentMaxPrice);
    setPrevMaxPrice(currentMaxPrice);
  }

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset pagination

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "any") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newQuery = params.toString();
    startTransition(() => {
      router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    applyFilters({ q: searchQuery });
  };

  const handleClearAll = () => {
    startTransition(() => {
      // Keep category and seller if already filtered by them
      const params = new URLSearchParams();
      const cat = searchParams.get("category");
      const sel = searchParams.get("seller");
      if (cat) params.set("category", cat);
      if (sel) params.set("seller", sel);
      
      const newQuery = params.toString();
      router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
    });
  };

  const hasActiveFilters =
    currentSearch ||
    currentSort !== "relevant" ||
    currentMaxPrice ||
    currentDelivery !== "any";

  return (
    <div className="w-full flex flex-col gap-4 bg-surface p-6 rounded-2xl border border-border/40 shadow-sm">
      {/* Top Search bar */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4.5 h-4.5 transition-colors group-focus-within:text-accent-green" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services (e.g. 'landing page', 'figma')..."
            className="w-full pl-11 pr-20 py-2.5 rounded-full border border-border bg-surface-sunken font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink hover:bg-accent-green text-white font-sans text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Sort select */}
        <div className="relative shrink-0 min-w-[160px]">
          <select
            value={currentSort}
            onChange={(e) => applyFilters({ sort: e.target.value })}
            className="appearance-none w-full pl-4 pr-10 py-2.5 rounded-full bg-surface-sunken hover:bg-border/60 font-sans text-sm font-semibold text-ink border border-border outline-none transition-colors cursor-pointer"
          >
            <option value="relevant">Most Relevant</option>
            <option value="top_rated">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/70 w-4 h-4 pointer-events-none" />
        </div>
      </div>

      {/* Bottom filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-4">
          {/* Price Range limit */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-semibold">Max Price:</span>
            <input
              type="number"
              placeholder="Budget (₹)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => applyFilters({ max_price: maxPrice })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilters({ max_price: maxPrice });
                }
              }}
              className="w-24 px-3 py-1.5 rounded-lg border border-border bg-surface-sunken font-sans text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green"
            />
          </div>

          {/* Delivery speed selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-semibold">Delivery:</span>
            <div className="relative">
              <select
                value={currentDelivery}
                onChange={(e) => applyFilters({ delivery: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-surface-sunken hover:bg-border/60 font-sans text-xs font-semibold text-ink border border-border outline-none cursor-pointer"
              >
                <option value="any">Anytime</option>
                <option value="3">Within 3 days</option>
                <option value="7">Within 7 days</option>
                <option value="14">Within 14 days</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/70 w-3 h-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clear and Pending tags */}
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs font-bold text-danger hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}

          {isPending && (
            <span className="text-xs text-muted font-medium animate-pulse">
              Filtering...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
