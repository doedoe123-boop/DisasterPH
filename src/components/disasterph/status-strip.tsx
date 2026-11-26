"use client";

import type { Incident, SourceStatus } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";
import { statusParts } from "@/lib/status-strip";

/**
 * One line of official facts, nationwide: volcano alert levels, earthquakes
 * M4.0+ in the last 24 h, and tropical cyclones with their wind signal. No
 * combined score. Not affected by the area, tabs or map filters.
 */
export function StatusStrip({
  incidents,
  sources,
  locale,
}: {
  incidents: Incident[];
  sources: SourceStatus[];
  locale: Locale;
}) {
  const copy = t(locale).common.statusStrip;
  const p = statusParts(incidents, sources);
  const parts: string[] = [];

  if (p.volcanoUnknown) parts.push(copy.volcanoUnknown);
  else {
    for (const v of p.namedVolcanoes) parts.push(copy.volcanoNamed.replace("{name}", v.name).replace("{n}", String(v.level)));
    if (p.levelOneCount > 0) parts.push(copy.volcanoLevelOne.replace("{n}", String(p.levelOneCount)));
  }

  if (p.quakesUnknown) parts.push(copy.quakesUnknown);
  else
    parts.push(
      p.quakesM4Last24h === 0
        ? copy.quakesNone
        : p.quakesM4Last24h === 1
          ? copy.quakesOne
          : copy.quakesMany.replace("{n}", String(p.quakesM4Last24h)),
    );

  if (p.cyclones.length > 0) {
    for (const c of p.cyclones)
      parts.push(
        c.signal > 0
          ? copy.cyclone.replace("{name}", c.name).replace("{n}", String(c.signal))
          : copy.cycloneNoSignal.replace("{name}", c.name),
      );
  } else parts.push(p.cyclonesUnknown ? copy.cycloneUnknown : copy.noCyclone);

  const text = parts.join(" · ");
  return (
    <>
      {/* Phones: one line that opens on tap (works without JavaScript). */}
      <details className="status-strip group text-[12px] leading-5 text-[var(--text-muted)] md:hidden">
        <summary className="flex min-h-6 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
          <span className="shrink-0 font-semibold text-[var(--text-dim)]">{copy.label}:</span>
          <span className="truncate group-open:hidden" suppressHydrationWarning>{text}</span>
          <span aria-hidden className="ml-auto shrink-0 text-[var(--text-dim)] group-open:rotate-180">▾</span>
        </summary>
        <p suppressHydrationWarning>{text}</p>
      </details>
      <p className="status-strip hidden text-[12px] leading-5 text-[var(--text-muted)] md:block" suppressHydrationWarning>
        <span className="font-semibold text-[var(--text-dim)]">{copy.label}: </span>
        {text}
      </p>
    </>
  );
}
