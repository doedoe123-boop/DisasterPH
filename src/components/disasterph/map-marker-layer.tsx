import { projectPhilippinesPoint, MAP_VIEW_BOX } from "@/lib/map";
import type { Incident } from "@/types/incident";
import { IncidentMarker } from "./incident-marker";

interface MapMarkerLayerProps {
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncident: (incident: Incident) => void;
}

export function MapMarkerLayer({
  incidents,
  selectedIncidentId,
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
            onSelect={() => onSelectIncident(incident)}
            x={point.x}
            y={point.y}
          />
        );
      })}
    </svg>
  );
}
