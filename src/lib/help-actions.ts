import type { HelpAction, Incident } from "@/types/incident";

/**
 * Generate context-aware help actions based on the selected incident.
 * Actions are prioritized by relevance to the incident type and severity.
 */
export function getHelpActions(incident: Incident | undefined): HelpAction[] {
  if (!incident) return getDefaultActions();

  const actions: HelpAction[] = [];
  const { event_type, severity } = incident;

  // ── High-severity: emergency contacts first ──
  if (severity === "critical" || severity === "warning") {
    actions.push({
      id: "ndrrmc",
      label: "Call NDRRMC",
      description: "National disaster hotline",
      icon: "phone",
      actionType: "call",
      href: "tel:+6328911-1406",
    });
    actions.push({
      id: "red-cross",
      label: "Red Cross PH",
      description: "143 emergency line",
      icon: "phone",
      actionType: "call",
      href: "tel:143",
    });
  }

  // ── Source-specific actions ──
  if (event_type === "typhoon" || event_type === "flood") {
    actions.push({
      id: "pagasa-advisory",
      label: "PAGASA Advisories",
      description: "Official weather bulletins",
      icon: "link",
      actionType: "link",
      href: "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin",
    });
    if (event_type === "typhoon") {
      actions.push({
        id: "pagasa-tcws",
        label: "Wind Signal Map",
        description: "Tropical cyclone wind signals",
        icon: "link",
        actionType: "link",
        href: "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin",
      });
    }
    if (event_type === "flood") {
      actions.push({
        id: "pagasa-rainfall",
        label: "Rainfall Advisory",
        description: "Hourly rainfall monitoring",
        icon: "link",
        actionType: "link",
        href: "https://www.pagasa.dost.gov.ph/flood",
      });
    }
  }

  if (event_type === "earthquake" || event_type === "volcano") {
    actions.push({
      id: "phivolcs-bulletin",
      label: "PHIVOLCS Bulletin",
      description:
        event_type === "earthquake"
          ? "Earthquake information"
          : "Volcano bulletin",
      icon: "link",
      actionType: "link",
      href:
        event_type === "earthquake"
          ? "https://earthquake.phivolcs.dost.gov.ph/"
          : "https://www.phivolcs.dost.gov.ph/index.php/volcano-hazard/volcano-bulletin2",
    });
  }

  // ── Share incident ──
  actions.push({
    id: "share-incident",
    label: "Share Incident",
    description: "Send hazard info to contacts",
    icon: "share",
    actionType: "share",
    copyText: buildShareText(incident),
  });

  // ── Copy summary ──
  actions.push({
    id: "copy-summary",
    label: "Copy Summary",
    description: "Copy incident details",
    icon: "copy",
    actionType: "copy",
    copyText: buildShareText(incident),
  });

  // ── Lower-severity: general resources ──
  if (severity === "advisory" || severity === "watch") {
    actions.push({
      id: "ndrrmc-low",
      label: "Call NDRRMC",
      description: "National disaster hotline",
      icon: "phone",
      actionType: "call",
      href: "tel:+6328911-1406",
    });
  }

  // ── Safety checklist (always useful) ──
  actions.push({
    id: "safety-checklist",
    label: "Safety Tips",
    description: getSafetyTipDescription(event_type),
    icon: "checklist",
    actionType: "internal",
  });

  return actions;
}

function getDefaultActions(): HelpAction[] {
  return [
    {
      id: "ndrrmc",
      label: "Call NDRRMC",
      description: "National disaster hotline",
      icon: "phone",
      actionType: "call",
      href: "tel:+6328911-1406",
    },
    {
      id: "red-cross",
      label: "Red Cross PH",
      description: "143 emergency line",
      icon: "phone",
      actionType: "call",
      href: "tel:143",
    },
    {
      id: "pagasa",
      label: "PAGASA",
      description: "Weather forecasts & warnings",
      icon: "link",
      actionType: "link",
      href: "https://www.pagasa.dost.gov.ph/",
    },
    {
      id: "phivolcs",
      label: "PHIVOLCS",
      description: "Earthquake & volcano monitoring",
      icon: "link",
      actionType: "link",
      href: "https://www.phivolcs.dost.gov.ph/",
    },
  ];
}

function getSafetyTipDescription(eventType: Incident["event_type"]): string {
  const tips: Record<string, string> = {
    typhoon: "Typhoon preparedness steps",
    flood: "Flood safety guidelines",
    earthquake: "Earthquake safety: Drop, Cover, Hold",
    volcano: "Volcanic hazard precautions",
    landslide: "Landslide awareness tips",
    wildfire: "Wildfire evacuation guidance",
  };
  return tips[eventType] ?? "General safety preparedness";
}

function buildShareText(incident: Incident): string {
  const severity = incident.severity.toUpperCase();
  return `[${severity}] ${incident.title} — ${incident.region}. Source: ${incident.source}. Updated: ${new Date(incident.updated_at).toLocaleString("en-PH")}`;
}
