"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const mins = Math.floor(-diff / 60_000);
    if (mins < 60) return `in ${mins} minute${mins > 1 ? "s" : ""}`;
    const hrs = Math.floor(mins / 60);
    return `in ${hrs} hour${hrs > 1 ? "s" : ""}`;
  }
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
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
    if (m.signal_number != null) pills.push(`MAG ${m.signal_number}`);
    if (m.wind_speed_kph != null) pills.push(`${m.wind_speed_kph} kph`);
  } else if (incident.event_type === "volcano") {
    if (m.alert_level) pills.push(`Alert: ${String(m.alert_level)}`);
  }
  return pills;
}

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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Page heading ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400 pulse-dot" />
            <h1 className="text-xl font-bold text-white">Pulse Feed</h1>
          </div>
          <span className="text-sm text-[var(--text-dim)]">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Search bar ── */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[var(--bg-panel)] py-2.5 pl-10 pr-4 text-sm text-white placeholder-[var(--text-dim)] outline-none transition focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
          />
        </div>

        {/* ── Filter chips ── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--text-dim)]" />

          {/* Type filters */}
          {TYPE_FILTERS.map((f) => (
            <button
              key={`type-${f.value}`}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider transition ${
                typeFilter === f.value
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-[var(--text-dim)] hover:bg-white/5 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Divider */}
          <div className="mx-1 h-4 w-px bg-white/10" />

          {/* Severity filters */}
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={`sev-${f.value}`}
              type="button"
              onClick={() => setSeverityFilter(f.value)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider transition ${
                severityFilter === f.value
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-[var(--text-dim)] hover:bg-white/5 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {isLoading && incidents.length === 0 && (
          <div className="mt-12 text-center">
            <div className="loading-shimmer mx-auto h-4 w-40 rounded-full" />
            <p className="mt-3 text-xs text-[var(--text-dim)]">
              Loading events…
            </p>
          </div>
        )}

        {/* ── Event cards grid ── */}
        {filtered.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((incident) => (
              <EventCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filtered.length === 0 && incidents.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No events match your current filters.
            </p>
          </div>
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

  return (
    <Link
      href={`/pulse/${encodeURIComponent(incident.id)}`}
      className={`group block rounded-xl border border-white/8 bg-[var(--bg-panel)] p-4 transition hover:border-white/15 hover:bg-white/[0.03] border-l-2 ${sv.accent}`}
    >
      {/* Top row: icon + badges */}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            incident.severity === "critical"
              ? "bg-red-500/15 text-red-400"
              : incident.severity === "warning"
                ? "bg-orange-500/15 text-orange-400"
                : incident.severity === "watch"
                  ? "bg-cyan-500/12 text-cyan-400"
                  : "bg-slate-500/15 text-slate-400"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sv.badge}`}
            >
              {severityLabel[incident.severity]}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
              {eventTypeLabel[incident.event_type]}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-1.5 text-[14px] font-semibold leading-snug text-white transition group-hover:text-orange-200">
            {incident.title}
          </h3>

          {/* Location + time */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {incident.region}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime(incident.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Data pills */}
      {pills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pills.map((pill) => (
            <span
              key={pill}
              className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]"
            >
              {pill}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
