"use client";

import * as React from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export function Combobox({
  name,
  value: controlledValue,
  onChange,
  options,
  placeholder = "Select option...",
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [internalValue, setInternalValue] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) =>
      option.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectValue = (val: string) => {
    if (onChange) {
      onChange(val);
    } else {
      setInternalValue(val);
    }
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

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

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
          filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredOptions.length > 0
            ? (prev - 1 + filteredOptions.length) % filteredOptions.length
            : 0
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions.length > 0 && activeIndex >= 0 && activeIndex < filteredOptions.length) {
          selectValue(filteredOptions[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        // Let normal tab behavior close the dropdown
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Hidden input to ensure form actions capture the selected category value */}
      <input type="hidden" name={name} value={value} />

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

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-surface p-2 shadow-pop border border-border/80 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2 mb-1.5">
            <Search className="h-4 w-4 text-muted shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto space-y-0.5 outline-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted text-center font-medium">
                No results found
              </li>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = value === option;
                const isActive = activeIndex === idx;

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
                    <span>{option}</span>
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
