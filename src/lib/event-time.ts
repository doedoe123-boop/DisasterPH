import type { Incident } from "@/types/incident";
import { formatDateTime, formatRelativeTime } from "@/lib/incidents";

/**
 * How an event's time is shown. Every clock time carries its date and "PHT".
 *
 * PHIVOLCS volcano bulletins are daily and carry a date only. Their stored
 * time is midnight PHT, which is not when anything happened, so they are
 * shown as "Bulletin of Nov 25, 2026": no clock time, no "12h ago".
 */

const PH_TIME_ZONE = "Asia/Manila";

/** The bulletin date (YYYY-MM-DD) when the event's time is a date only. */
export function dateOnlyBulletin(incident: Incident): string | null {
  const date = incident.metadata.bulletin_date;
  return incident.event_type === "volcano" && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : null;
}

/** "2026-11-25" -> "Nov 25, 2026" (the date in the Philippines). */
export function formatBulletinDay(date: string): string {
  const d = new Date(`${date}T12:00:00+08:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("en-PH", { timeZone: PH_TIME_ZONE, dateStyle: "medium" }).format(d);
}

/** "Nov 25" — compact date for tight rows. */
function formatShortDay(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", { timeZone: PH_TIME_ZONE, month: "short", day: "numeric" }).format(d);
}

/** Full time: "Nov 25, 2026, 7:29 AM PHT", or "Bulletin of Nov 25, 2026". */
export function eventTimeFull(incident: Incident, locale: "en" | "fil"): string {
  const day = dateOnlyBulletin(incident);
  if (day) return `${locale === "fil" ? "Bulletin noong" : "Bulletin of"} ${formatBulletinDay(day)}`;
  return formatDateTime(incident.updated_at);
}

/**
 * Age plus date for lists and cards: "5h ago · Nov 25, 2026, 7:29 AM PHT".
 * `compact` drops the year and clock time: "5h ago · Nov 25".
 */
export function eventTimeWithAge(
  incident: Incident,
  locale: "en" | "fil",
  { compact = false, now = Date.now() }: { compact?: boolean; now?: number } = {},
): string {
  const day = dateOnlyBulletin(incident);
  if (day) {
    const label = locale === "fil" ? "Bulletin noong" : "Bulletin of";
    return compact ? `${label} ${formatShortDay(`${day}T12:00:00+08:00`)}` : `${label} ${formatBulletinDay(day)}`;
  }
  const age = formatRelativeTime(incident.updated_at, locale, now);
  return `${age} · ${compact ? formatShortDay(incident.updated_at) : formatDateTime(incident.updated_at)}`;
}
