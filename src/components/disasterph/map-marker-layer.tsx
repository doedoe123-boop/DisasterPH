import { projectPhilippinesPoint, MAP_VIEW_BOX } from "@/lib/map";
import type { Incident, SavedPlace } from "@/types/incident";
import { haversineKm } from "@/lib/risk-summary";
import { useMemo } from "react";
import { IncidentMarker } from "./incident-marker";

interface MapMarkerLayerProps {
  incidents: Incident[];
  places: SavedPlace[];
  selectedIncidentId: string;
  hoveredIncidentId: string | null;
  onHoverIncident: (id: string | null) => void;
  onSelectIncident: (incident: Incident) => void;
}

const NEAR_RADIUS_KM = 100;

export function MapMarkerLayer({
  incidents,
  places,
  selectedIncidentId,
  hoveredIncidentId,
  onHoverIncident,
  onSelectIncident,
}: MapMarkerLayerProps) {
  const nearSet = useMemo(() => {
    if (places.length === 0) return new Set<string>();
    const ids = new Set<string>();
    for (const inc of incidents) {
      for (const p of places) {
        if (
          haversineKm(p.latitude, p.longitude, inc.latitude, inc.longitude) <=
          NEAR_RADIUS_KM
        ) {
          ids.add(inc.id);
          break;
        }
      }
    }
    return ids;
  }, [incidents, places]);

  const hasSavedPlaces = places.length > 0;

  return (
    <svg
      className="absolute inset-0 z-10 h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${MAP_VIEW_BOX.width} ${MAP_VIEW_BOX.height}`}
    >
      {incidents.map((incident) => {
        const point = projectPhilippinesPoint(
          incident.latitude,
          incident.longitude,
        );
        const isNear = nearSet.has(incident.id);

        return (
          <IncidentMarker
            key={incident.id}
            incident={incident}
            isSelected={incident.id === selectedIncidentId}
            isHovered={incident.id === hoveredIncidentId}
            isNearSavedPlace={isNear}
            dimmed={
              hasSavedPlaces &&
              !isNear &&
              incident.id !== selectedIncidentId &&
              incident.id !== hoveredIncidentId
            }
            onSelect={() => onSelectIncident(incident)}
            onHover={onHoverIncident}
            x={point.x}
            y={point.y}
          />
        );
      })}
    </svg>
  );
}
