"use client";

import * as React from "react";
import { ChevronDown, Check, Search, History, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: string[];
  popularOptions?: string[];
  historyKey?: string;
  placeholder?: string;
  className?: string;
  freeForm?: boolean;
}

export function Combobox({
  name,
  value: controlledValue,
  onChange,
  options = [],
  popularOptions = [],
  historyKey,
  placeholder = "Select or type option...",
  className,
  freeForm = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [internalValue, setInternalValue] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [history, setHistory] = React.useState<string[]>(() => {
    if (historyKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(historyKey);
        if (saved) return JSON.parse(saved) as string[];
      } catch (e) {
        console.error("Failed to load search history", e);
      }
    }
    return [];
  });

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Save value to history
  const addToHistory = React.useCallback((val: string) => {
    if (!val || !val.trim() || !historyKey) return;
    const trimmed = val.trim();
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const nextHistory = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(historyKey, JSON.stringify(nextHistory));
      } catch (e) {
        console.error("Failed to save search history", e);
      }
      return nextHistory;
    });
  }, [historyKey]);

  // Handle value selection
  const selectValue = (val: string) => {
    if (onChange) {
      onChange(val);
    } else {
      setInternalValue(val);
    }
    addToHistory(val);
    setSearch("");
    setIsOpen(false);
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on typed search query or current input value
  const filteredOptions = React.useMemo(() => {
    const query = freeForm ? value : search;
    const cleanQuery = (query || "").trim().toLowerCase();
    if (!cleanQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(cleanQuery)
    );
  }, [options, search, value, freeForm]);

  // Determine active dropdown items
  const dropdownItems = React.useMemo(() => {
    const query = freeForm ? value : search;
    const cleanQuery = (query || "").trim().toLowerCase();

    if (cleanQuery) {
      // If user typed something, show only matching filtered items
      return filteredOptions.slice(0, 50);
    }

    // If search is empty, show a composite list:
    // 1. History items
    // 2. Popular options
    // 3. Regular options (excluding duplicates of history/popular options)
    const items: { label: string; type: "history" | "popular" | "normal" }[] = [];

    history.forEach((h) => {
      items.push({ label: h, type: "history" });
    });

    popularOptions.forEach((p) => {
      if (!history.some((h) => h.toLowerCase() === p.toLowerCase())) {
        items.push({ label: p, type: "popular" });
      }
    });

    options.forEach((o) => {
      const isDuplicate =
        history.some((h) => h.toLowerCase() === o.toLowerCase()) ||
        popularOptions.some((p) => p.toLowerCase() === o.toLowerCase());
      if (!isDuplicate && items.length < 50) {
        items.push({ label: o, type: "normal" });
      }
    });

    return items.map((i) => i.label);
  }, [filteredOptions, search, value, freeForm, history, popularOptions, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          dropdownItems.length > 0 ? (prev + 1) % dropdownItems.length : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          dropdownItems.length > 0
            ? (prev - 1 + dropdownItems.length) % dropdownItems.length
            : 0
        );
        break;
      case "Enter":
        e.preventDefault();
        if (dropdownItems.length > 0 && activeIndex >= 0 && activeIndex < dropdownItems.length) {
          selectValue(dropdownItems[activeIndex]);
        } else if (freeForm && value) {
          selectValue(value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) {
      onChange(val);
    } else {
      setInternalValue(val);
    }
    setIsOpen(true);
    setActiveIndex(0);
  };

  // Check if item is history/popular
  const getItemType = (item: string) => {
    if (history.some((h) => h.toLowerCase() === item.toLowerCase())) return "history";
    if (popularOptions.some((p) => p.toLowerCase() === item.toLowerCase())) return "popular";
    return "normal";
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <input type="hidden" name={name} value={value || ""} />

      {freeForm ? (
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={value || ""}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent-green focus:ring-2 focus:ring-accent-green/30 outline-none transition-all pr-10"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink focus-visible:border-accent-green focus-visible:ring-2 focus-visible:ring-accent-green/30 outline-none text-left cursor-pointer transition-all"
        >
          <span className={cn(value ? "text-ink" : "text-muted")}>
            {value || placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-surface p-2 shadow-pop border border-border/80 animate-in fade-in slide-in-from-top-2 duration-150">
          {!freeForm && (
            <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2 mb-1.5">
              <Search className="h-4 w-4 text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </div>
          )}

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto space-y-0.5 outline-none"
          >
            {dropdownItems.length === 0 ? (
              freeForm && value ? (
                <li
                  role="option"
                  aria-selected={false}
                  onClick={() => selectValue(value)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer text-muted hover:text-ink hover:bg-surface-sunken"
                >
                  <span>Use custom value: &quot;{value}&quot;</span>
                </li>
              ) : (
                <li className="px-3 py-2 text-xs text-muted text-center font-medium">
                  No results found
                </li>
              )
            ) : (
              dropdownItems.map((option, idx) => {
                const isSelected = value?.toLowerCase() === option.toLowerCase();
                const isActive = activeIndex === idx;
                const type = getItemType(option);

                return (
                  <li
                    key={option}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectValue(option)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition-colors",
                      isActive
                        ? "bg-accent-green/10 text-accent-green"
                        : isSelected
                        ? "bg-accent-green/5 text-ink"
                        : "text-muted hover:text-ink hover:bg-surface-sunken"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {type === "history" && (
                        <History className="h-3.5 w-3.5 text-muted shrink-0" />
                      )}
                      {type === "popular" && (
                        <TrendingUp className="h-3.5 w-3.5 text-accent-green shrink-0" />
                      )}
                      <span>{option}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-accent-green shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
