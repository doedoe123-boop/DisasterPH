import type { Incident, SavedPlace } from "@/types/incident";
import { computePlaceRisk } from "@/lib/risk-summary";
import { REGION_NAMES } from "@/lib/geo/ph-regions";

/**
 * The area a visitor chose to focus on. "all" shows the whole country.
 * Device location is only used after a deliberate action and is reduced to
 * a region; it is never stored as coordinates.
 */
export type SelectedArea =
  | { kind: "all" }
  | { kind: "region"; region: string }
  | { kind: "place"; placeId: string };

export const AREA_STORAGE_KEY = "disasterph-area";
export const ALL_AREAS: SelectedArea = { kind: "all" };

export function parseArea(raw: string | null): SelectedArea {
  if (!raw) return ALL_AREAS;
  try {
    const v = JSON.parse(raw) as Partial<{ kind: string; region: string; placeId: string }>;
    if (v.kind === "region" && typeof v.region === "string" && REGION_NAMES.includes(v.region)) {
      return { kind: "region", region: v.region };
    }
    if (v.kind === "place" && typeof v.placeId === "string" && v.placeId) {
      return { kind: "place", placeId: v.placeId };
    }
  } catch {
    /* fall through */
  }
  return ALL_AREAS;
}

export function serializeArea(area: SelectedArea): string {
  return JSON.stringify(area);
}

/** A saved-place area whose place no longer exists falls back to all areas. */
export function resolveArea(area: SelectedArea, places: SavedPlace[]): SelectedArea {
  if (area.kind === "place" && !places.some((p) => p.id === area.placeId)) return ALL_AREAS;
  return area;
}

/** Regions under a PAGASA wind signal ("A|B|C"), from the bulletin's areas. */
function signalRegions(incident: Incident): string[] {
  const v = incident.metadata?.signal_regions;
  return typeof v === "string" && v ? v.split("|") : [];
}

/**
 * Whether an incident concerns the area: same region (offshore events count
 * for their nearest region; typhoons count for every region under one of
 * their wind signals), or, for a saved place, within that place's
 * monitoring radius or region (same rules as the risk summary).
 */
export function incidentInArea(
  incident: Incident,
  area: SelectedArea,
  places: SavedPlace[],
): boolean {
  if (area.kind === "all") return true;
  if (area.kind === "region") {
    return (
      incident.region === area.region ||
      (typeof incident.metadata?.near_region === "string" &&
        incident.metadata.near_region === area.region) ||
      signalRegions(incident).includes(area.region)
    );
  }
  const place = places.find((p) => p.id === area.placeId);
  if (!place) return true;
  // Same rule as saved-place alerts (risk-summary.ts), including wind signals.
  return computePlaceRisk(place, [incident]).monitoredIncidents.length > 0;
}

export function areaLabel(area: SelectedArea, places: SavedPlace[], allLabel: string): string {
  if (area.kind === "region") return area.region;
  if (area.kind === "place") return places.find((p) => p.id === area.placeId)?.label ?? allLabel;
  return allLabel;
}
