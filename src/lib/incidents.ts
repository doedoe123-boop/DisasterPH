import type {
  DashboardStats,
  Incident,
  IncidentEventType,
  SavedPlace,
} from "@/types/incident";
import { haversineKm } from "@/lib/risk-summary";
import { severityRank } from "@/lib/severity";

export const eventTypeLabel: Record<IncidentEventType, string> = {
  typhoon: "Typhoon",
  flood: "Flood",
  earthquake: "Earthquake",
  volcano: "Volcano",
  landslide: "Landslide",
  wildfire: "Wildfire",
  tsunami: "Tsunami",
};

export function filterIncidentsByType(
  incidents: Incident[],
  eventType: string | null,
) {
  if (!eventType || eventType === "all") {
    return sortIncidents(incidents);
  }

  return sortIncidents(
    incidents.filter((incident) => incident.event_type === eventType),
  );
}

export function sortIncidents(incidents: Incident[]) {
  return [...incidents].sort((a, b) => {
    const severityDelta = severityRank[b.severity] - severityRank[a.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function buildDashboardStats(
  incidents: Incident[],
  sources: Array<{ status: string }> = [],
): DashboardStats {
  return {
    activeAlerts: incidents.length,
    criticalAlerts: incidents.filter(
      (incident) => severityRank[incident.severity] >= severityRank.warning,
    ).length,
    sourcesOnline: sources.filter((s) => s.status === "healthy").length,
    regionsTracked: new Set(incidents.map((incident) => incident.region)).size,
  };
}

/*
 * All public times are shown in Philippine Standard Time with a "PHT" label,
 * regardless of the viewer's device time zone.
 */
const PH_TIME_ZONE = "Asia/Manila";

/** e.g. "4:15 PM PHT" */
export function formatShortTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${new Intl.DateTimeFormat("en-PH", {
    timeZone: PH_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date)} PHT`;
}

/** e.g. "Nov 22, 2026, 4:15 PM PHT" */
export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${new Intl.DateTimeFormat("en-PH", {
    timeZone: PH_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)} PHT`;
}

/** Relative age in English or Filipino, e.g. "9h ago" / "9 oras ang nakalipas". */
export function formatRelativeTime(
  value: string,
  locale: "en" | "fil" = "en",
  now: number = Date.now(),
): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "—";
  const diff = now - time;
  const fil = locale === "fil";
  if (diff < 0) {
    const mins = Math.max(1, Math.floor(-diff / 60_000));
    if (mins < 60) return fil ? `sa loob ng ${mins} min` : `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    return fil ? `sa loob ng ${hrs} oras` : `in ${hrs}h`;
  }
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return fil ? "ngayon lang" : "just now";
  if (mins < 60) return fil ? `${mins} min ang nakalipas` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return fil ? `${hrs} oras ang nakalipas` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return fil ? `${days} araw ang nakalipas` : `${days}d ago`;
}

/** Sort incidents by severity × proximity to saved places (nearest first) */
export function sortByPriority(
  incidents: Incident[],
  places: SavedPlace[],
): Incident[] {
  if (places.length === 0) return sortIncidents(incidents);

  return [...incidents].sort((a, b) => {
    const scoreA = priorityScore(a, places);
    const scoreB = priorityScore(b, places);
    return scoreB - scoreA;
  });
}

function priorityScore(incident: Incident, places: SavedPlace[]): number {
  const minDist = Math.min(
    ...places.map((p) =>
      haversineKm(
        p.latitude,
        p.longitude,
        incident.latitude,
        incident.longitude,
      ),
    ),
  );
  const proxWeight = Math.max(0, 200 - minDist) / 200; // 1 = on top of place, 0 = 200+ km
  return severityRank[incident.severity] * 10 + proxWeight * 8;
}

/** Check if incident is near any saved place (within radius km) */
export function nearestPlaceName(
  incident: Incident,
  places: SavedPlace[],
  radiusKm = 100,
): string | null {
  let minDist = Infinity;
  let nearestLabel: string | null = null;

  for (const p of places) {
    const d = haversineKm(
      p.latitude,
      p.longitude,
      incident.latitude,
      incident.longitude,
    );
    if (d < minDist) {
      minDist = d;
      nearestLabel = p.label;
    }
  }

  return minDist <= radiusKm ? nearestLabel : null;
}
