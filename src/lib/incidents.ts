import type {
  DashboardStats,
  Incident,
  IncidentEventType,
  IncidentSeverity,
  SavedPlace,
} from "@/types/incident";
import { haversineKm } from "@/lib/risk-summary";

export const severityRank: Record<IncidentSeverity, number> = {
  critical: 4,
  warning: 3,
  watch: 2,
  advisory: 1,
};

export const eventTypeLabel: Record<IncidentEventType, string> = {
  typhoon: "Typhoon",
  flood: "Flood",
  earthquake: "Earthquake",
  volcano: "Volcano",
  landslide: "Landslide",
  wildfire: "Wildfire",
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

export function buildDashboardStats(incidents: Incident[]): DashboardStats {
  return {
    activeAlerts: incidents.length,
    criticalAlerts: incidents.filter(
      (incident) => severityRank[incident.severity] >= severityRank.warning,
    ).length,
    sourcesOnline: 3,
    regionsTracked: new Set(incidents.map((incident) => incident.region)).size,
  };
}

export function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
