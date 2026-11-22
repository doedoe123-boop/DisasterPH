import type { Incident } from "@/types/incident";

/**
 * Plain facts about where an incident's data comes from, for display in
 * place of any computed "confidence" score.
 */
export interface SourceInfo {
  /** Who published the data this record was built from. */
  publisher: "USGS" | "PAGASA" | "NASA_EONET" | "OTHER";
  /** Link to this event's own record at the publisher, when known and safe. */
  recordUrl: string | null;
  /** Responsible Philippine agency for official information, if any. */
  agency: { name: "PHIVOLCS" | "PAGASA"; url: string } | null;
  /** True when the data is not an official Philippine advisory. */
  referenceOnly: boolean;
}

/** Accept only https links on the expected host (upstream data is untrusted). */
function safeRecordUrl(value: unknown, host: string): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === host || url.hostname.endsWith(`.${host}`))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function sourceInfo(incident: Incident): SourceInfo {
  const m = incident.metadata;
  switch (incident.source) {
    // Earthquakes are ingested from the USGS catalogue (see ingest/phivolcs.ts).
    case "PHIVOLCS":
      return {
        publisher: "USGS",
        recordUrl: safeRecordUrl(m.usgs_url, "usgs.gov"),
        agency: { name: "PHIVOLCS", url: "https://earthquake.phivolcs.dost.gov.ph/" },
        referenceOnly: false,
      };
    case "PAGASA":
      return {
        publisher: "PAGASA",
        recordUrl: null,
        agency: { name: "PAGASA", url: "https://www.pagasa.dost.gov.ph/" },
        referenceOnly: false,
      };
    case "EONET":
      return {
        publisher: "NASA_EONET",
        recordUrl: safeRecordUrl(m.eonet_link, "nasa.gov"),
        agency: null,
        referenceOnly: true,
      };
    default:
      return { publisher: "OTHER", recordUrl: null, agency: null, referenceOnly: true };
  }
}

/** Absolute Philippine time, labelled, e.g. "22 Nov 2026, 4:15 PM PHT". */
export function formatPHT(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)} PHT`;
}
