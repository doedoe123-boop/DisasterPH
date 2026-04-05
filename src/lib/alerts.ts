import { severityRank } from "@/lib/severity";
import type {
  AlertEvent,
  AlertSnapshot,
  Incident,
  PlaceRiskSummary,
} from "@/types/incident";

export interface AlertEngineResult {
  events: AlertEvent[];
  snapshots: Record<string, AlertSnapshot>;
}

function buildMessage(
  incident: Incident,
  placeLabels: string[],
  trigger: AlertEvent["trigger"],
) {
  const placeText =
    placeLabels.length > 0
      ? placeLabels.slice(0, 2).join(", ") +
        (placeLabels.length > 2 ? ` +${placeLabels.length - 2} more` : "")
      : "saved places";

  switch (trigger) {
    case "new-critical":
      return `${incident.title} is critical for ${placeText}.`;
    case "new-warning":
      return `${incident.title} now affects ${placeText}.`;
    case "escalation":
      return `${incident.title} escalated in severity near ${placeText}.`;
    case "new-place-impact":
      return `${incident.title} now affects additional saved places: ${placeText}.`;
    default:
      return `${incident.title} requires attention near ${placeText}.`;
  }
}

function buildCurrentSnapshot(
  incident: Incident,
  placeRisks: PlaceRiskSummary[],
): AlertSnapshot | null {
  const placeIds = placeRisks
    .filter((risk) =>
      risk.monitoredIncidents.some((candidate) => candidate.id === incident.id),
    )
    .map((risk) => risk.place.id)
    .sort();

  if (placeIds.length === 0) return null;

  return {
    incidentId: incident.id,
    severity: incident.severity,
    placeIds,
    updatedAt: incident.updated_at,
  };
}

export function evaluateAlertEngine(
  incidents: Incident[],
  placeRisks: PlaceRiskSummary[],
  previousSnapshots: Record<string, AlertSnapshot>,
): AlertEngineResult {
  const nextSnapshots: Record<string, AlertSnapshot> = {};
  const events: AlertEvent[] = [];

  for (const incident of incidents) {
    const snapshot = buildCurrentSnapshot(incident, placeRisks);
    if (!snapshot) continue;

    nextSnapshots[incident.id] = snapshot;
    const previous = previousSnapshots[incident.id];
    const affectedPlaces = placeRisks.filter((risk) =>
      snapshot.placeIds.includes(risk.place.id),
    );
    const placeLabels = affectedPlaces.map((risk) => risk.place.label);

    let trigger: AlertEvent["trigger"] | null = null;

    if (!previous) {
      if (severityRank[incident.severity] >= severityRank.warning) {
        trigger =
          incident.severity === "critical" ? "new-critical" : "new-warning";
      }
    } else if (
      severityRank[incident.severity] > severityRank[previous.severity] &&
      severityRank[incident.severity] >= severityRank.warning
    ) {
      trigger = "escalation";
    } else {
      const newlyAffectedPlaceIds = snapshot.placeIds.filter(
        (placeId) => !previous.placeIds.includes(placeId),
      );

      if (
        newlyAffectedPlaceIds.length > 0 &&
        severityRank[incident.severity] >= severityRank.warning
      ) {
        trigger = "new-place-impact";
      }
    }

    if (!trigger) continue;

    const dedupeKey = [
      incident.id,
      trigger,
      incident.severity,
      ...snapshot.placeIds,
    ].join(":");

    events.push({
      id: `${dedupeKey}:${incident.updated_at}`,
      dedupeKey,
      incidentId: incident.id,
      incidentTitle: incident.title,
      incidentSeverity: incident.severity,
      trigger,
      placeIds: snapshot.placeIds,
      placeLabels,
      generatedAt: new Date().toISOString(),
      updatedAt: incident.updated_at,
      message: buildMessage(incident, placeLabels, trigger),
    });
  }

  return { events, snapshots: nextSnapshots };
}
