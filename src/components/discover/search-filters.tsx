"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { Search, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

interface SearchFiltersProps {
  skills: string[];
  colleges: string[];
  gradYears: string[];
  popularSkills?: string[];
  popularColleges?: string[];
  popularGradYears?: string[];
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
  popularSkills = [],
  popularColleges = [],
  popularGradYears = [],
  mode = "talent",
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ── Local staged state (not applied until Search is clicked) ──
  const [stagedQ, setStagedQ] = useState(searchParams.get("q") ?? "");
  const [stagedSkill, setStagedSkill] = useState(searchParams.get("skill") ?? "");
  const [stagedCollege, setStagedCollege] = useState(searchParams.get("college") ?? "");
  const [stagedRole, setStagedRole] = useState(searchParams.get("role") ?? "");
  const [stagedGradYear, setStagedGradYear] = useState(searchParams.get("grad_year") ?? "");
  const [stagedCategory, setStagedCategory] = useState(searchParams.get("category") ?? "");

  const hasActiveFilters = mode === "services"
    ? !!(searchParams.get("q") || searchParams.get("category"))
    : !!(searchParams.get("q") || searchParams.get("skill") || searchParams.get("college") || searchParams.get("role") || searchParams.get("grad_year"));

  const hasStagedChanges = mode === "services"
    ? (stagedQ !== (searchParams.get("q") ?? "") || stagedCategory !== (searchParams.get("category") ?? ""))
    : (stagedQ !== (searchParams.get("q") ?? "") ||
       stagedSkill !== (searchParams.get("skill") ?? "") ||
       stagedCollege !== (searchParams.get("college") ?? "") ||
       stagedRole !== (searchParams.get("role") ?? "") ||
       stagedGradYear !== (searchParams.get("grad_year") ?? ""));

  // ── Apply all staged filters at once ──
  const handleApply = () => {
    const params = new URLSearchParams();
    const modeParam = searchParams.get("mode");
    if (modeParam) params.set("mode", modeParam);

    if (stagedQ.trim()) params.set("q", stagedQ.trim());

    if (mode === "services") {
      if (stagedCategory) params.set("category", stagedCategory);
    } else {
      if (stagedSkill) params.set("skill", stagedSkill);
      if (stagedCollege) params.set("college", stagedCollege);
      if (stagedRole) params.set("role", stagedRole);
      if (stagedGradYear) params.set("grad_year", stagedGradYear);
    }

    const newQuery = params.toString();
    startTransition(() => {
      router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
    });
  };

  // ── Clear everything ──
  const handleClear = () => {
    setStagedQ("");
    setStagedSkill("");
    setStagedCollege("");
    setStagedRole("");
    setStagedGradYear("");
    setStagedCategory("");
    const modeParam = searchParams.get("mode");
    startTransition(() => {
      router.push(modeParam ? `${pathname}?mode=${modeParam}` : pathname);
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApply();
  };

  return (
    <div className="w-full flex flex-col gap-4 items-center md:items-start">
      {/* Search bar + Apply button row */}
      <form onSubmit={handleFormSubmit} className="w-full max-w-2xl flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted w-4 h-4 transition-colors group-focus-within:text-accent-green pointer-events-none" />
          <input
            type="text"
            value={stagedQ}
            onChange={(e) => setStagedQ(e.target.value)}
            placeholder={
              mode === "services"
                ? "Search services..."
                : "Try 'React', 'IIT Bombay' or 'Ishaan'"
            }
            className="w-full pl-12 pr-4 py-3.5 rounded-full border border-border bg-surface font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-[#163832] hover:bg-[#1e4d42] active:bg-[#0f2420] text-white font-sans text-sm font-semibold px-6 py-3.5 rounded-full transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shadow-sm"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </form>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-end gap-3 justify-center md:justify-start w-full">
        {mode === "services" ? (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Category</span>
            <div className="w-52">
              <Combobox
                value={stagedCategory}
                onChange={setStagedCategory}
                options={CATEGORIES}
                placeholder="Any category"
                freeForm={false}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Skill</span>
              <div className="w-40">
                <Combobox
                  value={stagedSkill}
                  onChange={setStagedSkill}
                  options={skills}
                  popularOptions={popularSkills}
                  historyKey="recent_skills_filter"
                  placeholder="Any skill"
                  freeForm={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">College</span>
              <div className="w-52">
                <Combobox
                  value={stagedCollege}
                  onChange={setStagedCollege}
                  options={colleges}
                  popularOptions={popularColleges}
                  historyKey="recent_colleges_filter"
                  placeholder="Any college"
                  freeForm={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Role</span>
              <div className="w-44">
                <Combobox
                  value={ROLE_LABELS[stagedRole] ?? ""}
                  onChange={(label) => {
                    const key =
                      Object.keys(ROLE_LABELS).find(
                        (k) => ROLE_LABELS[k] === label
                      ) ?? "";
                    setStagedRole(key);
                  }}
                  options={Object.values(ROLE_LABELS)}
                  placeholder="Any role"
                  freeForm={false}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Grad Year</span>
              <div className="w-40">
                <Combobox
                  value={stagedGradYear}
                  onChange={setStagedGradYear}
                  options={gradYears}
                  popularOptions={popularGradYears}
                  historyKey="recent_grad_years_filter"
                  placeholder="Any year"
                  freeForm={true}
                />
              </div>
            </div>
          </>
        )}

        {/* Apply button — shown when staged values differ from current URL */}
        {hasStagedChanges && (
          <button
            type="button"
            onClick={handleApply}
            disabled={isPending}
            className="self-end flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#F5B83D] hover:bg-[#e0a82e] text-[#163832] font-sans text-xs font-bold transition-all cursor-pointer disabled:opacity-60 shadow-sm"
          >
            Apply filters
          </button>
        )}

        {/* Clear button — shown when URL has active filters */}
        {hasActiveFilters && !hasStagedChanges && (
          <button
            type="button"
            onClick={handleClear}
            className="self-end flex items-center gap-1.5 px-4 py-2.5 rounded-full hover:bg-danger/5 text-danger font-sans text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {(hasActiveFilters || hasStagedChanges) && hasStagedChanges && (
          <button
            type="button"
            onClick={handleClear}
            className="self-end flex items-center gap-1.5 px-4 py-2.5 rounded-full hover:bg-danger/5 text-danger font-sans text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Active filter pills — show what's currently applied to URL */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 w-full">
          {searchParams.get("q") && (
            <span className="flex items-center gap-1 bg-surface-sunken border border-border rounded-full px-3 py-1 text-xs font-semibold text-ink">
              &ldquo;{searchParams.get("q")}&rdquo;
              <button
                onClick={() => { setStagedQ(""); startTransition(() => { const p = new URLSearchParams(searchParams.toString()); p.delete("q"); router.push(p.toString() ? `${pathname}?${p}` : pathname); }); }}
                className="ml-1 text-muted hover:text-danger transition-colors cursor-pointer"
              >×</button>
            </span>
          )}
          {searchParams.get("skill") && (
            <span className="flex items-center gap-1 bg-surface-sunken border border-border rounded-full px-3 py-1 text-xs font-semibold text-ink">
              Skill: {searchParams.get("skill")}
              <button
                onClick={() => { setStagedSkill(""); startTransition(() => { const p = new URLSearchParams(searchParams.toString()); p.delete("skill"); router.push(p.toString() ? `${pathname}?${p}` : pathname); }); }}
                className="ml-1 text-muted hover:text-danger transition-colors cursor-pointer"
              >×</button>
            </span>
          )}
          {searchParams.get("college") && (
            <span className="flex items-center gap-1 bg-surface-sunken border border-border rounded-full px-3 py-1 text-xs font-semibold text-ink">
              College: {searchParams.get("college")}
              <button
                onClick={() => { setStagedCollege(""); startTransition(() => { const p = new URLSearchParams(searchParams.toString()); p.delete("college"); router.push(p.toString() ? `${pathname}?${p}` : pathname); }); }}
                className="ml-1 text-muted hover:text-danger transition-colors cursor-pointer"
              >×</button>
            </span>
          )}
          {searchParams.get("role") && (
            <span className="flex items-center gap-1 bg-surface-sunken border border-border rounded-full px-3 py-1 text-xs font-semibold text-ink">
              Role: {ROLE_LABELS[searchParams.get("role")!] ?? searchParams.get("role")}
              <button
                onClick={() => { setStagedRole(""); startTransition(() => { const p = new URLSearchParams(searchParams.toString()); p.delete("role"); router.push(p.toString() ? `${pathname}?${p}` : pathname); }); }}
                className="ml-1 text-muted hover:text-danger transition-colors cursor-pointer"
              >×</button>
            </span>
          )}
          {searchParams.get("grad_year") && (
            <span className="flex items-center gap-1 bg-surface-sunken border border-border rounded-full px-3 py-1 text-xs font-semibold text-ink">
              Class of {searchParams.get("grad_year")}
              <button
                onClick={() => { setStagedGradYear(""); startTransition(() => { const p = new URLSearchParams(searchParams.toString()); p.delete("grad_year"); router.push(p.toString() ? `${pathname}?${p}` : pathname); }); }}
                className="ml-1 text-muted hover:text-danger transition-colors cursor-pointer"
              >×</button>
            </span>
          )}
          {searchParams.get("category") && (
            <span className="flex items-center gap-1 bg-surface-sunken border border-border rounded-full px-3 py-1 text-xs font-semibold text-ink">
              {searchParams.get("category")}
              <button
                onClick={() => { setStagedCategory(""); startTransition(() => { const p = new URLSearchParams(searchParams.toString()); p.delete("category"); router.push(p.toString() ? `${pathname}?${p}` : pathname); }); }}
                className="ml-1 text-muted hover:text-danger transition-colors cursor-pointer"
              >×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
