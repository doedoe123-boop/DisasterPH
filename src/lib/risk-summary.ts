import type {
  Incident,
  IncidentSeverity,
  PlaceRiskSummary,
  SavedPlace,
} from "@/types/incident";
import { severityRank } from "@/lib/severity";
import { estimateRegion } from "@/lib/ingest/regions";

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

const hazardRadiusKm: Record<Incident["event_type"], number> = {
  earthquake: 160,
  typhoon: 320,
  flood: 110,
  volcano: 140,
  landslide: 85,
  wildfire: 90,
};

function highestSeverity(incidents: Incident[]): IncidentSeverity | null {
  if (incidents.length === 0) return null;
  return incidents.reduce((max, inc) =>
    severityRank[inc.severity] > severityRank[max.severity] ? inc : max,
  ).severity;
}

function strongestIncident(incidents: Incident[]): Incident | null {
  if (incidents.length === 0) return null;

  return [...incidents].sort((a, b) => {
    const severityDelta = severityRank[b.severity] - severityRank[a.severity];
    if (severityDelta !== 0) return severityDelta;

    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })[0];
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

function monitoringRadiusForIncident(incident: Incident) {
  return hazardRadiusKm[incident.event_type];
}

/**
 * Maximum distance for a match, scaled down for low-severity events.
 * Advisory-level events only match within 40% of the base hazard radius.
 * Watch-level events match within 70%.
 */
function effectiveRadiusForIncident(incident: Incident): number {
  const base = hazardRadiusKm[incident.event_type];
  if (incident.severity === "advisory") return base * 0.4;
  if (incident.severity === "watch") return base * 0.7;
  return base;
}

export type MatchReason = "region" | "proximity" | "both";

function incidentMatchesPlace(place: SavedPlace, incident: Incident) {
  const placeRegion = estimateRegion(place.latitude, place.longitude);
  const distanceKm = haversineKm(
    place.latitude,
    place.longitude,
    incident.latitude,
    incident.longitude,
  );
  const sameRegion = placeRegion === incident.region;
  const withinRadius = distanceKm <= effectiveRadiusForIncident(incident);

  // For advisory-level incidents, require proximity — region-only match is too broad
  const effectiveRegionMatch =
    sameRegion &&
    (incident.severity !== "advisory" ||
      distanceKm <= monitoringRadiusForIncident(incident));

  const match = effectiveRegionMatch || withinRadius;
  const reason: MatchReason | null = match
    ? effectiveRegionMatch && withinRadius
      ? "both"
      : effectiveRegionMatch
        ? "region"
        : "proximity"
    : null;

  return {
    distanceKm,
    placeRegion,
    sameRegion: effectiveRegionMatch,
    withinRadius,
    match,
    reason,
  };
}

function buildMatchingSummary(
  matchedWithReasons: Array<{ incident: Incident; reason: MatchReason | null }>,
  placeRegion: string,
  nearestKm: number | null,
) {
  const incidents = matchedWithReasons.map((m) => m.incident);

  if (incidents.length === 0) {
    return `Watching ${placeRegion} with no active nearby hazards.`;
  }

  const regionalCount = matchedWithReasons.filter(
    (m) => m.reason === "region" || m.reason === "both",
  ).length;
  const proximityCount = matchedWithReasons.filter(
    (m) => m.reason === "proximity" || m.reason === "both",
  ).length;
  const distanceText =
    nearestKm !== null
      ? `Nearest incident about ${Math.round(nearestKm)} km away.`
      : null;

  const parts: string[] = [];
  if (regionalCount > 0) {
    parts.push(`${regionalCount} matched by region`);
  }
  if (proximityCount > 0) {
    parts.push(`${proximityCount} matched by proximity`);
  }

  const reasonText =
    parts.length > 0
      ? parts.join(", ") + "."
      : `Monitoring ${incidents.length} matched incident${incidents.length > 1 ? "s" : ""}.`;

  return distanceText ? `${reasonText} ${distanceText}` : reasonText;
}

/** Compute risk summary for a single saved place */
export function computePlaceRisk(
  place: SavedPlace,
  incidents: Incident[],
): PlaceRiskSummary {
  const placeRegion = estimateRegion(place.latitude, place.longitude);
  const withDistance = incidents.map((inc) => ({
    incident: inc,
    ...incidentMatchesPlace(place, inc),
  }));

  const monitored = withDistance.filter((candidate) => candidate.match);
  const nearby = monitored.sort((a, b) => a.distanceKm - b.distanceKm);

  const nearbyIncidents = nearby.map((d) => d.incident);
  const severity = highestSeverity(nearbyIncidents);
  const nearestKm = nearby.length > 0 ? nearby[0].distanceKm : null;
  const strongest = strongestIncident(nearbyIncidents);
  const freshestUpdateAt =
    nearbyIncidents.length > 0
      ? nearbyIncidents.reduce((latest, inc) => {
          return new Date(inc.updated_at).getTime() > new Date(latest).getTime()
            ? inc.updated_at
            : latest;
        }, nearbyIncidents[0].updated_at)
      : null;

  return {
    place,
    nearbyIncidents,
    monitoredIncidents: nearbyIncidents,
    highestSeverity: severity,
    nearestDistanceKm: nearestKm,
    riskLevel: riskLevelFromSeverity(severity, nearestKm),
    strongestIncident: strongest,
    freshestUpdateAt,
    placeRegion,
    matchingSummary: buildMatchingSummary(
      nearby.map((n) => ({ incident: n.incident, reason: n.reason })),
      placeRegion,
      nearestKm,
    ),
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
