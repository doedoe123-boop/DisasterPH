"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CircleCheckBig,
  ExternalLink,
  Waves,
  Wind,
  Droplets,
  Mountain,
  TriangleAlert,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { eventTypeLabel, formatDateTime } from "@/lib/incidents";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import { getPrepTips } from "@/lib/prep-guidance";
import type { Incident } from "@/types/incident";
import { AppHeader } from "@/components/disasterph/header";

const HAZARD_ICON: Record<string, typeof Waves> = {
  earthquake: Waves,
  typhoon: Wind,
  flood: Droplets,
  volcano: Mountain,
  landslide: TriangleAlert,
  wildfire: AlertTriangle,
};

/** Map source to display label */
function sourceLabel(incident: Incident): string {
  const labels: Record<string, string> = {
    EONET: "NASA EONET",
    PAGASA: "PAGASA",
    PHIVOLCS: "USGS/PHIVOLCS",
  };
  return labels[incident.source] ?? incident.source;
}

/** Build technical data rows from incident metadata */
function technicalData(
  incident: Incident,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const m = incident.metadata;

  if (incident.event_type === "earthquake") {
    if (m.magnitude != null)
      rows.push({
        label: "Magnitude",
        value: String(Number(m.magnitude).toFixed(1)),
      });
    if (m.depth_km != null)
      rows.push({
        label: "Depth",
        value: `${Number(m.depth_km).toFixed(0)} km`,
      });
    if (m.felt_reports != null)
      rows.push({ label: "Felt Reports", value: String(m.felt_reports) });
    rows.push({
      label: "Tsunami Warning",
      value: m.tsunami_warning ? "Yes" : "No",
    });
  } else if (incident.event_type === "typhoon") {
    if (m.signal_number != null)
      rows.push({ label: "Signal Number", value: String(m.signal_number) });
    if (m.wind_speed_kph != null)
      rows.push({ label: "Wind Speed", value: `${m.wind_speed_kph} kph` });
    if (m.movement != null)
      rows.push({ label: "Movement", value: String(m.movement) });
  } else if (incident.event_type === "volcano") {
    if (m.alert_level)
      rows.push({ label: "Alert Level", value: String(m.alert_level) });
  }

  rows.push({ label: "Latitude", value: incident.latitude.toFixed(4) });
  rows.push({ label: "Longitude", value: incident.longitude.toFixed(4) });

  return rows;
}

export default function PulseDetailPage() {
  const params = useParams<{ id: string }>();
  const decodedId = decodeURIComponent(params.id ?? "");
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncident = useCallback(async () => {
    if (!decodedId) return;
    try {
      const res = await fetch(
        `/api/incidents/${encodeURIComponent(decodedId)}`,
      );
      if (!res.ok) {
        setIncident(null);
        return;
      }
      const json = await res.json();
      setIncident(json.data);
    } catch {
      setIncident(null);
    } finally {
      setIsLoading(false);
    }
  }, [decodedId]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const prepTips = useMemo(
    () => (incident ? getPrepTips(incident.event_type, incident.severity) : []),
    [incident],
  );

  const techData = useMemo(
    () => (incident ? technicalData(incident) : []),
    [incident],
  );

  // Loading state
  if (isLoading && !incident) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="loading-shimmer mx-auto h-4 w-48 rounded-full" />
            <p className="mt-3 text-xs text-[var(--text-dim)]">
              Loading incident details…
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Not found
  if (!incident) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Event Not Found</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              This incident may have expired or is no longer active.
            </p>
            <Link
              href="/pulse"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--bg-panel)] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pulse Feed
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const sv = visualFromSeverity(incident.severity);
  const Icon = HAZARD_ICON[incident.event_type] ?? AlertTriangle;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />

      {/* ── Back button ── */}
      <div className="border-b border-white/5 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/pulse"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--bg-panel)] px-3 py-1.5 text-sm text-white transition hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Hero Section ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Badges + source line */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${sv.badge}`}
            >
              {severityLabel[incident.severity]}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
              {eventTypeLabel[incident.event_type]}
            </span>
            <span className="text-[11px] text-[var(--text-dim)]">
              via {sourceLabel(incident)}
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
            {incident.title}
          </h1>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {incident.region}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDateTime(incident.updated_at)}
            </span>
          </div>
        </motion.div>

        {/* ── Content grid ── */}
        <motion.div
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: 0.15,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {/* Left column */}
          <div className="space-y-6">
            {/* Description box */}
            <div className="rounded-xl border border-white/8 bg-[var(--bg-panel)] p-5">
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                {incident.description ||
                  "No detailed description available for this event."}
              </p>
            </div>

            {/* What to do */}
            {prepTips.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-[var(--bg-panel)] p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  What to Do
                </h2>
                <div className="mt-3 space-y-2.5">
                  {prepTips.map((tip) => (
                    <div key={tip.id} className="flex items-start gap-2.5">
                      <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      <span className="text-sm text-white">{tip.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Technical data */}
            {techData.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-[var(--bg-panel)] p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  Technical Data
                </h2>
                <div className="mt-3 space-y-2.5">
                  {techData.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0"
                    >
                      <span className="text-sm text-[var(--text-muted)]">
                        {row.label}
                      </span>
                      <span className="font-mono text-sm font-semibold text-white">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Bulletin link */}
            <a
              href={
                incident.source === "PHIVOLCS"
                  ? "https://earthquake.phivolcs.dost.gov.ph/"
                  : incident.source === "PAGASA"
                    ? "https://www.pagasa.dost.gov.ph/"
                    : "https://eonet.gsfc.nasa.gov/"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-[var(--bg-panel)] p-4 transition hover:bg-white/[0.04]"
            >
              <ExternalLink className="h-5 w-5 shrink-0 text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Official Bulletin
                </p>
                <p className="text-[11px] text-[var(--text-dim)]">
                  View source at {sourceLabel(incident)}
                </p>
              </div>
            </a>
          </aside>
        </motion.div>
      </main>
    </div>
  );
}
