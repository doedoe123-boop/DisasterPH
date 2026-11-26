"use client";

import Link from "next/link";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ExternalLink, MapPinned, X } from "lucide-react";
import type { Incident, SourceStatus } from "@/types/incident";
import { eventLabel, t, type Locale } from "@/lib/i18n";
import { eventTimeFull, eventTimeWithAge, dateOnlyBulletin, formatBulletinDay } from "@/lib/event-time";
import { formatRelativeTime } from "@/lib/incidents";
import { sourceInfo } from "@/lib/source-info";
import { displayRegion } from "@/lib/geo/ph-regions";
import { intensityGroups, ROMAN_NUMERALS } from "@/lib/quake-intensity";
import { PHIVOLCS_TSUNAMI_URL, showTsunamiPointer } from "@/lib/tsunami-check";
import { pdzRadiusKm, placeChecks, type PlaceCheck } from "@/lib/danger-zone";
import { useSavedPlaces } from "@/hooks/use-saved-places";

/**
 * One event, in the order the map handoff asks for: what and how recent,
 * where, two key numbers, what it means, what to do, links, source and
 * freshness. Only text an agency published is quoted as theirs (bulletin
 * status names, "should not be allowed", hazards, PAGASA's what-to-do,
 * PHIVOLCS's damage/aftershock expectation and reported intensities); a row
 * is left out when its data isn't available. Rendered as the phone bottom
 * sheet and the desktop popover.
 */

const lines = (v: unknown) => (typeof v === "string" ? v.split("\n").map((s) => s.trim()).filter(Boolean) : []);

/** Earthquake bulletin details (felt intensities etc.) are fetched on open. */
function useQuakeDetails(incident: Incident): Incident {
  const [details, setDetails] = useState<{ id: string; data: Incident } | null>(null);
  const wants = incident.event_type === "earthquake" && incident.source === "PHIVOLCS" && incident.metadata.eq_bulletin_loaded !== true;
  useEffect(() => {
    if (!wants) return;
    const ctrl = new AbortController();
    fetch(`/api/incidents/${encodeURIComponent(incident.id)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: unknown } | null) => {
        // Only a single event with the same id (a cached or unexpected
        // response must never replace the card's data).
        const d = j?.data as Incident | undefined;
        if (d && !Array.isArray(d) && typeof d === "object" && d.id === incident.id && d.metadata && typeof d.metadata === "object") {
          setDetails({ id: incident.id, data: d });
        }
      })
      .catch(() => {
        /* offline or aborted: the card shows what it has */
      });
    return () => ctrl.abort();
  }, [incident.id, wants]);
  return details && details.id === incident.id ? details.data : incident;
}

/**
 * If the card ever fails to render, show the title, a link to the event page
 * and a close button instead of taking the whole page (map, list) down.
 */
class CardBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type CardProps = {
  incident: Incident;
  locale: Locale;
  sourceStatuses: SourceStatus[];
  onClose: () => void;
  variant: "sheet" | "popover";
};

export function EventCard(props: CardProps) {
  const copy = t(props.locale).common.card;
  const fallback = (
    <div className="flex items-start gap-2 p-3.5 text-[13px]">
      <Link href={`/pulse/${encodeURIComponent(props.incident.id)}`} className="flex-1 font-semibold underline">
        {props.incident.title}
      </Link>
      <button type="button" onClick={props.onClose} aria-label={copy.close} className="flex h-11 w-11 items-center justify-center">
        <X aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
  // Keyed by event: a failure on one event doesn't stick to the next.
  return (
    <CardBoundary key={props.incident.id} fallback={fallback}>
      <EventCardBody {...props} />
    </CardBoundary>
  );
}

function EventCardBody({
  incident: base,
  locale,
  sourceStatuses,
  onClose,
  variant,
}: CardProps) {
  const incident = useQuakeDetails(base);
  const copy = t(locale).common.card;
  // Saved places stay on this device; the check runs here.
  const { places } = useSavedPlaces();
  const checks = placeChecks(incident, places);
  const m = incident.metadata;
  const source = sourceInfo(incident);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the card when it opens (keyboard and screen-reader users
  // land on what they chose; Escape or the close button returns).
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [base.id]);

  const statusKey = incident.source === "PHIVOLCS" && incident.event_type === "volcano" ? "PHIVOLCS_VOLCANO" : incident.source;
  const status = sourceStatuses.find((s) => s.source === statusKey);
  const checked = status?.last_success_at ? formatRelativeTime(status.last_success_at, locale) : null;
  const lat = incident.latitude.toFixed(4);
  const lng = incident.longitude.toFixed(4);

  // ── Header badge, heading and sub-line per hazard ──
  let badge: string | null = null;
  let heading = incident.title;
  let subline: string | null = null;
  const stats: Array<{ label: string; value: string }> = [];
  let meaning: Array<{ title?: string; items: string[] }> = [];
  let todo: { title: string; items: string[] } | null = null;
  let bigNumber: string | null = null;

  if (incident.event_type === "volcano") {
    const level = Number(m.alert_level);
    badge = Number.isFinite(level) ? copy.alertBadge.replace("{n}", String(level)) : null;
    heading = incident.title.split(" — ")[0];
    const place = [typeof m.province === "string" ? m.province : null, incident.region].filter(Boolean).join(", ");
    subline = [typeof m.alert_status === "string" ? m.alert_status : null, place].filter(Boolean).join(" · ") || null;
    const pdz = Number(m.pdz_radius_km);
    if (Number.isFinite(pdz) && pdz > 0) stats.push({ label: copy.dangerZone, value: copy.radiusKm.replace("{n}", String(pdz)) });
    const day = dateOnlyBulletin(incident);
    if (day) stats.push({ label: copy.bulletin, value: formatBulletinDay(day) });
    if (typeof m.alert_status === "string" && m.alert_status)
      meaning.push({ items: [copy.volcanoMeaning.replace("{n}", String(level)).replace("{status}", m.alert_status)] });
    const hazards = lines(m.hazards);
    if (hazards.length) meaning.push({ title: copy.hazards, items: hazards });
    const notAllowed = lines(m.prohibited);
    if (notAllowed.length) todo = { title: copy.notAllowed, items: notAllowed };
  } else if (incident.event_type === "earthquake") {
    badge = eventTimeWithAge(incident, locale, { compact: true }).split(" · ")[0];
    const mag = Number(m.magnitude);
    bigNumber = Number.isFinite(mag) ? (typeof m.eq_magnitude_text === "string" ? m.eq_magnitude_text : `M${mag.toFixed(1)}`) : null;
    heading = incident.title.replace(/^M\d+(\.\d)? · /, "");
    // PHIVOLCS's own location text, then the region (useful for offshore quakes).
    subline = [typeof m.source_place === "string" ? m.source_place : null, incident.region ? displayRegion(incident.region, locale) : null]
      .filter(Boolean)
      .join(" · ") || null;
    if (m.depth_km != null) stats.push({ label: copy.depth, value: `${Number(m.depth_km).toFixed(0)} km` });
    stats.push({ label: copy.time, value: eventTimeFull(incident, locale) });
    // Reported intensity, only from the PHIVOLCS bulletin; never estimated.
    const top = intensityGroups(m.eq_reported_intensities)[0];
    // As the bulletin writes it ("Intensity V"); no scale name of our own.
    if (top) meaning.push({ items: [copy.reportedIntensity.replace("{n}", ROMAN_NUMERALS[top.level]).replace("{places}", top.places)] });
    const yesNo = (v: unknown) => (v === true ? copy.yes : v === false ? copy.no : null);
    const dmg = yesNo(m.eq_expecting_damage);
    const aft = yesNo(m.eq_expecting_aftershocks);
    if (dmg || aft) meaning.push({ items: [copy.expectations.replace("{damage}", dmg ?? copy.notStated).replace("{aftershocks}", aft ?? copy.notStated)] });
    if (typeof m.eq_remarks === "string") meaning.push({ items: [m.eq_remarks] });
  } else if (incident.event_type === "typhoon") {
    const signal = Number(m.signal_number);
    badge = Number.isFinite(signal) && signal > 0 ? copy.signalBadge.replace("{n}", String(signal)) : copy.noSignal;
    heading = incident.title.split(" — ")[0];
    subline = typeof m.center_text === "string" ? m.center_text : null;
    if (m.wind_speed_kph != null)
      stats.push({ label: copy.wind, value: `${m.wind_speed_kph} km/h${m.gust_kph != null ? ` · ${copy.gust} ${m.gust_kph}` : ""}` });
    stats.push({ label: copy.bulletin, value: eventTimeFull(incident, locale) });
    const doNow = lines(m.what_to_do);
    if (doNow.length) todo = { title: copy.pagasaWhatToDo, items: doNow };
    else if (lines(m.precautions).length) todo = { title: copy.pagasaPrecautions, items: lines(m.precautions) };
  } else {
    badge = eventLabel(incident.event_type, locale);
    stats.push({ label: copy.time, value: eventTimeFull(incident, locale) });
    meaning = [{ items: [copy.referenceOnly] }];
  }

  const pad = variant === "popover" ? "p-3.5" : "px-4 pb-4 pt-1";
  return (
    <article
      className={`event-card text-[13px] leading-5 text-[var(--text-primary)] ${pad}`}
      aria-labelledby={`card-${incident.id}`}
    >
      {/* 1. Type and badge */}
      <div className="flex items-start gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {eventLabel(incident.event_type, locale)}
        </span>
        {badge && (
          <span className="event-card-badge rounded-md border border-orange-500/40 bg-orange-500/12 px-1.5 py-0.5 text-[11px] font-bold text-orange-300" suppressHydrationWarning>
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="-mr-2 -mt-2 ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-dim)] hover:bg-overlay/8 hover:text-[var(--text-primary)]"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Name / magnitude and place */}
      <div className="-mt-3 flex items-baseline gap-2.5">
        {bigNumber && <span className="whitespace-nowrap text-[26px] font-bold leading-none tabular-nums">{bigNumber}</span>}
        <h2 id={`card-${incident.id}`} ref={headingRef} tabIndex={-1} className="text-[16px] font-bold leading-snug outline-none">
          {heading}
        </h2>
      </div>
      {subline && <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{subline}</p>}

      {/* 3. Two key numbers */}
      {stats.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-2">
          {stats.slice(0, 2).map((s) => (
            <div key={s.label} className="rounded-lg border border-overlay/8 bg-overlay/[0.03] px-2.5 py-2">
              <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">{s.label}</dt>
              <dd className="mt-0.5 font-semibold" suppressHydrationWarning>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Tsunami pointer (only for strong, shallow quakes; never a status) */}
      {showTsunamiPointer(incident) && (
        <p className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.07] p-2.5 text-[12px]">
          {t(locale).common.tsunami.pointer}{" "}
          <a className="font-semibold text-cyan-400 underline" href={PHIVOLCS_TSUNAMI_URL} target="_blank" rel="noopener noreferrer">
            {t(locale).common.tsunami.link}
          </a>
        </p>
      )}

      {/* 4. What this means (agency wording only) */}
      {meaning.length > 0 && (
        <section className="mt-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">{copy.whatItMeans}</h3>
          {meaning.map((block, i) => (
            <div key={i} className="mt-1">
              {block.title && <p className="font-semibold">{block.title}</p>}
              {block.items.length === 1 && !block.title ? (
                <p>{block.items[0]}</p>
              ) : (
                <ul className="list-disc space-y-0.5 pl-5">
                  {block.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 5. What to do (agency wording) */}
      {todo && (
        <section className="mt-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">{copy.whatToDo}</h3>
          <p className="mt-1 font-semibold">{todo.title}</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {todo.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      {/* 6. Saved places: distance, inside/outside the danger zone, never a safety claim */}
      {checks.length > 0 && <SavedPlaceLines checks={checks} incident={incident} locale={locale} />}

      {/* Links */}
      <div className="mt-3 flex flex-wrap gap-2">
        {source.recordUrl && (
          <a href={source.recordUrl} target="_blank" rel="noopener noreferrer" className="event-card-btn inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-overlay/15 px-3 font-semibold hover:bg-overlay/6">
            <ExternalLink aria-hidden className="h-4 w-4" />
            {incident.event_type === "earthquake" ? copy.officialRecord : copy.officialBulletin}
          </a>
        )}
        <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="event-card-btn inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-overlay/15 px-3 font-semibold hover:bg-overlay/6">
          <MapPinned aria-hidden className="h-4 w-4" />
          {copy.openInMaps}
        </a>
        <Link href={`/pulse/${encodeURIComponent(incident.id)}`} className="event-card-btn inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-overlay/15 px-3 font-semibold hover:bg-overlay/6">
          <ArrowUpRight aria-hidden className="h-4 w-4" />
          {copy.details}
        </Link>
      </div>

      {/* 7. Source and freshness */}
      <p className="mt-3 border-t border-overlay/8 pt-2 text-[11.5px] text-[var(--text-dim)]" suppressHydrationWarning>
        {copy.source.replace("{source}", t(locale).common.source.publishers[source.publisher])}
        {checked ? ` · ${copy.checked.replace("{age}", checked)}` : ""}
        {source.publisher === "USGS" ? ` · ${copy.usgsFallback}` : ""}
      </p>
    </article>
  );
}

function placeSentence(check: PlaceCheck, incident: Incident, locale: Locale): string {
  const copy = t(locale).common.card;
  const fill = (tpl: string) =>
    tpl
      .replace("{place}", check.place.label)
      .replace("{km}", String(check.distanceKm ?? ""))
      .replace("{zone}", String(pdzRadiusKm(incident)))
      .replace("{region}", check.region ?? "");
  switch (check.relation) {
    case "inside": return fill(copy.placeInside);
    case "edge": return fill(copy.placeEdge);
    case "outside": return fill(copy.placeOutside);
    case "signal": return fill(copy.placeSignal);
    default: return fill(incident.event_type === "volcano" ? copy.placeNearVolcano : copy.placeNearQuake);
  }
}

/** The saved-place lines on a card. Inside (or at the edge of) a danger zone is stated plainly, with the bulletin's own line. */
function SavedPlaceLines({ checks, incident, locale }: { checks: PlaceCheck[]; incident: Incident; locale: Locale }) {
  const copy = t(locale).common.card;
  const serious = checks.some((c) => c.relation === "inside" || c.relation === "edge");
  const pdzLine = lines(incident.metadata.prohibited).find((l) => /permanent danger zone|\bPDZ\b/i.test(l));
  return (
    <section
      className={`saved-place-lines mt-3 rounded-lg border p-2.5 ${serious ? "is-serious border-red-500/50 bg-red-500/10" : "border-overlay/12 bg-overlay/[0.03]"}`}
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">{copy.yourPlaces}</h3>
      <ul className="mt-1 space-y-1">
        {checks.map((c) => (
          <li key={c.place.id} className={c.relation === "inside" ? "font-semibold" : undefined}>
            {placeSentence(c, incident, locale)}
          </li>
        ))}
      </ul>
      {serious && (
        <p className="mt-1.5">
          {pdzLine ? copy.insideQuote.replace("{line}", pdzLine.replace(/\.$/, "")) + " " : ""}
          {copy.insideAdvice}
        </p>
      )}
      <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">{copy.notSafetyConfirmation}</p>
    </section>
  );
}
