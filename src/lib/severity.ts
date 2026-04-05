import type {
  IncidentSeverity,
  PlaceRiskSummary,
  SeverityTone,
  SourceHealthStatus,
} from "@/types/incident";

export const severityRank: Record<IncidentSeverity, number> = {
  critical: 4,
  warning: 3,
  watch: 2,
  advisory: 1,
};

export const severityToneByIncident: Record<IncidentSeverity, SeverityTone> = {
  advisory: "yellow",
  watch: "yellow",
  warning: "orange",
  critical: "red",
};

export const severityLabel: Record<IncidentSeverity, string> = {
  advisory: "Advisory",
  watch: "Watch",
  warning: "Warning",
  critical: "Critical",
};

export const severityVisual = {
  yellow: {
    dot: "bg-amber-300",
    badge: "text-amber-200 border-amber-300/20 bg-amber-300/10",
    accent: "border-l-amber-400/40",
    panel: "from-amber-950/40 to-transparent border-l-amber-400/40",
    text: "text-amber-300",
  },
  orange: {
    dot: "bg-orange-400",
    badge: "text-orange-200 border-orange-300/20 bg-orange-300/10",
    accent: "border-l-orange-400/60",
    panel: "from-orange-950/40 to-transparent border-l-orange-400/60",
    text: "text-orange-300",
  },
  red: {
    dot: "bg-red-400",
    badge:
      "text-white border-red-500 bg-red-600 font-bold shadow-[inset_0_4px_24px_rgba(239,68,68,0.15)]",
    accent:
      "border-l-red-500 border-red-500/50 bg-red-500/10 shadow-[inset_0_4px_24px_rgba(239,68,68,0.15)]",
    panel: "from-red-950/50 to-transparent border-l-red-500/70",
    text: "text-red-300",
  },
  safe: {
    dot: "bg-emerald-400",
    badge: "text-emerald-200 border-emerald-300/20 bg-emerald-300/10",
    accent: "border-l-emerald-400/40",
    panel: "from-emerald-950/30 to-transparent border-l-emerald-400/40",
    text: "text-emerald-300/80",
  },
} as const;

export const sourceStatusVisual: Record<
  SourceHealthStatus,
  { dot: string; label: string; tone: string }
> = {
  healthy: {
    dot: "bg-emerald-400",
    label: "Live",
    tone: "text-emerald-200",
  },
  delayed: {
    dot: "bg-amber-400",
    label: "Delayed",
    tone: "text-amber-200",
  },
  degraded: {
    dot: "bg-red-400",
    label: "Degraded",
    tone: "text-red-200",
  },
  unavailable: {
    dot: "bg-zinc-500",
    label: "Unavailable",
    tone: "text-zinc-300",
  },
};

export function toneFromSeverity(severity: IncidentSeverity): SeverityTone {
  return severityToneByIncident[severity];
}

export function visualFromSeverity(severity: IncidentSeverity) {
  return severityVisual[toneFromSeverity(severity)];
}

export function visualFromRiskLevel(riskLevel: PlaceRiskSummary["riskLevel"]) {
  switch (riskLevel) {
    case "danger":
      return severityVisual.red;
    case "at-risk":
      return severityVisual.orange;
    case "monitor":
      return severityVisual.yellow;
    case "safe":
    default:
      return severityVisual.safe;
  }
}
