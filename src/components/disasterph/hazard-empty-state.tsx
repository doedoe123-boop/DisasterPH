"use client";

import { ExternalLink } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { formatPHT } from "@/lib/source-info";
import type { SourceStatus } from "@/types/incident";

const LINKS = {
  pagasaTc: "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin",
  pagasaFlood: "https://www.pagasa.dost.gov.ph/flood",
  phivolcsVolcano: "https://wovodat.phivolcs.dost.gov.ph/bulletin/list-of-bulletin",
};

/**
 * Explains an empty hazard filter truthfully: what the responsible source
 * says, or that DisasterPH does not cover that official product yet. Never
 * implies "no hazard" from an empty or failed feed.
 */
export function HazardEmptyState({
  filter,
  sourceStatuses,
  locale,
}: {
  filter: string;
  sourceStatuses: SourceStatus[];
  locale: Locale;
}) {
  const i18n = t(locale);
  const copy = i18n.hazardEmpty;

  let message: string;
  let link: { href: string; label: string } | null = null;

  if (filter === "typhoon") {
    const pagasa = sourceStatuses.find((s) => s.source === "PAGASA");
    const healthy = pagasa && pagasa.status !== "unavailable";
    link = { href: LINKS.pagasaTc, label: copy.pagasaTcLink };
    if (healthy && pagasa.bulletin_state === "none") {
      message = copy.typhoonNone.replace("{time}", formatPHT(pagasa.last_fetch_at));
    } else if (healthy && pagasa.bulletin_state === "active") {
      message = copy.typhoonActive;
    } else {
      message = copy.typhoonUnknown;
    }
  } else if (filter === "flood") {
    message = copy.floodNotCovered;
    link = { href: LINKS.pagasaFlood, label: copy.pagasaFloodLink };
  } else if (filter === "volcano") {
    // Empty only means "no volcano above Level 0" when the source worked.
    const volcano = sourceStatuses.find((s) => s.source === "PHIVOLCS_VOLCANO");
    link = { href: LINKS.phivolcsVolcano, label: copy.phivolcsLink };
    message =
      volcano && volcano.status === "healthy"
        ? copy.volcanoNone.replace("{time}", formatPHT(volcano.last_fetch_at))
        : copy.volcanoUnknown;
  } else if (filter === "landslide") {
    message = copy.landslideNotCovered;
  } else {
    message = i18n.common.noFilterMatches;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 text-center" role="status">
      <p className="text-[14px] leading-6 text-[var(--text-muted)]">{message}</p>
      {link && (
        <a
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-cyan-400 hover:text-cyan-300"
          href={link.href}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {link.label}
        </a>
      )}
    </div>
  );
}
