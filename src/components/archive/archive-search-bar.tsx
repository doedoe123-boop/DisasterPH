"use client";

import { Search } from "lucide-react";

interface ArchiveSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ArchiveSearchBar({ value, onChange }: ArchiveSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-dim)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by event name or region…"
        className="w-full rounded-xl border border-white/12 bg-[var(--bg-panel)] py-3 pl-12 pr-5 text-[14px] text-white placeholder-[var(--text-dim)] outline-none transition focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15"
      />
    </div>
  );
}
