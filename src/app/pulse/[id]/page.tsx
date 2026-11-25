"use client";

import { displayRegion } from "@/lib/geo/ph-regions";
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
import { eventTimeFull } from "@/lib/event-time";
import { sourceInfo } from "@/lib/source-info";
import { EMERGENCY_NUMBER, agencyLine } from "@/lib/hotlines";
import { SiteDisclaimer } from "@/components/disasterph/site-disclaimer";
import { eventLabel, severityText, t, type Locale } from "@/lib/i18n";
import { plainAlertInterpretation } from "@/lib/plain-alert";
import { visualFromSeverity } from "@/lib/severity";
import { getPrepTips } from "@/lib/prep-guidance";
import type { Incident } from "@/types/incident";
import { AppHeader } from "@/components/disasterph/header";
import { PrepGuidance } from "@/components/disasterph/prep-guidance";
import { VolcanoBulletin } from "@/components/disasterph/volcano-bulletin";
import { TyphoonBulletin } from "@/components/disasterph/typhoon-bulletin";
import { QuakeBulletin } from "@/components/disasterph/quake-bulletin";
import { PHIVOLCS_TSUNAMI_URL, showTsunamiPointer } from "@/lib/tsunami-check";
import { PulseDetailSkeleton } from "@/components/disasterph/page-skeletons";
import { useLocale } from "@/hooks/useLocale";

/** Map source to display label */
function sourceLabel(incident: Incident): string {
  const labels: Record<string, string> = {
    EONET: "NASA EONET",
    PAGASA: "PAGASA",
    PHIVOLCS: "PHIVOLCS",
    // Fallback earthquake source while PHIVOLCS is unavailable.
    USGS: "USGS",
  };
  return labels[incident.source] ?? incident.source;
}

/** Build technical data pairs (2-column grid) from incident metadata */
function technicalData(
  incident: Incident,
  locale: Locale,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const m = incident.metadata;

  if (incident.event_type === "earthquake") {
    if (m.magnitude != null)
      rows.push({
        label: locale === "fil" ? "Lakas" : "Magnitude",
        value: String(Number(m.magnitude).toFixed(1)),
      });
    if (m.depth_km != null)
      rows.push({
        label: locale === "fil" ? "Lalim" : "Depth",
        value: `${Number(m.depth_km).toFixed(0)} km`,
      });
    if (m.felt_reports != null)
      rows.push({
        label: locale === "fil" ? "Mga Ulat ng Naramdaman" : "Felt Reports",
        value: String(m.felt_reports),
      });
    // No tsunami row: no source DisasterPH reads states a tsunami status.
    // Strong shallow quakes get a pointer to PHIVOLCS instead (TsunamiPointer).
  } else if (incident.event_type === "typhoon") {
    if (m.signal_number != null)
      rows.push({
        label: locale === "fil" ? "Bilang ng Signal" : "Signal Number",
        value: String(m.signal_number),
      });
    if (m.wind_speed_kph != null)
      rows.push({
        label: locale === "fil" ? "Lakas ng Hangin" : "Wind Speed",
        value: `${m.wind_speed_kph} kph`,
      });
    if (m.movement != null)
      rows.push({
        label: locale === "fil" ? "Galaw" : "Movement",
        value: String(m.movement),
      });
  } else if (incident.event_type === "volcano") {
    if (m.alert_level)
      rows.push({
        label: locale === "fil" ? "Antas ng Alerto" : "Alert Level",
        value: String(m.alert_level),
      });
  }

  rows.push({ label: "Lat", value: incident.latitude.toFixed(4) });
  rows.push({ label: locale === "fil" ? "Long" : "Lng", value: incident.longitude.toFixed(4) });

  return rows;
}

/**
 * Areas the official bulletin itself names: provinces under a PAGASA wind
 * signal, or the province in a PHIVOLCS volcano bulletin. Nothing is inferred
 * from the region (earthquake felt areas are in QuakeBulletin).
 */
function bulletinAreas(incident: Incident): string[] {
  const m = incident.metadata;
  if (incident.event_type === "typhoon" && typeof m.signal_provinces === "string" && m.signal_provinces) {
    return m.signal_provinces.split("|");
  }
  if (incident.event_type === "volcano" && typeof m.province === "string" && m.province) {
    return [m.province];
  }
  return [];
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
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void fetchIncident();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchIncident]);

  const prepTips = useMemo(
    () => (incident ? getPrepTips(incident.event_type, incident.severity) : []),
    [incident],
  );

  const techData = useMemo(
    () => (incident ? technicalData(incident, locale) : []),
    [incident, locale],
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
  const source = sourceInfo(incident);
  const affectedAreas = bulletinAreas(incident);

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
                    {displayRegion(incident.region, locale)}
                  </span>
                  <span
                    className="flex items-center gap-1.5"
                    suppressHydrationWarning
                  >
                    <Clock className="h-4 w-4" />
                    {eventTimeFull(incident, locale)}
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
                {/* Source and freshness (replaces a computed confidence score) */}
                <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {i18n.common.source.heading}
                  </h2>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                        {i18n.common.source.publishedBy}
                      </dt>
                      <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                        {i18n.common.source.publishers[source.publisher]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                        {i18n.common.source.updated}
                      </dt>
                      <dd
                        className="mt-0.5 font-medium text-[var(--text-primary)]"
                        suppressHydrationWarning
                      >
                        {eventTimeFull(incident, locale)}
                      </dd>
                    </div>
                  </dl>
                  {(source.publisher === "USGS" || source.referenceOnly) && (
                    <p className="mt-3 text-[12px] leading-5 text-[var(--text-muted)]">
                      {source.referenceOnly
                        ? i18n.common.source.referenceOnly
                        : i18n.common.source.usgsNote}
                    </p>
                  )}
                  {source.recordUrl && (
                    <a
                      className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-cyan-400 hover:text-cyan-300"
                      href={source.recordUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {i18n.common.source.record}
                    </a>
                  )}
                </div>

                {/* Description box */}
                <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
                  <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                    {incident.description ||
                      i18n.common.noDescription}
                  </p>
                </div>

                {/* Strong, shallow quakes: point to PHIVOLCS Tsunami Information (no status of our own) */}
                {showTsunamiPointer(incident) && (
                  <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-[var(--text-primary)]">
                    <p>{i18n.common.tsunami.pointer}</p>
                    <a
                      className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-cyan-400 hover:text-cyan-300"
                      href={PHIVOLCS_TSUNAMI_URL}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {i18n.common.tsunami.link}
                    </a>
                  </div>
                )}

                {/* Official PHIVOLCS earthquake bulletin: felt intensities, damage, map */}
                {incident.event_type === "earthquake" && incident.source === "PHIVOLCS" && (
                  <QuakeBulletin incident={incident} locale={locale} />
                )}

                {/* Official PHIVOLCS volcano bulletin */}
                {incident.event_type === "volcano" && incident.source === "PHIVOLCS" && (
                  <VolcanoBulletin incident={incident} locale={locale} />
                )}

                {/* Official PAGASA tropical cyclone bulletin */}
                {incident.event_type === "typhoon" && incident.source === "PAGASA" && (
                  <TyphoonBulletin incident={incident} locale={locale} />
                )}

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

                {/* Emergency Contacts: 911 first, then agency lines */}
                <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {i18n.common.emergencyContacts}
                  </h2>
                  <div className="mt-3 space-y-3">
                    <a
                      href={`tel:${EMERGENCY_NUMBER.dial}`}
                      className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/12 p-3 transition hover:bg-red-500/20"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-red-300" />
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                          {i18n.hotlines.call} {EMERGENCY_NUMBER.number}
                        </p>
                        <p className="text-xs text-[var(--text-dim)]">
                          {i18n.hotlines.emergencyBody}
                        </p>
                      </div>
                    </a>
                    {[agencyLine("ndrrmc"), agencyLine("red-cross")].map((line) => (
                      <a
                        key={line.id}
                        href={`tel:${line.dial}`}
                        className="flex items-center gap-3 rounded-lg border border-overlay/5 bg-overlay/[0.02] p-3 transition hover:bg-overlay/[0.05]"
                      >
                        <Phone className="h-4 w-4 shrink-0 text-cyan-400" />
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {line.name}
                          </p>
                          <p className="text-xs text-[var(--text-dim)]">
                            {line.number} · {i18n.hotlines.purpose[line.purpose]}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Responsible Philippine agency (not a link to a specific bulletin) */}
                {source.agency && (
                <a
                  href={source.agency.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-4 transition hover:bg-overlay/[0.04]"
                >
                  <ExternalLink className="h-5 w-5 shrink-0 text-cyan-400" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {i18n.common.source.agencyLink} {source.agency.name}
                    </p>
                  </div>
                </a>
                )}
                <SiteDisclaimer className="px-1" />
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

  const shareText = `${incident.title} — ${displayRegion(incident.region, locale)}`;

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
