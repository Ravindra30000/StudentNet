"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface SearchFiltersProps {
  skills: string[];
  colleges: string[];
  gradYears: string[];
  mode?: "talent" | "services";
}

const CATEGORIES = [
  "Web Development",
  "App Design",
  "AI/ML",
  "Video Editing",
  "Content Writing",
  "UI/UX Design",
  "Digital Marketing",
  "Blockchain",
];

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  founder: "Startup Founder",
  community_leader: "Community Leader",
  client: "Client",
};

export default function SearchFilters({
  skills,
  colleges,
  gradYears,
  mode = "talent",
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearchQuery = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = useState(currentSearchQuery);

  if (currentSearchQuery !== prevSearchQuery) {
    setSearchQuery(currentSearchQuery);
    setPrevSearchQuery(currentSearchQuery);
  }

  // Helper to push updated search params to the router
  const applyFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.delete("page");

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

  // Debounced search query update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== currentSearchQuery) {
        applyFilters({ q: searchQuery });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentSearchQuery, applyFilters]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    applyFilters({ q: searchQuery });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      const modeParam = searchParams.get("mode");
      if (modeParam) {
        router.push(`${pathname}?mode=${modeParam}`);
      } else {
        router.push(pathname);
      }
    });
  };

  const currentSkill = searchParams.get("skill") ?? "";
  const currentCollege = searchParams.get("college") ?? "";
  const currentRole = searchParams.get("role") ?? "";
  const currentGradYear = searchParams.get("grad_year") ?? "";
  const currentCategory = searchParams.get("category") ?? "";

  const hasActiveFilters = mode === "services"
    ? !!(searchParams.get("q") || currentCategory)
    : !!(searchParams.get("q") ||
      currentSkill ||
      currentCollege ||
      currentRole ||
      currentGradYear);

  return (
    <div className="w-full flex flex-col gap-6 items-center md:items-start">
      {/* Search Input Container */}
      <form
        onSubmit={handleSearchSubmit}
        className="w-full max-w-2xl relative group"
      >
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted w-5 h-5 transition-colors group-focus-within:text-accent-green" />
        <input
          type="text"
          name="q"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={mode === "services" ? "Search services..." : "Try 'React', 'IIT Bombay' or 'Ishaan'"}
          className="w-full pl-16 pr-24 py-4 rounded-full border border-border bg-surface font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all shadow-inner"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-ink hover:bg-accent-green text-white font-sans text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-200"
        >
          Search
        </button>
      </form>

      {/* Select Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start w-full">
        {mode === "services" ? (
          /* Category Filter */
          <div className="relative">
            <select
              value={currentCategory}
              onChange={(e) => applyFilters({ category: e.target.value })}
              className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 rounded-full bg-surface-sunken hover:bg-border/60 font-sans text-sm font-semibold text-ink border border-border outline-none transition-colors cursor-pointer"
            >
              <option value="">Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/70 w-4 h-4 pointer-events-none" />
          </div>
        ) : (
          <>
            {/* Skill Filter */}
            <div className="relative">
              <select
                value={currentSkill}
                onChange={(e) => applyFilters({ skill: e.target.value })}
                className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 rounded-full bg-surface-sunken hover:bg-border/60 font-sans text-sm font-semibold text-ink border border-border outline-none transition-colors cursor-pointer"
              >
                <option value="">Skill</option>
                {skills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/70 w-4 h-4 pointer-events-none" />
            </div>

            {/* College Filter */}
            <div className="relative">
              <select
                value={currentCollege}
                onChange={(e) => applyFilters({ college: e.target.value })}
                className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 rounded-full bg-surface-sunken hover:bg-border/60 font-sans text-sm font-semibold text-ink border border-border outline-none transition-colors cursor-pointer"
              >
                <option value="">College</option>
                {colleges.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/70 w-4 h-4 pointer-events-none" />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={currentRole}
                onChange={(e) => applyFilters({ role: e.target.value })}
                className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 rounded-full bg-surface-sunken hover:bg-border/60 font-sans text-sm font-semibold text-ink border border-border outline-none transition-colors cursor-pointer"
              >
                <option value="">Role</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/70 w-4 h-4 pointer-events-none" />
            </div>

            {/* Graduation Year Filter */}
            <div className="relative">
              <select
                value={currentGradYear}
                onChange={(e) => applyFilters({ grad_year: e.target.value })}
                className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2 rounded-full bg-surface-sunken hover:bg-border/60 font-sans text-sm font-semibold text-ink border border-border outline-none transition-colors cursor-pointer"
              >
                <option value="">Graduation Year</option>
                {gradYears.map((y) => (
                  <option key={y} value={y}>
                    Class of {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/70 w-4 h-4 pointer-events-none" />
            </div>
          </>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-danger/5 text-danger font-sans text-xs font-bold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}

        {/* Loading Spinner Indicator */}
        {isPending && (
          <div className="text-xs text-muted font-medium ml-2 animate-pulse">
            Filtering...
          </div>
        )}
      </div>
    </div>
  );
}
