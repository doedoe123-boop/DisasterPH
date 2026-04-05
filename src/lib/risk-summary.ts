import type {
  Incident,
  IncidentSeverity,
  PlaceRiskSummary,
  SavedPlace,
} from "@/types/incident";

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Radius in km to consider an incident "nearby" a saved place */
const NEARBY_RADIUS_KM = 100;

const severityRank: Record<IncidentSeverity, number> = {
  critical: 4,
  warning: 3,
  watch: 2,
  advisory: 1,
};

function highestSeverity(incidents: Incident[]): IncidentSeverity | null {
  if (incidents.length === 0) return null;
  return incidents.reduce((max, inc) =>
    severityRank[inc.severity] > severityRank[max.severity] ? inc : max,
  ).severity;
}

function riskLevelFromSeverity(
  severity: IncidentSeverity | null,
  nearestKm: number | null,
): PlaceRiskSummary["riskLevel"] {
  if (!severity || nearestKm === null) return "safe";
  if (severity === "critical" && nearestKm < 50) return "danger";
  if (severity === "critical" || severity === "warning") return "at-risk";
  if (severity === "watch") return "monitor";
  return "safe";
}

/** Compute risk summary for a single saved place */
export function computePlaceRisk(
  place: SavedPlace,
  incidents: Incident[],
): PlaceRiskSummary {
  const withDistance = incidents.map((inc) => ({
    incident: inc,
    distanceKm: haversineKm(
      place.latitude,
      place.longitude,
      inc.latitude,
      inc.longitude,
    ),
  }));

  const nearby = withDistance
    .filter((d) => d.distanceKm <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearbyIncidents = nearby.map((d) => d.incident);
  const severity = highestSeverity(nearbyIncidents);
  const nearestKm = nearby.length > 0 ? nearby[0].distanceKm : null;

  return {
    place,
    nearbyIncidents,
    highestSeverity: severity,
    nearestDistanceKm: nearestKm,
    riskLevel: riskLevelFromSeverity(severity, nearestKm),
  };
}

/** Compute risk for all saved places, sorted by danger first */
export function computeAllPlaceRisks(
  places: SavedPlace[],
  incidents: Incident[],
): PlaceRiskSummary[] {
  const riskOrder: Record<PlaceRiskSummary["riskLevel"], number> = {
    danger: 4,
    "at-risk": 3,
    monitor: 2,
    safe: 1,
  };

  return places
    .map((place) => computePlaceRisk(place, incidents))
    .sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);
}
