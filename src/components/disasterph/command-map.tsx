import type { Incident } from "@/types/incident";
import { MapMarkerLayer } from "./map-marker-layer";
import { PhilippinesMapLayer } from "./philippines-map-layer";

interface CommandMapProps {
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncident: (incident: Incident) => void;
}

export function CommandMap({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}: CommandMapProps) {
  return (
    <div className="map-glow relative h-full overflow-hidden bg-[radial-gradient(circle_at_50%_18%,rgba(45,124,255,0.16),transparent_24%),radial-gradient(circle_at_52%_42%,rgba(57,208,255,0.12),transparent_30%),linear-gradient(180deg,#061420_0%,#040d16_100%)]">
      <div className="absolute inset-0 dashboard-grid opacity-50" />

      <PhilippinesMapLayer />

      <MapMarkerLayer
        incidents={incidents}
        onSelectIncident={onSelectIncident}
        selectedIncidentId={selectedIncidentId}
      />
    </div>
  );
}
