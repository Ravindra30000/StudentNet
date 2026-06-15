"use client";

import { useState } from "react";
import type { Skill } from "@/lib/types";
import { Plus, Check, Loader2 } from "lucide-react";

interface SkillsFieldProps {
  skills: Skill[];
  initialSelectedSkillIds: number[];
}

export default function SkillsField({
  skills,
  initialSelectedSkillIds,
}: SkillsFieldProps) {
  const [allSkills, setAllSkills] = useState<Skill[]>(skills);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedSkillIds);
  const [customInput, setCustomInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustom = async (e: React.MouseEvent) => {
    e.preventDefault();
    const name = customInput.trim();
    if (!name) return;

    setError(null);

    // 1. Check if we already have it in allSkills (case-insensitive)
    const existing = allSkills.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      if (!selectedIds.includes(existing.id)) {
        toggleSkill(existing.id);
      }
      setCustomInput("");
      return;
    }

    // 2. Fetch from API
    setIsAdding(true);
    try {
      const res = await fetch("/api/skills/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add skill");
      }

      const newSkill: Skill = await res.json();
      // Ensure category is set
      newSkill.category = newSkill.category || "Custom";

      setAllSkills((prev) => [...prev, newSkill]);
      setSelectedIds((prev) => [...prev, newSkill.id]);
      setCustomInput("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add skill";
      setError(message);
    } finally {
      setIsAdding(false);
    }
  };

  // Group by category
  const skillsByCategory = allSkills.reduce<Record<string, Skill[]>>(
    (acc, skill) => {
      const category = skill.category ?? "Other";
      acc[category] = acc[category] ?? [];
      acc[category].push(skill);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        {Object.entries(skillsByCategory).map(([category, items]) => (
          <div key={category}>
            <p className="mb-3 text-xs font-bold text-muted uppercase tracking-wider">{category}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((skill) => {
                const isSelected = selectedIds.includes(skill.id);
                return (
                  <label
                    key={skill.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all select-none ${
                      isSelected
                        ? "border-accent-green bg-accent-green/10 text-accent-green"
                        : "border-border hover:bg-surface-sunken text-ink"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill.id}
                      checked={isSelected}
                      onChange={() => toggleSkill(skill.id)}
                      className="sr-only"
                    />
                    {isSelected && <Check className="h-3 w-3 shrink-0" />}
                    {skill.name}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Skill Row */}
      <div className="pt-4 border-t border-border/40">
        <label className="text-xs font-bold text-ink">Can&apos;t find your skill? Add a custom one:</label>
        <div className="flex gap-3 mt-2.5">
          <input
            type="text"
            placeholder="e.g. Solidity, Docker, Figma..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            disabled={isAdding}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-accent text-ink"
          />
          <button
            onClick={handleAddCustom}
            disabled={isAdding || !customInput.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-surface hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add
          </button>
        </div>
        {error && <p className="text-xs text-danger mt-2">{error}</p>}
      </div>
    </div>
  );
}
