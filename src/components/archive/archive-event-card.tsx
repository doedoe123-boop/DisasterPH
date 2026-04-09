"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar, AlertTriangle, Users, BookOpen } from "lucide-react";
import type { ArchiveEvent } from "@/types/archive";
import {
  HAZARD_COLORS,
  SEVERITY_CONFIG,
  formatArchiveDate,
} from "@/lib/archive";

interface ArchiveEventCardProps {
  event: ArchiveEvent;
  featured?: boolean;
}

export function ArchiveEventCard({
  event,
  featured = false,
}: ArchiveEventCardProps) {
  const hClass = HAZARD_COLORS[event.hazardType] ?? HAZARD_COLORS.other;
  const sConfig =
    SEVERITY_CONFIG[event.severityLabel] ?? SEVERITY_CONFIG.moderate;

  return (
    <Link href={`/archive/${event.slug}`} className="group block">
      <motion.div
        className="rounded-xl border border-white/8 bg-[var(--bg-panel)] p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/15 hover:shadow-[var(--shadow-elevated)]"
        whileTap={{ scale: 0.98 }}
      >
        {/* Top row: badges + featured tag */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${hClass}`}
            >
              {event.hazardType}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${sConfig.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sConfig.dot}`} />
              {sConfig.label}
            </span>
          </div>
          {featured && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-orange-500/40 bg-orange-500/15 text-orange-400">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-3 text-[16px] font-bold leading-snug text-white transition group-hover:text-orange-200">
          {event.title}
        </h3>

        {/* Subtitle / peak intensity */}
        <p className="mt-1 text-[13px] font-mono text-[var(--text-dim)]">
          {event.peakIntensity}
        </p>

        {/* Date + regions */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatArchiveDate(event.startDate)}
            {event.endDate && ` – ${formatArchiveDate(event.endDate)}`}
          </span>
          {event.affectedRegions.length > 0 && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.affectedRegions.slice(0, 2).join(", ")}
              {event.affectedRegions.length > 2 &&
                ` +${event.affectedRegions.length - 2}`}
            </span>
          )}
        </div>

        {/* Impact stats row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
          {event.deathToll != null && (
            <span className="flex items-center gap-1.5 text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-mono font-bold">
                {event.deathToll.toLocaleString()}
              </span>{" "}
              <span className="text-[var(--text-dim)]">deaths</span>
            </span>
          )}
          {event.displacedCount != null && (
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Users className="h-3.5 w-3.5" />
              <span className="font-mono font-bold">
                {event.displacedCount >= 1000000
                  ? `${(event.displacedCount / 1000000).toFixed(0)}M`
                  : `${(event.displacedCount / 1000).toFixed(0)}K`}
              </span>{" "}
              <span className="text-[var(--text-dim)]">displaced</span>
            </span>
          )}
        </div>

        {/* Summary excerpt */}
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-dim)] line-clamp-2">
          {event.summary}
        </p>
      </motion.div>
    </Link>
  );
}
