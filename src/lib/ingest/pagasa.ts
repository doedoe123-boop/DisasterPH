import type { Incident } from "@/types/incident";

/*
 * PAGASA does not publish a stable machine-readable feed for tropical
 * cyclone bulletins. Rather than guess incidents from page text (which
 * previously turned any "Signal No. N" mention into a typhoon alert pinned to
 * Manila), we read only one fact from the official severe-weather bulletin
 * page: whether PAGASA says there is an active tropical cyclone.
 *
 * No incidents are created from PAGASA until a reliable structured source is
 * available; the bulletin state is reported through source health instead.
 */

export const PAGASA_TC_BULLETIN_URL =
  "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";

/** What PAGASA's bulletin page says about tropical cyclones. */
export type TcBulletinState = "none" | "active" | "unknown";

export interface SourceFetchResult {
  events: Incident[];
  note: string;
  bulletin_state?: TcBulletinState;
  /** Fetched fine but could not be interpreted with confidence. */
  uncertain?: boolean;
}

function pageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ");
}

/**
 * "none": PAGASA states there is no active tropical cyclone in the PAR.
 * "active": a numbered Tropical Cyclone Bulletin is published.
 * "unknown": neither statement found (page changed or partially loaded).
 */
export function readTcBulletinState(html: string): TcBulletinState {
  const text = pageText(html);
  if (/No Active Tropical Cyclone within the Philippine Area of Responsibility/i.test(text)) {
    return "none";
  }
  if (/Tropical Cyclone Bulletin\s*(No\.?|#|Number)\s*\d+/i.test(text)) {
    return "active";
  }
  return "unknown";
}

export async function fetchPagasaEvents(): Promise<SourceFetchResult> {
  // Failures throw, so source health records them instead of "0 events".
  const res = await fetch(PAGASA_TC_BULLETIN_URL, {
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: "text/html",
      "User-Agent": "DisasterPH/1.0 (disaster information; bulletin status check)",
    },
  });
  if (!res.ok) {
    throw new Error(`PAGASA bulletin page returned ${res.status}`);
  }

  const state = readTcBulletinState(await res.text());
  const note =
    state === "none"
      ? "No active tropical cyclone in the Philippine Area of Responsibility (PAGASA bulletin page)."
      : state === "active"
        ? "PAGASA has an active tropical cyclone bulletin. See the official bulletin."
        : "Could not read the tropical cyclone status from the PAGASA bulletin page.";

  return { events: [], note, bulletin_state: state, uncertain: state === "unknown" };
}
