"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { AppHeader } from "@/components/disasterph/header";
import { ArchiveHero } from "@/components/archive/archive-hero";
import { ArchiveSearchBar } from "@/components/archive/archive-search-bar";
import { ArchiveFilters } from "@/components/archive/archive-filters";
import { ArchiveEventCard } from "@/components/archive/archive-event-card";
import { getArchiveEvents } from "@/data/archive-events";
import type { ArchiveHazardType } from "@/types/archive";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function ArchivePage() {
  const events = getArchiveEvents();
  const [search, setSearch] = useState("");
  const [hazard, setHazard] = useState<ArchiveHazardType | "all">("all");
  const [year, setYear] = useState("all");

  const featured = useMemo(() => events.filter((e) => e.isFeatured), [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchHazard = hazard === "all" || e.hazardType === hazard;
      const matchYear = year === "all" || e.startDate.startsWith(year);
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.affectedRegions.some((r) =>
          r.toLowerCase().includes(search.toLowerCase()),
        );
      return matchHazard && matchYear && matchSearch;
    });
  }, [events, hazard, year, search]);

  const showFeatured =
    featured.length > 0 && !search && hazard === "all" && year === "all";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />

      <ArchiveHero />

      <main className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8 pb-20 md:pb-8 sm:px-6 lg:px-10">
        {/* Featured events */}
        {showFeatured && (
          <section>
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-3">
              Featured Events
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {featured.map((e) => (
                <ArchiveEventCard key={e.id} event={e} featured />
              ))}
            </div>
          </section>
        )}

        {/* Search + Filters */}
        <section className="space-y-4">
          <ArchiveSearchBar value={search} onChange={setSearch} />
          <ArchiveFilters
            hazard={hazard}
            year={year}
            onHazardChange={setHazard}
            onYearChange={setYear}
          />
        </section>

        {/* Results */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)]">
              {filtered.length} {filtered.length === 1 ? "Event" : "Events"}
            </h2>
            <div className="flex-1 h-px bg-overlay/8" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-8 h-8 text-[var(--text-dim)] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">
                No archived events found.
              </p>
            </div>
          ) : (
            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {filtered.map((e) => (
                <motion.div key={e.id} variants={cardVariants}>
                  <ArchiveEventCard event={e} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
