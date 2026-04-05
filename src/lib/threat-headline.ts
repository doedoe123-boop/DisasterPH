import type {
  Incident,
  IncidentSeverity,
  PlaceRiskSummary,
  SavedPlace,
} from "@/types/incident";
import { haversineKm } from "@/lib/risk-summary";

export type ThreatLevel = "safe" | "watch" | "warning" | "danger";

export interface ThreatHeadline {
  level: ThreatLevel;
  headline: string;
  subtext: string | null;
  affectedPlaceCount: number;
  topIncident: Incident | null;
}

const severityWeight: Record<IncidentSeverity, number> = {
  critical: 4,
  warning: 3,
  watch: 2,
  advisory: 1,
};

/**
 * Compute a single human-readable threat headline from active incidents
 * and saved places. This is the first thing users see on load.
 */
export function computeThreatHeadline(
  incidents: Incident[],
  places: SavedPlace[],
  placeRisks: PlaceRiskSummary[],
): ThreatHeadline {
  if (incidents.length === 0) {
    return {
      level: "safe",
      headline: "No active incidents reported",
      subtext:
        places.length > 0
          ? `Monitoring ${places.length} saved place${places.length > 1 ? "s" : ""}`
          : "Add places to monitor your family\u2019s safety",
      affectedPlaceCount: 0,
      topIncident: null,
    };
  }

  // Find places at risk
  const affectedPlaces = placeRisks.filter((r) => r.riskLevel !== "safe");
  const dangerPlaces = placeRisks.filter(
    (r) => r.riskLevel === "danger" || r.riskLevel === "at-risk",
  );

  // Determine top incident by severity × proximity to places
  const topIncident = findTopIncident(incidents, places);

  // Case 1: Places are in danger
  if (dangerPlaces.length > 0) {
    const worst = dangerPlaces[0];
    const placeNames = dangerPlaces
      .slice(0, 2)
      .map((p) => p.place.label)
      .join(", ");
    const moreCount = dangerPlaces.length - 2;

    return {
      level: "danger",
      headline: topIncident
        ? topIncident.title
        : `Threat detected near ${worst.place.label}`,
      subtext: `Affects ${placeNames}${moreCount > 0 ? ` +${moreCount} more` : ""}`,
      affectedPlaceCount: dangerPlaces.length,
      topIncident,
    };
  }

  // Case 2: Places being monitored (watch-level)
  if (affectedPlaces.length > 0) {
    const placeNames = affectedPlaces
      .slice(0, 2)
      .map((p) => p.place.label)
      .join(", ");

    return {
      level: "watch",
      headline: topIncident
        ? topIncident.title
        : `Activity detected near ${affectedPlaces[0].place.label}`,
      subtext: `Monitoring ${placeNames}${affectedPlaces.length > 2 ? ` +${affectedPlaces.length - 2} more` : ""}`,
      affectedPlaceCount: affectedPlaces.length,
      topIncident,
    };
  }

  // Case 3: Incidents exist but no saved places affected
  if (places.length > 0) {
    const highSeverity = incidents.filter(
      (i) => i.severity === "critical" || i.severity === "warning",
    );

    if (highSeverity.length > 0) {
      return {
        level: "warning",
        headline: highSeverity[0].title,
        subtext: `${highSeverity.length} high-severity event${highSeverity.length > 1 ? "s" : ""} active — your saved places are not affected`,
        affectedPlaceCount: 0,
        topIncident: highSeverity[0],
      };
    }

    return {
      level: "safe",
      headline: "No active threats near your saved places",
      subtext: `${incidents.length} event${incidents.length > 1 ? "s" : ""} being tracked nationwide`,
      affectedPlaceCount: 0,
      topIncident: incidents[0] ?? null,
    };
  }

  // Case 4: No saved places — fall back to showing top incident
  return {
    level:
      topIncident && severityWeight[topIncident.severity] >= 3
        ? "warning"
        : "watch",
    headline: topIncident
      ? topIncident.title
      : `${incidents.length} active events in the Philippines`,
    subtext: "Add saved places to get personalized safety alerts",
    affectedPlaceCount: 0,
    topIncident,
  };
}

function findTopIncident(
  incidents: Incident[],
  places: SavedPlace[],
): Incident | null {
  if (incidents.length === 0) return null;
  if (places.length === 0) {
    // No places: rank by severity then recency
    return [...incidents].sort(
      (a, b) =>
        severityWeight[b.severity] - severityWeight[a.severity] ||
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )[0];
  }

  // Score each incident by severity × inverse distance to nearest place
  return [...incidents].sort((a, b) => {
    const scoreA = incidentScore(a, places);
    const scoreB = incidentScore(b, places);
    return scoreB - scoreA;
  })[0];
}

function incidentScore(incident: Incident, places: SavedPlace[]): number {
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
  // Closer = higher score. Weight severity heavily.
  const proxScore = Math.max(0, 200 - minDist) / 200;
  return severityWeight[incident.severity] * 10 + proxScore * 5;
}
