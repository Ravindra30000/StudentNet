"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, X } from "lucide-react";

const PRESET_PRICES = [
  { label: "Any Price", min: null, max: null },
  { label: "Free", min: null, max: "0" },
  { label: "Under ₹500", min: null, max: "500" },
  { label: "Under ₹1,000", min: null, max: "1000" },
  { label: "Under ₹5,000", min: null, max: "5000" },
];

export default function ServicesFiltersToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") ?? "";
  const currentSort = searchParams.get("sort") ?? "relevant";
  const currentMinPrice = searchParams.get("min_price") ?? "";
  const currentMaxPrice = searchParams.get("max_price") ?? "";
  const currentDelivery = searchParams.get("delivery") ?? "any";
  const currentMinRating = searchParams.get("min_rating") ?? "";

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const [prevSearch, setPrevSearch] = useState(currentSearch);
  const [prevMinPrice, setPrevMinPrice] = useState(currentMinPrice);
  const [prevMaxPrice, setPrevMaxPrice] = useState(currentMaxPrice);

  if (currentSearch !== prevSearch) {
    setSearchQuery(currentSearch);
    setPrevSearch(currentSearch);
  }

  if (currentMinPrice !== prevMinPrice) {
    setMinPrice(currentMinPrice);
    setPrevMinPrice(currentMinPrice);
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
      const params = new URLSearchParams();
      const cat = searchParams.get("category");
      const sel = searchParams.get("seller");
      if (cat) params.set("category", cat);
      if (sel) params.set("seller", sel);
      
      const newQuery = params.toString();
      router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
    });
  };

  const isPresetActive = (preset: typeof PRESET_PRICES[0]) => {
    if (preset.min === null && preset.max === null) {
      return !currentMinPrice && !currentMaxPrice;
    }
    return (
      (currentMinPrice === (preset.min || "")) &&
      (currentMaxPrice === (preset.max || ""))
    );
  };

  const hasActiveFilters =
    currentSearch ||
    currentSort !== "relevant" ||
    currentMinPrice ||
    currentMaxPrice ||
    currentDelivery !== "any" ||
    currentMinRating;

  return (
    <div className="w-full flex flex-col gap-6 bg-surface p-6 rounded-3xl border border-border/40 shadow-sm">
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
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink hover:bg-[#163832] text-white font-sans text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Sort select */}
        <div className="relative shrink-0 min-w-[180px]">
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

      {/* Advanced pricing preset chips & custom bounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/30">
        {/* Preset price chips */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-muted font-extrabold uppercase tracking-wider">
            Price Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PRICES.map((preset, idx) => {
              const active = isPresetActive(preset);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    applyFilters({
                      min_price: preset.min,
                      max_price: preset.max,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                    active
                      ? "bg-[#163832] text-white border-[#163832]"
                      : "bg-surface-sunken hover:bg-border/30 text-muted hover:text-ink border-border/40"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom price range */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-muted font-extrabold uppercase tracking-wider">
            Custom Budget Range
          </span>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[11px] font-bold text-muted">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={() => applyFilters({ min_price: minPrice })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyFilters({ min_price: minPrice });
                  }
                }}
                className="w-24 pl-6 pr-3 py-1.5 rounded-lg border border-border bg-surface-sunken font-sans text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-[#163832] focus:border-[#163832]"
              />
            </div>
            <span className="text-muted text-xs font-bold">—</span>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[11px] font-bold text-muted">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => applyFilters({ max_price: maxPrice })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyFilters({ max_price: maxPrice });
                  }
                }}
                className="w-24 pl-6 pr-3 py-1.5 rounded-lg border border-border bg-surface-sunken font-sans text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-[#163832] focus:border-[#163832]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Speed and Star constraints */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/30">
        <div className="flex flex-wrap items-center gap-6">
          {/* Delivery speed selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted font-extrabold uppercase tracking-wider">
              Delivery Speed
            </span>
            <div className="relative min-w-[150px]">
              <select
                value={currentDelivery}
                onChange={(e) => applyFilters({ delivery: e.target.value })}
                className="appearance-none w-full pl-3 pr-8 py-1.5 rounded-lg bg-surface-sunken hover:bg-border/60 font-sans text-xs font-semibold text-ink border border-border outline-none cursor-pointer"
              >
                <option value="any">Anytime</option>
                <option value="1">Express (24 hours)</option>
                <option value="3">Within 3 days</option>
                <option value="7">Within 7 days</option>
                <option value="14">Within 14 days</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/70 w-3 h-3 pointer-events-none" />
            </div>
          </div>

          {/* Rating constraint selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted font-extrabold uppercase tracking-wider">
              Seller Rating
            </span>
            <div className="relative min-w-[150px]">
              <select
                value={currentMinRating}
                onChange={(e) => applyFilters({ min_rating: e.target.value })}
                className="appearance-none w-full pl-3 pr-8 py-1.5 rounded-lg bg-surface-sunken hover:bg-border/60 font-sans text-xs font-semibold text-ink border border-border outline-none cursor-pointer"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5 ★ & up</option>
                <option value="4.0">4.0 ★ & up</option>
                <option value="3.5">3.5 ★ & up</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/70 w-3 h-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clear and Pending status */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-bold text-danger hover:underline cursor-pointer"
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
