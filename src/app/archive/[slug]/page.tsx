"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, BookOpen } from "lucide-react";
import { AppHeader } from "@/components/disasterph/header";
import { ArchiveMetricsGrid } from "@/components/archive/archive-metrics-grid";
import { ArchiveTimeline } from "@/components/archive/archive-timeline";
import { ArchiveSourcesPanel } from "@/components/archive/archive-sources-panel";
import { ArchiveLessonsPanel } from "@/components/archive/archive-lessons-panel";
import { getArchiveEvent } from "@/data/archive-events";
import {
  HAZARD_COLORS,
  SEVERITY_CONFIG,
  formatArchiveDateLong,
} from "@/lib/archive";

export default function ArchiveDetailPage() {
  const params = useParams<{ slug: string }>();
  const event = getArchiveEvent(params.slug ?? "");

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Event Not Found
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              This archived event could not be found.
            </p>
            <Link
              href="/archive"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-overlay/10 bg-[var(--bg-panel)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Archive
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hClass = HAZARD_COLORS[event.hazardType] ?? HAZARD_COLORS.other;
  const sConfig =
    SEVERITY_CONFIG[event.severityLabel] ?? SEVERITY_CONFIG.moderate;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />

      {/* ── Hero Banner ── */}
      <div className="relative py-12 px-4 border-b border-overlay/8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/85 to-[var(--bg-base)]/50 pointer-events-none" />
        {/* Archived event watermark stripe */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-overlay/20 to-transparent" />

        <div className="relative max-w-4xl mx-auto">
          {/* Back button */}
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 rounded-lg border border-overlay/10 bg-[var(--bg-panel)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06] mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Archive
          </Link>

          {/* Badges */}
          <motion.div
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-overlay/15 text-[var(--text-dim)] bg-overlay/5">
              <BookOpen className="w-3 h-3" /> Archived Event
            </span>
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
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight mb-3"
          >
            {event.title}
          </motion.h1>

          {/* Peak intensity subtitle */}
          {event.peakIntensity && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-base font-mono text-orange-400 mb-4"
            >
              {event.peakIntensity}
            </motion.p>
          )}

          {/* Date range + regions */}
          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
            <span
              className="flex items-center gap-1.5"
              suppressHydrationWarning
            >
              <Calendar className="w-4 h-4" />
              {formatArchiveDateLong(event.startDate)}
              {event.endDate && ` – ${formatArchiveDateLong(event.endDate)}`}
            </span>
            {event.affectedRegions.length > 0 && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.affectedRegions.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <main className="max-w-4xl mx-auto w-full px-4 py-10 pb-20 md:pb-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Impact metrics */}
            <ArchiveMetricsGrid event={event} />

            {/* Map placeholder — origin/epicenter coordinates */}
            <div className="glass-pane rounded-xl p-4 sm:hidden">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-3 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Origin / Epicenter
              </h3>
              <div className="rounded-xl overflow-hidden border border-overlay/8 bg-overlay/[0.02] flex items-center justify-center h-[180px]">
                <div className="text-center">
                  <div
                    className="mx-auto h-5 w-5 rounded-full border-2 opacity-60"
                    style={{
                      borderColor:
                        event.hazardType === "earthquake"
                          ? "#EF4444"
                          : event.hazardType === "typhoon"
                            ? "#60A5FA"
                            : "#F97316",
                      backgroundColor:
                        event.hazardType === "earthquake"
                          ? "rgba(239,68,68,0.3)"
                          : event.hazardType === "typhoon"
                            ? "rgba(96,165,250,0.3)"
                            : "rgba(249,115,22,0.3)",
                    }}
                  />
                  <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
                    {event.latitude.toFixed(4)}°, {event.longitude.toFixed(4)}°
                  </p>
                </div>
              </div>
            </div>

            {/* Event summary */}
            {event.summary && (
              <section>
                <h2 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-3">
                  Event Summary
                </h2>
                <div className="glass-pane rounded-xl p-5">
                  <p className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-line">
                    {event.summary}
                  </p>
                </div>
              </section>
            )}

            {/* Event timeline */}
            {event.timelineEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)]">
                    Event Timeline
                  </h2>
                  <span className="text-[9px] font-mono text-[var(--text-dim)]/50 border border-overlay/8 px-1.5 py-0.5 rounded">
                    {event.timelineEvents.length} entries
                  </span>
                </div>
                <div className="glass-pane rounded-xl p-5">
                  <ArchiveTimeline events={event.timelineEvents} />
                </div>
              </section>
            )}

            {/* Lessons & Preparedness */}
            {event.lessonsLearned.length > 0 && (
              <ArchiveLessonsPanel lessons={event.lessonsLearned} />
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-5">
            {/* Origin / Epicenter — desktop only (mobile shown above) */}
            <div className="glass-pane rounded-xl p-4 hidden sm:block">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-3 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Origin / Epicenter
              </h3>
              <div className="rounded-xl overflow-hidden border border-overlay/8 bg-overlay/[0.02] flex items-center justify-center h-[180px]">
                <div className="text-center">
                  <div
                    className="mx-auto h-5 w-5 rounded-full border-2 opacity-60"
                    style={{
                      borderColor:
                        event.hazardType === "earthquake"
                          ? "#EF4444"
                          : event.hazardType === "typhoon"
                            ? "#60A5FA"
                            : "#F97316",
                      backgroundColor:
                        event.hazardType === "earthquake"
                          ? "rgba(239,68,68,0.3)"
                          : event.hazardType === "typhoon"
                            ? "rgba(96,165,250,0.3)"
                            : "rgba(249,115,22,0.3)",
                    }}
                  />
                  <p className="mt-2 text-[10px] font-mono text-[var(--text-dim)]">
                    {event.latitude.toFixed(4)}°, {event.longitude.toFixed(4)}°
                  </p>
                </div>
              </div>
              <div className="font-mono text-xs text-[var(--text-primary)] mt-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-dim)]">Lat</span>
                  <span>{event.latitude.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-dim)]">Lng</span>
                  <span>{event.longitude.toFixed(4)}°</span>
                </div>
              </div>
            </div>

            {/* Affected Regions */}
            {event.affectedRegions.length > 0 && (
              <div className="glass-pane rounded-xl p-4">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-3">
                  Affected Regions
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {event.affectedRegions.map((r) => (
                    <span
                      key={r}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-overlay/10 bg-overlay/[0.04] text-overlay/80"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Official Sources */}
            {event.officialSources.length > 0 && (
              <ArchiveSourcesPanel sources={event.officialSources} />
            )}

            {/* Historical Record stamp */}
            <div className="rounded-xl border border-overlay/8 p-4 bg-overlay/[0.02]">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                  Historical Record
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">
                This is an archived event — not a live incident. All data is
                sourced from official Philippine government agencies and
                international disaster records.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
