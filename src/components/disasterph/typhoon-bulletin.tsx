"use client";

import { AlertTriangle, ExternalLink, Wind } from "lucide-react";
import type { Incident } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";
import { formatPHT } from "@/lib/source-info";

interface Signal {
  level: number;
  luzon: string[];
  visayas: string[];
  mindanao: string[];
}

const SIGNAL_TONE: Record<number, string> = {
  1: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  2: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  3: "border-orange-500/50 bg-orange-500/12 text-orange-300",
  4: "border-red-500/50 bg-red-500/12 text-red-300",
  5: "border-fuchsia-500/50 bg-fuchsia-500/12 text-fuchsia-300",
};

function lines(value: unknown): string[] {
  return typeof value === "string" ? value.split("\n").map((s) => s.trim()).filter(Boolean) : [];
}

/** Parse the stored signal list defensively (it is upstream data). */
function signals(value: unknown): Signal[] {
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
    return parsed
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .map((s) => ({ level: Number(s.level), luzon: list(s.luzon), visayas: list(s.visayas), mindanao: list(s.mindanao) }))
      .filter((s) => s.level >= 1 && s.level <= 5);
  } catch {
    return [];
  }
}

/** Only https links on PAGASA hosts. */
function pagasaLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)pagasa\.dost\.gov\.ph$/.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The official PAGASA tropical cyclone bulletin: wind signals by area,
 * position, movement, strength, PAGASA's own guidance for the highest
 * signal, and forecast positions. Plain text only (React escapes it).
 */
export function TyphoonBulletin({ incident, locale }: { incident: Incident; locale: Locale }) {
  const copy = t(locale).common.typhoon;
  const m = incident.metadata;
  const list = signals(m.signals_json);
  const top = list[0]?.level ?? 0;
  const whatToDo = lines(m.what_to_do);
  const precautions = lines(m.precautions);
  const forecast = lines(m.forecast);
  const allLinks: Array<{ href: string | null; label: string }> = [
    { href: pagasaLink(m.bulletin_url), label: copy.officialBulletin },
    { href: pagasaLink(m.pdf_url), label: copy.pdf },
    { href: pagasaLink(m.track_image_url), label: copy.trackMap },
    { href: pagasaLink(m.signals_image_url), label: copy.signalMap },
  ];
  const links = allLinks.filter((l): l is { href: string; label: string } => !!l.href);
  const groups = [
    ["luzon", copy.luzon],
    ["visayas", copy.visayas],
    ["mindanao", copy.mindanao],
  ] as const;

  return (
    <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
        {copy.heading}
      </h2>
      {typeof m.headline === "string" && m.headline && (
        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{m.headline}</p>
      )}
      <p className="mt-1 text-[12px] text-[var(--text-muted)]" suppressHydrationWarning>
        {m.bulletin_no != null && `${copy.bulletinNo.replace("{no}", String(m.bulletin_no))} · `}
        {copy.issued.replace("{time}", formatPHT(incident.updated_at))}
        {typeof m.next_bulletin === "string" && m.next_bulletin ? ` ${m.next_bulletin}` : ""}
      </p>

      {m.bulletin_stale === true && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[12px] leading-5 text-amber-300" role="status" suppressHydrationWarning>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{copy.stale.replace("{time}", formatPHT(incident.updated_at))}</span>
        </p>
      )}

      <dl className="mt-4 space-y-1.5 text-sm">
        {[
          [copy.position, m.center_text],
          [copy.movement, m.movement],
        ]
          .filter((row): row is [string, string] => typeof row[1] === "string" && row[1].length > 0)
          .map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3">
              <dt className="text-[var(--text-muted)]">{label}</dt>
              <dd className="text-[var(--text-primary)]">{value}</dd>
            </div>
          ))}
        {typeof m.wind_speed_kph === "number" && (
          <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3">
            <dt className="text-[var(--text-muted)]">{copy.strength}</dt>
            <dd className="text-[var(--text-primary)]">
              {m.wind_speed_kph} km/h{typeof m.gust_kph === "number" ? ` · ${locale === "fil" ? "bugso" : "gusts"} ${m.gust_kph} km/h` : ""}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
          <Wind className="h-3.5 w-3.5" />
          {copy.signals}
        </p>
        {list.length === 0 ? (
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">{copy.noSignals}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {list.map((s) => (
              <div key={s.level} className={`rounded-lg border p-3 ${SIGNAL_TONE[s.level] ?? ""}`}>
                <p className="text-[13px] font-bold">{copy.signalNo.replace("{n}", String(s.level))}</p>
                {groups.map(([key, label]) =>
                  s[key].length ? (
                    <p key={key} className="mt-1 text-sm leading-6 text-[var(--text-primary)]">
                      <span className="font-semibold">{label}: </span>
                      {s[key].join("; ")}
                    </p>
                  ) : null,
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {whatToDo.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
            {copy.whatToDo.replace("{n}", String(top))}
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text-primary)]">
            {whatToDo.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
      {precautions.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
            {copy.precautions.replace("{n}", String(top))}
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text-primary)]">
            {precautions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
      {forecast.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">{copy.forecast}</p>
          <ul className="mt-1.5 space-y-1 text-sm leading-6 text-[var(--text-primary)]">
            {forecast.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {links.map((l) => (
            <a
              key={l.label}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-cyan-400 hover:text-cyan-300"
              href={l.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
