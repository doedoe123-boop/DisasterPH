"use client";

import { Filter } from "lucide-react";
import { HAZARD_TYPES, YEAR_FILTERS } from "@/lib/archive";
import type { ArchiveHazardType } from "@/types/archive";

interface ArchiveFiltersProps {
  hazard: ArchiveHazardType | "all";
  year: string;
  onHazardChange: (value: ArchiveHazardType | "all") => void;
  onYearChange: (value: string) => void;
}

export function ArchiveFilters({
  hazard,
  year,
  onHazardChange,
  onYearChange,
}: ArchiveFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Hazard filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {HAZARD_TYPES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onHazardChange(f.value)}
            className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
              hazard === f.value
                ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                : "border-overlay/10 text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:border-overlay/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Year filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 items-center">
        <Filter className="w-3.5 h-3.5 text-[var(--text-dim)] shrink-0" />
        {YEAR_FILTERS.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearChange(y)}
            className={`shrink-0 text-[10px] font-mono px-2.5 py-1 rounded border transition-all ${
              year === y
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                : "border-overlay/8 text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:border-overlay/15"
            }`}
          >
            {y === "all" ? "All Years" : y}
          </button>
        ))}
      </div>
    </div>
  );
}
