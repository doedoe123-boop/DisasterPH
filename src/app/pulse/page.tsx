"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Waves,
  Wind,
  Droplets,
  Mountain,
  TriangleAlert,
  AlertTriangle,
  MapPin,
  Clock,
  Activity,
} from "lucide-react";
import { eventTypeLabel, filterIncidentsByType } from "@/lib/incidents";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import type {
  Incident,
  IncidentEventType,
  IncidentSeverity,
} from "@/types/incident";
import { useIncidents } from "@/hooks/use-incidents";
import { AppHeader } from "@/components/disasterph/header";

/* ── Icons per hazard type ── */
const HAZARD_ICON: Record<string, typeof Waves> = {
  earthquake: Waves,
  typhoon: Wind,
  flood: Droplets,
  volcano: Mountain,
  landslide: TriangleAlert,
  wildfire: AlertTriangle,
};

/* ── Type filter chips ── */
const TYPE_FILTERS: Array<{
  label: string;
  value: IncidentEventType | "all";
}> = [
  { label: "All", value: "all" },
  { label: "Earthquake", value: "earthquake" },
  { label: "Typhoon", value: "typhoon" },
  { label: "Flood", value: "flood" },
  { label: "Volcano", value: "volcano" },
  { label: "Landslide", value: "landslide" },
];

/* ── Severity filter chips ── */
const SEVERITY_FILTERS: Array<{
  label: string;
  value: IncidentSeverity | "all";
}> = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Watch", value: "watch" },
  { label: "Info", value: "advisory" },
];

/* ── severity glow map ── */
const SEVERITY_GLOW: Record<string, string> = {
  critical: "card-glow-critical",
  warning: "card-glow-warning",
  watch: "card-glow-watch",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const mins = Math.floor(-diff / 60_000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `in ${hrs}h`;
  }
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Build data pills from incident metadata */
function dataPills(incident: Incident): string[] {
  const pills: string[] = [];
  const m = incident.metadata;
  if (incident.event_type === "earthquake") {
    if (m.magnitude != null)
      pills.push(`MAG ${Number(m.magnitude).toFixed(1)}`);
    if (m.depth_km != null)
      pills.push(`${Number(m.depth_km).toFixed(0)}km deep`);
  } else if (incident.event_type === "typhoon") {
    if (m.signal_number != null) pills.push(`Signal ${m.signal_number}`);
    if (m.wind_speed_kph != null) pills.push(`${m.wind_speed_kph} kph`);
  } else if (incident.event_type === "volcano") {
    if (m.alert_level) pills.push(`Alert: ${String(m.alert_level)}`);
  }
  return pills;
}

/* ── Motion variants ── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function PulseFeedPage() {
  const { incidents, isLoading } = useIncidents();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<IncidentEventType | "all">(
    "all",
  );
  const [severityFilter, setSeverityFilter] = useState<
    IncidentSeverity | "all"
  >("all");

  const filtered = useMemo(() => {
    let result = filterIncidentsByType(incidents, typeFilter);
    if (severityFilter !== "all") {
      result = result.filter((i) => i.severity === severityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.region.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [incidents, typeFilter, severityFilter, search]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-6 lg:px-10">
        {/* ── Page heading ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10">
              <Activity className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Pulse Feed
              </h1>
              <p className="text-[13px] text-[var(--text-dim)] mt-0.5">
                Real-time disaster event stream
              </p>
            </div>
          </div>
          <span className="text-[15px] font-medium text-[var(--text-muted)]">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative mt-6"
        >
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search events by title, location, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/12 bg-[var(--bg-panel)] py-3.5 pl-12 pr-5 text-[15px] text-white placeholder-[var(--text-dim)] outline-none transition focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 shadow-[var(--shadow-card)]"
          />
        </motion.div>

        {/* ── Filter chips ── */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-5 flex flex-wrap items-center gap-2.5"
        >
          <Filter className="h-[18px] w-[18px] text-[var(--text-dim)]" />

          {/* Type filters */}
          {TYPE_FILTERS.map((f) => (
            <button
              key={`type-${f.value}`}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider transition border ${
                typeFilter === f.value
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                  : "text-[var(--text-dim)] border-transparent hover:bg-white/6 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Divider */}
          <div className="mx-1 h-5 w-px bg-white/12" />

          {/* Severity filters */}
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={`sev-${f.value}`}
              type="button"
              onClick={() => setSeverityFilter(f.value)}
              className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider transition border ${
                severityFilter === f.value
                  ? f.value === "critical"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : f.value === "warning"
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                      : "bg-orange-500/15 text-orange-400 border-orange-500/30"
                  : "text-[var(--text-dim)] border-transparent hover:bg-white/6 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* ── Loading ── */}
        {isLoading && incidents.length === 0 && (
          <div className="mt-16 text-center">
            <div className="loading-shimmer mx-auto h-5 w-48 rounded-full" />
            <p className="mt-4 text-sm text-[var(--text-dim)]">
              Loading events…
            </p>
          </div>
        )}

        {/* ── Event cards grid ── */}
        {filtered.length > 0 && (
          <motion.div
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filtered.map((incident) => (
              <EventCard key={incident.id} incident={incident} />
            ))}
          </motion.div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filtered.length === 0 && incidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-20 text-center"
          >
            <p className="text-[16px] text-[var(--text-muted)]">
              No events match your current filters.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* ── Event Card Component ── */
function EventCard({ incident }: { incident: Incident }) {
  const sv = visualFromSeverity(incident.severity);
  const Icon = HAZARD_ICON[incident.event_type] ?? AlertTriangle;
  const pills = dataPills(incident);
  const glowClass = SEVERITY_GLOW[incident.severity] ?? "";

  return (
    <motion.div variants={cardVariants}>
      <Link
        href={`/pulse/${encodeURIComponent(incident.id)}`}
        className={`group block rounded-xl border bg-[var(--bg-panel)] p-5 transition-all duration-200 border-l-3 ${sv.accent} ${glowClass} hover:bg-[var(--bg-card-hover)] hover:border-white/20 hover:shadow-[var(--shadow-elevated)] ${
          incident.severity === "critical"
            ? "border-red-500/25"
            : incident.severity === "warning"
              ? "border-orange-500/20"
              : "border-white/10"
        }`}
      >
        {/* Top row: icon + badges */}
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              incident.severity === "critical"
                ? "bg-red-500/15 text-red-400"
                : incident.severity === "warning"
                  ? "bg-orange-500/15 text-orange-400"
                  : incident.severity === "watch"
                    ? "bg-cyan-500/12 text-cyan-400"
                    : "bg-slate-500/12 text-slate-400"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${sv.badge}`}
              >
                {severityLabel[incident.severity]}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
                {eventTypeLabel[incident.event_type]}
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-2 text-[16px] font-bold leading-snug text-white transition group-hover:text-orange-200">
              {incident.title}
            </h3>

            {/* Location + time */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {incident.region}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {relativeTime(incident.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Data pills */}
        {pills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <span
                key={pill}
                className="rounded-md border border-white/12 bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--text-muted)]"
              >
                {pill}
              </span>
            ))}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
