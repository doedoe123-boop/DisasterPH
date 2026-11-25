import type { Incident } from "@/types/incident";

/**
 * Whether to point people to PHIVOLCS Tsunami Information for an earthquake.
 *
 * DisasterPH does not show tsunami warnings or a tsunami status. For strong,
 * shallow earthquakes it shows one neutral sentence with a link to PHIVOLCS.
 *
 * Bands: PHIVOLCS "Criteria Table Based on Preliminary Magnitude and Depth"
 * for LOCAL tsunamis (source within 200 km, under 1 hour to Philippine
 * shores), from the PHIVOLCS presentation "Philippine Tsunami Information"
 * at the Tsunami Ready Philippines National Workshop, 11 December 2025
 * (https://oceanexpert.org/downloadFile/61117). Below these bands PHIVOLCS's
 * template is "No Tsunami Threat"; inside them it is "Minor Sea-Level
 * Disturbance" or "Tsunami Warning":
 *
 *   6.5 <= M < 7.0  and depth <= 50 km
 *   7.0 <= M < 7.5  and depth <= 60 km
 *   7.5 <= M < 8.0  and depth <= 70 km
 *   M >= 8.0        and depth <= 100 km
 *
 * The table applies to "offshore tectonic earthquakes only and shallow inland
 * earthquakes that might generate sea level disturbance", so the bands are
 * applied to every earthquake DisasterPH lists (all are in or near the
 * Philippines). The inequality signs were lost in the PDF's text layer; the
 * reading above is the only one consistent with the table's rows.
 */
export const PHIVOLCS_TSUNAMI_URL = "https://tsunami.phivolcs.dost.gov.ph/";

const BANDS: Array<{ minMag: number; maxMag: number; maxDepthKm: number }> = [
  { minMag: 6.5, maxMag: 7.0, maxDepthKm: 50 },
  { minMag: 7.0, maxMag: 7.5, maxDepthKm: 60 },
  { minMag: 7.5, maxMag: 8.0, maxDepthKm: 70 },
  { minMag: 8.0, maxMag: Infinity, maxDepthKm: 100 },
];

/** True when magnitude and depth fall in a PHIVOLCS advisory/warning band. */
export function inTsunamiCriteria(magnitude: number, depthKm: number): boolean {
  if (!Number.isFinite(magnitude) || !Number.isFinite(depthKm) || depthKm < 0) return false;
  return BANDS.some((b) => magnitude >= b.minMag && magnitude < b.maxMag && depthKm <= b.maxDepthKm);
}

/** Show the "check PHIVOLCS Tsunami Information" sentence for this event? */
export function showTsunamiPointer(incident: Incident): boolean {
  if (incident.event_type !== "earthquake") return false;
  const m = incident.metadata;
  // Missing depth or magnitude: no sentence (don't guess).
  if (m.magnitude == null || m.depth_km == null) return false;
  return inTsunamiCriteria(Number(m.magnitude), Number(m.depth_km));
}
