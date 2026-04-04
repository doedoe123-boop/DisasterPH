import { projectPhilippinesPoint, MAP_VIEW_BOX } from "@/lib/map";
import type { Incident } from "@/types/incident";
import { IncidentMarker } from "./incident-marker";

interface MapMarkerLayerProps {
  incidents: Incident[];
  selectedIncidentId: string;
  hoveredIncidentId: string | null;
  onHoverIncident: (id: string | null) => void;
  onSelectIncident: (incident: Incident) => void;
}

export function MapMarkerLayer({
  incidents,
  selectedIncidentId,
  hoveredIncidentId,
  onHoverIncident,
  onSelectIncident,
}: MapMarkerLayerProps) {
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

        return (
          <IncidentMarker
            key={incident.id}
            incident={incident}
            isSelected={incident.id === selectedIncidentId}
            isHovered={incident.id === hoveredIncidentId}
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
