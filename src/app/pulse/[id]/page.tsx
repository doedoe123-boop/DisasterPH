"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ExternalLink,
  Share2,
  Copy,
  Phone,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "@/lib/incidents";
import { eventLabel, severityText, t } from "@/lib/i18n";
import { plainAlertInterpretation } from "@/lib/plain-alert";
import { visualFromSeverity } from "@/lib/severity";
import { getPrepTips } from "@/lib/prep-guidance";
import type { Incident } from "@/types/incident";
import { AppHeader } from "@/components/disasterph/header";
import { PrepGuidance } from "@/components/disasterph/prep-guidance";
import { PulseDetailSkeleton } from "@/components/disasterph/page-skeletons";
import { useLocale } from "@/hooks/useLocale";

/** Map source to display label */
function sourceLabel(incident: Incident): string {
  const labels: Record<string, string> = {
    EONET: "NASA EONET",
    PAGASA: "PAGASA",
    PHIVOLCS: "USGS/PHIVOLCS",
  };
  return labels[incident.source] ?? incident.source;
}

/** Build technical data pairs (2-column grid) from incident metadata */
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
      label: "Tsunami",
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

  rows.push({ label: "Lat", value: incident.latitude.toFixed(4) });
  rows.push({ label: "Lng", value: incident.longitude.toFixed(4) });

  return rows;
}

/** Estimate data confidence from incident source and metadata completeness */
function dataConfidence(incident: Incident): { pct: number; label: string } {
  let score = 60; // base
  if (incident.source === "PHIVOLCS" || incident.source === "PAGASA")
    score += 20;
  if (
    incident.metadata.magnitude != null ||
    incident.metadata.signal_number != null
  )
    score += 10;
  if (incident.description && incident.description.length > 40) score += 5;
  if (incident.metadata.confidence === "reference-only")
    score = Math.min(score, 65);
  const pct = Math.min(score, 99);
  const label =
    pct >= 90
      ? "High Confidence"
      : pct >= 70
        ? "Moderate Confidence"
        : "Low Confidence";
  return { pct, label };
}

/** Estimate affected areas from region and event type */
function estimateAffectedAreas(incident: Incident): string[] {
  const areas: string[] = [];
  const m = incident.metadata;

  // Use explicitly listed areas from metadata if available
  if (m.affected_areas && Array.isArray(m.affected_areas)) {
    return m.affected_areas.map(String);
  }

  // Earthquake: estimate nearby provinces based on region
  if (incident.event_type === "earthquake") {
    const regionMap: Record<string, string[]> = {
      "Davao Region": [
        "General Santos",
        "Sarangani",
        "South Cotabato",
        "Sultan Kudarat",
      ],
      CALABARZON: ["Batangas", "Laguna", "Cavite", "Quezon"],
      "Central Visayas": ["Cebu", "Bohol", "Siquijor"],
      "Eastern Visayas": ["Leyte", "Southern Leyte", "Samar"],
      "Western Visayas": ["Iloilo", "Negros Occidental", "Antique"],
      "Bicol Region": ["Albay", "Sorsogon", "Camarines Sur"],
      "National Capital Region": ["Metro Manila", "Rizal", "Bulacan"],
      "Central Luzon": ["Pampanga", "Tarlac", "Zambales", "Bataan"],
      "Northern Mindanao": ["Bukidnon", "Misamis Oriental", "Cagayan de Oro"],
      SOCCSKSARGEN: [
        "General Santos",
        "Sarangani",
        "South Cotabato",
        "Sultan Kudarat",
      ],
    };
    const found = Object.entries(regionMap).find(
      ([key]) =>
        incident.region.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(incident.region.toLowerCase()),
    );
    if (found) return found[1];
  }

  // Typhoon: use region + nearby
  if (incident.event_type === "typhoon" || incident.event_type === "flood") {
    if (incident.region) areas.push(incident.region);
  }

  // Volcano: nearby municipalities
  if (incident.event_type === "volcano") {
    const volcanoMap: Record<string, string[]> = {
      mayon: ["Albay", "Legazpi", "Daraga", "Camalig"],
      taal: ["Batangas", "Agoncillo", "Laurel", "Talisay"],
      pinatubo: ["Zambales", "Pampanga", "Tarlac"],
    };
    const title = incident.title.toLowerCase();
    for (const [key, vals] of Object.entries(volcanoMap)) {
      if (title.includes(key)) return vals;
    }
  }

  return areas.length > 0 ? areas : [];
}

export default function PulseDetailPage() {
  const params = useParams<{ id: string }>();
  const { locale } = useLocale();
  const i18n = t(locale);
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
    return <PulseDetailSkeleton />;
  }

  // Not found
  if (!incident) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {i18n.common.eventNotFound}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {i18n.common.expiredIncident}
            </p>
            <Link
              href="/pulse"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-overlay/10 bg-[var(--bg-panel)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
            >
              <ArrowLeft className="h-4 w-4" />
              {i18n.common.backToPulse}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const sv = visualFromSeverity(incident.severity);
  const confidence = dataConfidence(incident);
  const confidenceLabel =
    locale === "fil"
      ? confidence.pct >= 90
        ? "Mataas na Tiwala"
        : confidence.pct >= 70
          ? "Katamtamang Tiwala"
          : "Mababang Tiwala"
      : confidence.label;
  const affectedAreas = estimateAffectedAreas(incident);

  return (
    <ShareDropdownContext incident={incident}>
      {(shareDropdown) => (
        <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
          <AppHeader />

          {/* ── Back button bar ── */}
          <div className="px-4 pt-4 pb-2 sm:px-6 lg:px-8">
            <Link
              href="/pulse"
              className="inline-flex items-center gap-2 rounded-lg border border-overlay/10 bg-[var(--bg-panel)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
            >
              <ArrowLeft className="h-4 w-4" />
              {i18n.common.back}
            </Link>
          </div>

          {/* ── Divider ── */}
          <div className="mx-4 sm:mx-6 lg:mx-8" />

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 md:pb-8 sm:px-6 lg:px-8">
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
                  {severityText(incident.severity, locale)}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                  {eventLabel(incident.event_type, locale)}
                </span>
                <span className="text-[11px] text-[var(--text-dim)]">
                  via {sourceLabel(incident)}
                </span>
              </div>

              {/* Title */}
              <h1 className="mt-3 text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl">
                {incident.title}
              </h1>

              <p className="mt-4 max-w-3xl rounded-xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm font-medium leading-6 text-[var(--text-primary)]">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                  {i18n.common.whatThisMeans}
                </span>
                {plainAlertInterpretation(incident, locale)}
              </p>

              {/* Meta row + Share button */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {incident.region}
                  </span>
                  <span
                    className="flex items-center gap-1.5"
                    suppressHydrationWarning
                  >
                    <Clock className="h-4 w-4" />
                    {formatDateTime(incident.updated_at)}
                  </span>
                </div>
                {shareDropdown}
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
                {/* Data confidence bar */}
                <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {i18n.common.dataConfidence}
                    </span>
                    <span className="text-sm font-semibold text-orange-400">
                      {confidence.pct}% — {confidenceLabel}
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-overlay/10">
                    <motion.div
                      className="h-full rounded-full bg-orange-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence.pct}%` }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                  </div>
                </div>

                {/* Description box */}
                <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
                  <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                    {incident.description ||
                      i18n.common.noDescription}
                  </p>
                </div>

                {/* What to do */}
                {prepTips.length > 0 && (
                  <PrepGuidance
                    tips={prepTips}
                    title={i18n.common.whatToDoNow}
                    subtitle={i18n.common.actionSubtitle}
                  />
                )}
              </div>

              {/* Right column */}
              <aside className="space-y-6">
                {/* Technical data — 2-column grid */}
                {techData.length > 0 && (
                  <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {i18n.common.technicalData}
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {techData.map((row) => (
                        <div key={row.label}>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                            {row.label}
                          </p>
                          <p className="mt-1 font-mono text-lg font-bold text-[var(--text-primary)]">
                            {row.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {i18n.common.emergencyContacts}
                  </h2>
                  <div className="mt-3 space-y-3">
                    <a
                      href="tel:+6328911-1406"
                      className="flex items-center gap-3 rounded-lg border border-overlay/5 bg-overlay/[0.02] p-3 transition hover:bg-overlay/[0.05]"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-cyan-400" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          NDRRMC
                        </p>
                        <p className="text-xs text-[var(--text-dim)]">
                          +63 2 8911-1406
                        </p>
                      </div>
                    </a>
                    <a
                      href="tel:143"
                      className="flex items-center gap-3 rounded-lg border border-overlay/5 bg-overlay/[0.02] p-3 transition hover:bg-overlay/[0.05]"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-cyan-400" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Red Cross PH
                        </p>
                        <p className="text-xs text-[var(--text-dim)]">143</p>
                      </div>
                    </a>
                  </div>
                </div>

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
                  className="flex items-center gap-3 rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-4 transition hover:bg-overlay/[0.04]"
                >
                  <ExternalLink className="h-5 w-5 shrink-0 text-cyan-400" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {i18n.common.officialBulletin}
                    </p>
                    <p className="text-[11px] text-[var(--text-dim)]">
                      {i18n.common.viewSourceAt} {sourceLabel(incident)}
                    </p>
                  </div>
                </a>
              </aside>
            </motion.div>

            {/* ── Affected Areas (full width) ── */}
            {affectedAreas.length > 0 && (
              <motion.div
                className="mt-6 rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  {i18n.common.affectedAreas}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {affectedAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-overlay/10 bg-overlay/[0.04] px-3 py-1 text-sm text-[var(--text-primary)]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </main>
        </div>
      )}
    </ShareDropdownContext>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Share dropdown – extracted to keep the main component clean
   ───────────────────────────────────────────────────────────────────────── */
function ShareDropdownContext({
  incident,
  children,
}: {
  incident: Incident;
  children: (dropdown: React.ReactNode) => React.ReactNode;
}) {
  const { locale } = useLocale();
  const i18n = t(locale);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/pulse/${encodeURIComponent(incident.id)}`;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const shareText = `${incident.title} — ${incident.region}`;

  const dropdown = (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-overlay/10 bg-[var(--bg-panel)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
      >
        <Share2 className="h-4 w-4" />
        {i18n.common.share}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-overlay/10 bg-[var(--bg-panel-strong)] shadow-xl"
          >
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
            >
              <Copy className="h-4 w-4 text-[var(--text-dim)]" />
              {copied ? i18n.common.copied : i18n.common.copyLink}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
            >
              <Globe className="h-4 w-4 text-[var(--text-dim)]" />
              {i18n.common.postToX}
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
            >
              <Globe className="h-4 w-4 text-[var(--text-dim)]" />
              {i18n.common.shareFacebook}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return <>{children(dropdown)}</>;
}
