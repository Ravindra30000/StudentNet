"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const POPULAR_CHIPS = [
  "Web Development",
  "UI/UX Design",
  "Video Editing",
  "Content Writing",
];

export default function ServiceSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/services?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/services");
    }
  };

  const handleChipClick = (chip: string) => {
    router.push(`/services?category=${encodeURIComponent(chip)}`);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-3.5">
      <form onSubmit={handleSearchSubmit} className="relative w-full group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted w-5.5 h-5.5 transition-colors group-focus-within:text-accent-green" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services..."
          className="w-full pl-16 pr-28 py-4.5 rounded-full border border-border bg-surface font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all shadow-inner"
        />
        <button
          type="submit"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-ink hover:bg-accent-green text-white font-sans text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer"
        >
          Search
        </button>
      </form>
      
      {/* Popular Chips Row */}
      <div className="flex flex-wrap items-center gap-2 px-2">
        <span className="text-xs text-muted font-medium">Popular:</span>
        {POPULAR_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border/80 hover:border-accent-green bg-surface-sunken hover:bg-accent-green/5 text-ink hover:text-accent-green transition-all cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
