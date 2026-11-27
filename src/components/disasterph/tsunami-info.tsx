"use client";

import { useState } from "react";
import { ExternalLink, Siren } from "lucide-react";
import type { Incident } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/incidents";

/*
 * PHIVOLCS Tsunami Information in the UI: always PHIVOLCS's own words (the
 * heading, evaluation, recommended action, areas and arrival window), with a
 * plain note when a newer bulletin exists only as a PDF that DisasterPH
 * cannot read. Plain text only (React escapes it).
 */

function lines(value: unknown): string[] {
  return typeof value === "string" ? value.split("\n").map((s) => s.trim()).filter(Boolean) : [];
}

/** Only https links on PHIVOLCS hosts. */
function phivolcsLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)phivolcs\.dost\.gov\.ph$/.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

const TONE: Record<string, string> = {
  warning: "tsunami-tone-warning border-red-500/50 bg-red-500/12",
  advisory: "tsunami-tone-advisory border-amber-400/50 bg-amber-400/12",
  other: "tsunami-tone-advisory border-amber-400/50 bg-amber-400/12",
  none: "border-cyan-400/30 bg-cyan-400/[0.07]",
};

function NewerPdf({ n, old, url, locale }: { n: unknown; old: unknown; url: unknown; locale: Locale }) {
  const link = phivolcsLink(url);
  if (n == null || !link) return null;
  const copy = t(locale).common.card;
  return (
    <div className="mt-2 rounded-md border border-current/30 p-2">
      <p className="font-semibold">{copy.tsunamiNewerPdf.replace("{n}", String(n)).replace("{old}", String(old ?? "?"))}</p>
      <a className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold underline" href={link} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden className="h-4 w-4" />
        {copy.tsunamiOpenNewer.replace("{n}", String(n))}
      </a>
    </div>
  );
}

/** On an earthquake's card and page: PHIVOLCS's Tsunami Information for it, if any. */
export function TsunamiInfoBox({ incident, locale }: { incident: Incident; locale: Locale }) {
  const m = incident.metadata;
  if (typeof m.tsunami_heading !== "string" && m.tsunami_newer_pdf_no == null) return null;
  const copy = t(locale).common.card;
  const kind = typeof m.tsunami_kind === "string" ? m.tsunami_kind : "other";
  const link = phivolcsLink(m.tsunami_url);
  return (
    <div className={`tsunami-box mt-3 rounded-lg border p-2.5 text-[12.5px] leading-5 ${TONE[kind] ?? TONE.other}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80" suppressHydrationWarning>
        {copy.tsunamiInfo.replace("{n}", String(m.tsunami_no ?? "?"))}
        {typeof m.tsunami_issued_at === "string" ? ` · ${copy.tsunamiIssued.replace("{time}", formatDateTime(m.tsunami_issued_at))}` : ""}
      </p>
      {typeof m.tsunami_heading === "string" && <p className="mt-0.5 font-bold">{m.tsunami_heading}</p>}
      {lines(m.tsunami_evaluation).map((l) => <p key={l} className="mt-1">{l}</p>)}
      <NewerPdf n={m.tsunami_newer_pdf_no} old={m.tsunami_no} url={m.tsunami_newer_pdf_url} locale={locale} />
      {link && (
        <a className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold underline" href={link} target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden className="h-4 w-4" />
          {copy.tsunamiRead}
        </a>
      )}
    </div>
  );
}

/**
 * At the top of the page while a PHIVOLCS tsunami warning or advisory names
 * Philippine coastal areas: the heading, PHIVOLCS's first action sentence,
 * the areas and the arrival window, and the bulletin.
 */
export function TsunamiBanner({
  incidents,
  locale,
  onShow,
}: {
  incidents: Incident[];
  locale: Locale;
  /** Show the event on the map / open its card. */
  onShow?: (incident: Incident) => void;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const active = incidents
    .filter((i) => i.event_type === "tsunami")
    .sort((a, b) => (a.metadata.tsunami_kind === "warning" ? -1 : 0) - (b.metadata.tsunami_kind === "warning" ? -1 : 0));
  if (active.length === 0) return null;
  const copy = t(locale).common.card;
  return (
    // At most about a third of the screen (it scrolls inside), so the page and
    // map stay usable; the heading and PHIVOLCS's action sentence always show.
    <div className="tsunami-banner max-h-[30vh] shrink-0 overflow-y-auto overscroll-contain border-b border-red-500/40 md:max-h-[34vh]" role="alert">
      {active.map((i) => {
        const m = i.metadata;
        const kind = typeof m.tsunami_kind === "string" ? m.tsunami_kind : "other";
        const action = lines(m.action)[0];
        const areas = lines(m.tsunami_areas);
        const link = phivolcsLink(m.bulletin_url);
        const open = openIds.has(i.id);
        return (
          <section key={i.id} className={`px-4 py-2.5 text-[13px] leading-5 md:px-5 ${TONE[kind] ?? TONE.other}`}>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <Siren aria-hidden className="h-4 w-4 shrink-0 self-center" />
              <strong className="text-[14px]">{String(m.tsunami_heading)}</strong>
              <span className="text-[12px] opacity-90" suppressHydrationWarning>
                {copy.tsunamiInfo.replace("{n}", String(m.tsunami_no ?? "?"))} · {copy.tsunamiIssued.replace("{time}", formatDateTime(i.updated_at))}
              </span>
            </p>
            {action && <p className="mt-1 font-semibold">{action}</p>}
            {/* Phones: behind "Show details"; wider screens: always shown. */}
            <div className={open ? "" : "hidden md:block"}>
              {areas.length > 0 && <p className="mt-0.5">{areas.join(" · ")}</p>}
              {typeof m.arrival_from === "string" && typeof m.arrival_to === "string" && (
                <p className="mt-0.5">
                  {copy.tsunamiArrival}: {copy.tsunamiArrivalValue.replace("{from}", m.arrival_from).replace("{to}", m.arrival_to)}
                </p>
              )}
              <NewerPdf n={m.newer_pdf_no} old={m.tsunami_no} url={m.newer_pdf_url} locale={locale} />
            </div>
            {/* A newer PDF bulletin is never hidden: say so even when collapsed. */}
            {!open && m.newer_pdf_no != null && (
              <p className="mt-1 font-semibold md:hidden">{copy.tsunamiNewerShort.replace("{n}", String(m.newer_pdf_no))}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-x-4">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIds((s) => { const n = new Set(s); if (n.has(i.id)) n.delete(i.id); else n.add(i.id); return n; })}
                className="inline-flex min-h-11 items-center font-semibold underline md:hidden"
              >
                {open ? copy.tsunamiHideDetails : copy.tsunamiShowDetails}
              </button>
              {link && (
                <a className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline" href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden className="h-4 w-4" />
                  {copy.tsunamiRead}
                </a>
              )}
              {onShow && (
                <button type="button" onClick={() => onShow(i)} className="inline-flex min-h-11 items-center font-semibold underline">
                  {copy.details}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** The detail page of a tsunami event: the whole bulletin, as PHIVOLCS wrote it. */
export function TsunamiBulletin({ incident, locale }: { incident: Incident; locale: Locale }) {
  const copy = t(locale).common.card;
  const m = incident.metadata;
  const link = phivolcsLink(m.bulletin_url);
  const sections: Array<{ title: string; items: string[] }> = [
    { title: copy.tsunamiEvaluation, items: lines(m.evaluation) },
    { title: copy.tsunamiAreas, items: lines(m.tsunami_areas) },
    { title: copy.tsunamiAction, items: lines(m.action) },
  ].filter((s) => s.items.length > 0);
  const kind = typeof m.tsunami_kind === "string" ? m.tsunami_kind : "other";
  return (
    <section className={`rounded-xl border p-5 text-sm leading-6 ${TONE[kind] ?? TONE.other}`} aria-labelledby="tsunami-bulletin-title">
      <h2 id="tsunami-bulletin-title" className="text-[11px] font-semibold uppercase tracking-[0.2em]" suppressHydrationWarning>
        {copy.tsunamiInfo.replace("{n}", String(m.tsunami_no ?? "?"))} · {copy.tsunamiIssued.replace("{time}", formatDateTime(incident.updated_at))}
      </h2>
      <p className="mt-1 text-lg font-bold">{String(m.tsunami_heading)}</p>
      {typeof m.arrival_from === "string" && typeof m.arrival_to === "string" && (
        <p className="mt-1">
          <span className="font-semibold">{copy.tsunamiArrival}:</span>{" "}
          {copy.tsunamiArrivalValue.replace("{from}", m.arrival_from).replace("{to}", m.arrival_to)}
        </p>
      )}
      <NewerPdf n={m.newer_pdf_no} old={m.tsunami_no} url={m.newer_pdf_url} locale={locale} />
      {sections.map((s) => (
        <div key={s.title} className="mt-3">
          <p className="font-semibold">{s.title}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {s.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
      <p className="mt-3 text-[12.5px] opacity-80">{copy.tsunamiApproxPlace}</p>
      {link && (
        <a className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold underline" href={link} target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden className="h-4 w-4" />
          {copy.tsunamiRead}
        </a>
      )}
    </section>
  );
}
