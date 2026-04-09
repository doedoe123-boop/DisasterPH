"use client";

import { motion } from "framer-motion";
import type { ArchiveTimelineEntry } from "@/types/archive";
import { formatArchiveDate } from "@/lib/archive";

interface ArchiveTimelineProps {
  events: ArchiveTimelineEntry[];
}

export function ArchiveTimeline({ events }: ArchiveTimelineProps) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />

      <div className="space-y-6">
        {events.map((entry, i) => (
          <motion.div
            key={i}
            className="relative"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            {/* Dot on the timeline */}
            <div
              className={`absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 ${
                i === 0
                  ? "border-orange-400 bg-orange-400"
                  : "border-white/20 bg-[var(--bg-panel)]"
              }`}
            />

            <p className="text-[11px] font-mono text-orange-400/80">
              {formatArchiveDate(entry.date)}
            </p>
            <h4 className="mt-1 text-sm font-bold text-white">{entry.title}</h4>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-dim)]">
              {entry.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
