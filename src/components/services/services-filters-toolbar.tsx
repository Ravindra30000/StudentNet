"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

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
  const currentType = searchParams.get("type") ?? "";

  const getInitialDeliveryLabel = (val: string) => {
    if (!val || val === "any") return "Anytime";
    if (val === "1") return "1 day (Express)";
    if (val === "3") return "3 days";
    if (val === "7") return "7 days";
    if (val === "14") return "14 days";
    if (val === "30") return "30 days";
    const parsed = parseInt(val);
    return isNaN(parsed) ? "Anytime" : `${val} days`;
  };

  const getInitialRatingLabel = (val: string) => {
    if (!val || val === "any") return "Any Rating";
    if (val === "5.0" || val === "5") return "5.0 ★";
    if (val === "4.5") return "4.5 ★ & up";
    if (val === "4.0") return "4.0 ★ & up";
    if (val === "3.5") return "3.5 ★ & up";
    if (val === "3.0") return "3.0 ★ & up";
    const parsed = parseFloat(val);
    return isNaN(parsed) ? "Any Rating" : `${val} ★`;
  };

  // Staged filter state
  const [stagedQ, setStagedQ] = useState(currentSearch);
  const [stagedSort, setStagedSort] = useState(currentSort);
  const [stagedMinPrice, setStagedMinPrice] = useState(currentMinPrice);
  const [stagedMaxPrice, setStagedMaxPrice] = useState(currentMaxPrice);
  const [stagedDelivery, setStagedDelivery] = useState(() => getInitialDeliveryLabel(currentDelivery));
  const [stagedMinRating, setStagedMinRating] = useState(() => getInitialRatingLabel(currentMinRating));
  const [stagedType, setStagedType] = useState(currentType);

  const [prevSearch, setPrevSearch] = useState(currentSearch);
  const [prevMinPrice, setPrevMinPrice] = useState(currentMinPrice);
  const [prevMaxPrice, setPrevMaxPrice] = useState(currentMaxPrice);
  const [prevDelivery, setPrevDelivery] = useState(currentDelivery);
  const [prevMinRating, setPrevMinRating] = useState(currentMinRating);
  const [prevType, setPrevType] = useState(currentType);
  const [prevSort, setPrevSort] = useState(currentSort);

  // Sync state if URL changes externally (like clear all)
  if (currentSearch !== prevSearch) {
    setStagedQ(currentSearch);
    setPrevSearch(currentSearch);
  }
  if (currentMinPrice !== prevMinPrice) {
    setStagedMinPrice(currentMinPrice);
    setPrevMinPrice(currentMinPrice);
  }
  if (currentMaxPrice !== prevMaxPrice) {
    setStagedMaxPrice(currentMaxPrice);
    setPrevMaxPrice(currentMaxPrice);
  }
  if (currentDelivery !== prevDelivery) {
    setStagedDelivery(getInitialDeliveryLabel(currentDelivery));
    setPrevDelivery(currentDelivery);
  }
  if (currentMinRating !== prevMinRating) {
    setStagedMinRating(getInitialRatingLabel(currentMinRating));
    setPrevMinRating(currentMinRating);
  }
  if (currentType !== prevType) {
    setStagedType(currentType);
    setPrevType(currentType);
  }
  if (currentSort !== prevSort) {
    setStagedSort(currentSort);
    setPrevSort(currentSort);
  }

  const handleApply = () => {
    // Parse delivery speed
    let deliveryVal = stagedDelivery;
    if (deliveryVal === "Anytime" || deliveryVal === "") {
      deliveryVal = "any";
    } else if (deliveryVal.toLowerCase().includes("1 day")) {
      deliveryVal = "1";
    } else {
      const parsed = parseInt(deliveryVal);
      deliveryVal = isNaN(parsed) ? "any" : parsed.toString();
    }

    // Parse seller rating
    let ratingVal = stagedMinRating;
    if (ratingVal === "Any Rating" || ratingVal === "") {
      ratingVal = "";
    } else {
      const parsed = parseFloat(ratingVal);
      ratingVal = isNaN(parsed) ? "" : parsed.toString();
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset pagination

    const updates = {
      q: stagedQ.trim(),
      sort: stagedSort,
      min_price: stagedMinPrice,
      max_price: stagedMaxPrice,
      delivery: deliveryVal,
      min_rating: ratingVal,
      type: stagedType || null,
    };

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
    handleApply();
  };

  const handleClearAll = () => {
    setStagedQ("");
    setStagedSort("relevant");
    setStagedMinPrice("");
    setStagedMaxPrice("");
    setStagedDelivery("Anytime");
    setStagedMinRating("Any Rating");
    setStagedType("");

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

  const hasActiveFilters = !!(
    currentSearch ||
    currentSort !== "relevant" ||
    currentMinPrice ||
    currentMaxPrice ||
    (currentDelivery && currentDelivery !== "any") ||
    currentMinRating ||
    currentType
  );

  return (
    <div className="w-full flex flex-col gap-6 bg-surface p-6 rounded-3xl border border-border/40 shadow-sm">
      {/* Type tabs (Segment Control) */}
      <div className="flex bg-surface-sunken p-1 rounded-full border border-border w-fit max-w-full overflow-x-auto self-start">
        <button
          type="button"
          onClick={() => {
            setStagedType("");
          }}
          className={`text-center py-2 px-5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            stagedType === ""
              ? "bg-[#163832] text-white shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          All Gigs
        </button>
        <button
          type="button"
          onClick={() => {
            setStagedType("offered");
          }}
          className={`text-center py-2 px-5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            stagedType === "offered"
              ? "bg-[#163832] text-white shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          Offered (Delivering)
        </button>
        <button
          type="button"
          onClick={() => {
            setStagedType("sought");
          }}
          className={`text-center py-2 px-5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            stagedType === "sought"
              ? "bg-[#163832] text-white shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          Sought (Seeking)
        </button>
      </div>

      {/* Top Search bar */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4.5 h-4.5 transition-colors group-focus-within:text-accent-green" />
          <input
            type="text"
            value={stagedQ}
            onChange={(e) => setStagedQ(e.target.value)}
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
            value={stagedSort}
            onChange={(e) => setStagedSort(e.target.value)}
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

      {/* Advanced pricing bounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/30">
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
                value={stagedMinPrice}
                onChange={(e) => setStagedMinPrice(e.target.value)}
                className="w-28 pl-6 pr-3 py-1.5 rounded-lg border border-border bg-surface-sunken font-sans text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-[#163832] focus:border-[#163832]"
              />
            </div>
            <span className="text-muted text-xs font-bold">—</span>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[11px] font-bold text-muted">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={stagedMaxPrice}
                onChange={(e) => setStagedMaxPrice(e.target.value)}
                className="w-28 pl-6 pr-3 py-1.5 rounded-lg border border-border bg-surface-sunken font-sans text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-[#163832] focus:border-[#163832]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Speed, Rating, and Apply constraints */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/30">
        <div className="flex flex-wrap items-center gap-6 z-30">
          {/* Delivery speed selector */}
          <div className="flex flex-col gap-1.5 min-w-[170px]">
            <span className="text-[10px] text-muted font-extrabold uppercase tracking-wider">
              Delivery Speed
            </span>
            <Combobox
              options={["Anytime", "1 day (Express)", "3 days", "7 days", "14 days", "30 days"]}
              value={stagedDelivery}
              onChange={setStagedDelivery}
              placeholder="Select or type delivery days"
              freeForm={true}
            />
          </div>

          {/* Rating constraint selector */}
          <div className="flex flex-col gap-1.5 min-w-[170px]">
            <span className="text-[10px] text-muted font-extrabold uppercase tracking-wider">
              Seller Rating
            </span>
            <Combobox
              options={["Any Rating", "5.0 ★", "4.5 ★ & up", "4.0 ★ & up", "3.5 ★ & up", "3.0 ★ & up"]}
              value={stagedMinRating}
              onChange={setStagedMinRating}
              placeholder="Select or type rating"
              freeForm={true}
            />
          </div>
        </div>

        {/* Clear and Apply status */}
        <div className="flex items-center gap-3 self-end md:self-auto z-10">
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-bold text-danger hover:underline cursor-pointer py-2 px-3"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          <button
            onClick={handleApply}
            disabled={isPending}
            className="flex items-center gap-2 bg-[#163832] hover:bg-[#1e4d42] active:bg-[#0f2420] text-white font-sans text-xs font-bold px-6 py-2.5 rounded-full transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shadow-sm"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
