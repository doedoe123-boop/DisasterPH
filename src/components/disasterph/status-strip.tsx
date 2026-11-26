"use client";

import type { Incident, SourceStatus } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";
import { statusText } from "@/lib/status-strip";

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
  const text = statusText(incidents, sources, locale);
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
