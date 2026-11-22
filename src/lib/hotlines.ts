/**
 * Single source of truth for phone numbers shown in DisasterPH.
 *
 * - 911 is the nationwide emergency number (Unified 911, DILG; nationwide
 *   since 11 Sep 2025). Executive Order No. 56 (2018) replaced the old PNP
 *   "117" number with 911, so 117 is not listed.
 * - Agency lines are for information and coordination, not emergency
 *   dispatch. They come from public listings and have NOT been confirmed
 *   directly with each agency; see docs in the PR / private checklist.
 *   Update `reviewedOn` whenever the list is re-checked.
 */

export interface AgencyLine {
  id: string;
  name: string;
  /** Display format. */
  number: string;
  /** Digits for tel: links. */
  dial: string;
  /** i18n key under hotlines.purpose */
  purpose:
    | "ndrrmc"
    | "redCross"
    | "phivolcs"
    | "pagasa"
    | "bfp"
    | "doh"
    | "coastGuard";
}

export const HOTLINES_REVIEWED_ON = "2026-11-22";

export const EMERGENCY_NUMBER = {
  number: "911",
  dial: "911",
  sourceUrl:
    "https://calabarzon.dilg.gov.ph/one-number-for-all-emergencies-unified-911-to-launch-nationwide/",
} as const;

export const AGENCY_LINES: readonly AgencyLine[] = [
  { id: "ndrrmc", name: "NDRRMC Operations Center", number: "(02) 8911-1406", dial: "+63289111406", purpose: "ndrrmc" },
  { id: "red-cross", name: "Philippine Red Cross", number: "143", dial: "143", purpose: "redCross" },
  { id: "phivolcs", name: "PHIVOLCS", number: "(02) 8426-1468", dial: "+63284261468", purpose: "phivolcs" },
  { id: "pagasa", name: "PAGASA", number: "(02) 8284-0800", dial: "+63282840800", purpose: "pagasa" },
  { id: "bfp", name: "BFP (Fire)", number: "(02) 8426-0219", dial: "+63284260219", purpose: "bfp" },
  { id: "doh", name: "DOH", number: "1555", dial: "1555", purpose: "doh" },
  { id: "coast-guard", name: "Philippine Coast Guard", number: "(02) 8527-8481", dial: "+63285278481", purpose: "coastGuard" },
];

export function agencyLine(id: AgencyLine["id"]): AgencyLine {
  const line = AGENCY_LINES.find((l) => l.id === id);
  if (!line) throw new Error(`Unknown agency line ${id}`);
  return line;
}

/** "2026-11-22" -> "22 Nov 2026" (fixed format, no time zone drift). */
export function formatReviewedOn(iso = HOTLINES_REVIEWED_ON): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}
