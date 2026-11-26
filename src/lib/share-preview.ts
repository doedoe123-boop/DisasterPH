import type { Metadata } from "next";
import type { Incident } from "@/types/incident";
import type { IncidentsPayload } from "@/lib/incidents-payload";
import { t, type Locale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/incidents";
import { eventTimeFull } from "@/lib/event-time";
import { sourceInfo } from "@/lib/source-info";
import { statusText } from "@/lib/status-strip";
import { incidentInArea } from "@/lib/area";
import { DEFAULT_QUAKE_RANGE, LAYER_KEYS, passesQuakeFilters, type LayerKey } from "@/lib/quake-filters";
import { viewQuery, type ViewState } from "@/lib/view-url";
import { SITE_TITLE } from "@/lib/site-meta";

/**
 * Link previews (Open Graph) for shared map links and event pages, as shown
 * by Messenger, Viber and others: a title, the source and the time. Built
 * from the same official data and wording as the page; nothing personal
 * (shared links never carry saved places or locations).
 */

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "DisasterPH: official hazard information for the Philippines on a map",
};

function preview(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: path,
      siteName: "DisasterPH",
      images: [OG_IMAGE],
      locale: "en_PH",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** Who published the event: the Philippine agency, or the source as named. */
function publisher(incident: Incident): string {
  const info = sourceInfo(incident);
  if (info.agency) return info.agency.name;
  return incident.source === "EONET" ? "NASA EONET" : incident.source;
}

/** "Source: PHIVOLCS · Nov 25, 2026, 7:29 AM PHT." */
export function eventPreview(incident: Incident, locale: Locale, path: string): Metadata {
  const copy = t(locale).map;
  return preview(
    copy.shareTitleEvent.replace("{title}", incident.title),
    copy.shareEventSource.replace("{source}", publisher(incident)).replace("{time}", eventTimeFull(incident, locale)),
    path,
  );
}

/** Start of the day, Philippine time, `days` before `now` (as on the page). */
function phtDayStart(days: number, now: number): number {
  const PHT = 8 * 3_600_000;
  return Math.floor((now + PHT) / 86_400_000) * 86_400_000 - PHT - days * 86_400_000;
}

/** Preview for the map page, for the view a link describes. */
export function viewPreview(view: ViewState, payload: IncidentsPayload, locale: Locale): Metadata {
  const copy = t(locale);
  const at = Date.parse(payload.meta.generated_at) || Date.now();
  const event = view.event ? payload.data.find((i) => i.id === view.event) : undefined;
  const layers = Object.fromEntries(
    LAYER_KEYS.map((k) => [k, view.layers ? view.layers.includes(k) : true]),
  ) as Record<LayerKey, boolean>;
  // The link, re-written with only the allowed, valid parameters.
  const path =
    "/" +
    viewQuery({
      region: view.region,
      tab: view.tab ?? "all",
      layers,
      range: view.range ?? DEFAULT_QUAKE_RANGE,
      includeSmall: view.includeSmall ?? false,
      event: event?.id ?? null,
    });
  if (event) return eventPreview(event, locale, path);

  const checked = copy.map.shareSources.replace("{time}", formatDateTime(payload.meta.generated_at));
  if (!view.region) {
    return preview(SITE_TITLE, `${statusText(payload.data, payload.meta.sources, locale, at)}. ${checked}`, path);
  }

  // Same counts as the area summary on the page (last 10 days, the link's
  // earthquake filters, events in or near the region).
  const area = { kind: "region" as const, region: view.region };
  const cutoff = phtDayStart(10, at);
  const recent = payload.data.filter(
    (i) =>
      Date.parse(i.updated_at) >= cutoff &&
      passesQuakeFilters(i, view.range ?? DEFAULT_QUAKE_RANGE, view.includeSmall ?? false, at) &&
      incidentInArea(i, area, []),
  );
  const warnings = recent.filter((i) => i.severity === "warning" || i.severity === "critical").length;
  const a = copy.area;
  const summary =
    recent.length === 0
      ? // Never a bare "nothing here": the same caveat as on the page.
        `${a.summaryNone.replace("{area}", view.region)} ${a.summaryCaveat}`
      : (recent.length === 1 ? a.summaryOne : a.summaryMany)
          .replace("{n}", String(recent.length))
          .replace("{area}", view.region) +
        (warnings > 0 ? ` · ${a.summaryWarning.replace("{n}", String(warnings))}` : "") +
        ".";
  return preview(copy.map.shareTitleArea.replace("{area}", view.region), `${summary} ${checked}`, path);
}
