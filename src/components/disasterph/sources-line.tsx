"use client";

import { Radio } from "lucide-react";
import type { SourceKey, SourceStatus } from "@/types/incident";
import { formatRelativeTime } from "@/lib/incidents";
import { t, type Locale } from "@/lib/i18n";

/** The sources DisasterPH always reads. USGS appears only as a backup. */
const PRIMARY: SourceKey[] = ["PHIVOLCS", "PHIVOLCS_VOLCANO", "PAGASA", "PAGASA_RAIN", "EONET"];

/**
 * "Sources: 4 of 4 live · updated 3m ago", or, when something is wrong,
 * "Sources: 3 of 4 live · PAGASA delayed, last update 25m ago". Built from
 * the feed health the server already tracks. "Live" means the source's last
 * fetch succeeded within the last 5 minutes.
 */
export function SourcesLine({
  statuses,
  locale,
  offline = false,
  checkedAt = null,
}: {
  statuses: SourceStatus[];
  locale: Locale;
  /** The device is offline: the sources' state can't be known now. */
  offline?: boolean;
  /** When the shown data was fetched. */
  checkedAt?: string | null;
}) {
  const copy = t(locale).common.sourcesLine;
  if (offline) {
    return (
      <p className="sources-line-warn flex items-start gap-1.5 text-[12px] leading-5 text-amber-300" role="status" suppressHydrationWarning>
        <Radio aria-hidden className="mt-[3px] h-3.5 w-3.5 shrink-0" />
        <span>
          {checkedAt
            ? copy.offline.replace("{age}", formatRelativeTime(checkedAt, locale))
            : copy.offlineNever}
        </span>
      </p>
    );
  }
  if (statuses.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)]" role="status">
        <Radio aria-hidden className="h-3.5 w-3.5" />
        {copy.checking}
      </p>
    );
  }

  const primary = PRIMARY.map((key) => statuses.find((s) => s.source === key)).filter(
    (s): s is SourceStatus => Boolean(s),
  );
  const live = primary.filter((s) => s.status === "healthy");
  const problems = primary.filter((s) => s.status !== "healthy");
  const usgs = statuses.find((s) => s.source === "USGS");

  // Oldest successful update among the live sources: everything shown is at
  // least this fresh.
  const oldest = live
    .map((s) => s.last_success_at)
    .filter((v): v is string => typeof v === "string")
    .sort()[0];

  const parts: string[] = [
    copy.count.replace("{live}", String(live.length)).replace("{total}", String(primary.length)),
  ];
  if (problems.length === 0 && oldest) {
    parts.push(copy.updated.replace("{age}", formatRelativeTime(oldest, locale)));
  }
  for (const s of problems) {
    const name = copy.names[s.source as keyof typeof copy.names] ?? s.source;
    const state = copy.states[s.status as keyof typeof copy.states] ?? copy.states.degraded;
    parts.push(
      s.last_success_at
        ? copy.problem.replace("{name}", name).replace("{state}", state).replace("{age}", formatRelativeTime(s.last_success_at, locale))
        : copy.problemNever.replace("{name}", name).replace("{state}", state),
    );
  }
  if (usgs && usgs.status === "healthy") parts.push(copy.usgsBackup);

  const ok = problems.length === 0;
  return (
    <p
      className={`flex items-start gap-1.5 text-[12px] leading-5 ${ok ? "text-[var(--text-dim)]" : "sources-line-warn text-amber-300"}`}
      role="status"
      suppressHydrationWarning
    >
      <Radio aria-hidden className="mt-[3px] h-3.5 w-3.5 shrink-0" />
      <span>{parts.join(" · ")}</span>
    </p>
  );
}
