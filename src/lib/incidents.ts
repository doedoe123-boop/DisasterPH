import type {
  DashboardStats,
  Incident,
  IncidentEventType,
  IncidentSeverity,
} from "@/types/incident";

const severityRank: Record<IncidentSeverity, number> = {
  critical: 4,
  warning: 3,
  watch: 2,
  advisory: 1,
};

export const eventTypeLabel: Record<IncidentEventType, string> = {
  typhoon: "Typhoon",
  flood: "Flood",
  earthquake: "Earthquake",
  volcano: "Volcano",
  landslide: "Landslide",
  wildfire: "Wildfire",
};

export function filterIncidentsByType(
  incidents: Incident[],
  eventType: string | null,
) {
  if (!eventType || eventType === "all") {
    return sortIncidents(incidents);
  }

  return sortIncidents(incidents.filter((incident) => incident.event_type === eventType));
}

export function sortIncidents(incidents: Incident[]) {
  return [...incidents].sort((a, b) => {
    const severityDelta = severityRank[b.severity] - severityRank[a.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });
}

export function buildDashboardStats(incidents: Incident[]): DashboardStats {
  return {
    activeAlerts: incidents.length,
    criticalAlerts: incidents.filter(
      (incident) => severityRank[incident.severity] >= severityRank.warning,
    ).length,
    sourcesOnline: 3,
    regionsTracked: new Set(incidents.map((incident) => incident.region)).size,
  };
}

export function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
