import type { IncidentEventType, IncidentSeverity } from "@/types/incident";

export interface PrepTip {
  id: string;
  title: string;
  body: string;
  urgency: "now" | "soon" | "general";
}

const typhoonTips: PrepTip[] = [
  {
    id: "ty-1",
    title: "Secure your home",
    body: "Board up windows, secure loose objects outside. Move valuables to higher ground.",
    urgency: "now",
  },
  {
    id: "ty-2",
    title: "Prepare a go-bag",
    body: "Pack water, canned food, flashlight, batteries, first-aid kit, important documents in a waterproof bag.",
    urgency: "now",
  },
  {
    id: "ty-3",
    title: "Know your evacuation route",
    body: "Identify the nearest evacuation center. Charge all devices. Keep emergency numbers saved.",
    urgency: "soon",
  },
  {
    id: "ty-4",
    title: "Stay informed",
    body: "Monitor PAGASA bulletins. Do not cross flooded roads or bridges.",
    urgency: "general",
  },
];

const floodTips: PrepTip[] = [
  {
    id: "fl-1",
    title: "Move to higher ground",
    body: "If water is rising, evacuate immediately. Do not wait for official orders if you feel unsafe.",
    urgency: "now",
  },
  {
    id: "fl-2",
    title: "Avoid floodwaters",
    body: "Never walk, swim, or drive through flood waters. Just 15cm of moving water can knock you down.",
    urgency: "now",
  },
  {
    id: "fl-3",
    title: "Protect documents",
    body: "Place important papers and electronics in sealed bags. Elevate appliances if possible.",
    urgency: "soon",
  },
  {
    id: "fl-4",
    title: "After the flood",
    body: "Do not use water from contaminated sources. Boil water before drinking. Check for structural damage.",
    urgency: "general",
  },
];

const earthquakeTips: PrepTip[] = [
  {
    id: "eq-1",
    title: "Drop, Cover, Hold On",
    body: "Get under sturdy furniture. Protect your head and neck. Hold on until shaking stops.",
    urgency: "now",
  },
  {
    id: "eq-2",
    title: "Stay away from glass",
    body: "Move away from windows, mirrors, and heavy objects that could fall. If outdoors, move to an open area.",
    urgency: "now",
  },
  {
    id: "eq-3",
    title: "Check for damage",
    body: "After shaking stops, check for injuries and structural damage. Be prepared for aftershocks.",
    urgency: "soon",
  },
  {
    id: "eq-4",
    title: "Emergency kit ready",
    body: "Keep a flashlight, whistle, water, and first-aid kit accessible. Know how to turn off gas and electricity.",
    urgency: "general",
  },
];

const volcanoTips: PrepTip[] = [
  {
    id: "vo-1",
    title: "Evacuate if ordered",
    body: "Follow PHIVOLCS advisories. Leave the danger zone immediately when alert levels are raised.",
    urgency: "now",
  },
  {
    id: "vo-2",
    title: "Protect from ashfall",
    body: "Wear N95 masks or damp cloth over nose/mouth. Close windows and doors. Cover water tanks.",
    urgency: "now",
  },
  {
    id: "vo-3",
    title: "Avoid river valleys",
    body: "Lahars (volcanic mudflows) travel along river channels. Stay on high ground away from valleys.",
    urgency: "soon",
  },
  {
    id: "vo-4",
    title: "After eruption",
    body: "Clear ash from roofs to prevent collapse. Avoid driving in heavy ashfall. Keep monitoring advisories.",
    urgency: "general",
  },
];

const landslideTips: PrepTip[] = [
  {
    id: "ls-1",
    title: "Evacuate steep slopes",
    body: "If you live on or near a hillside, move to safer ground during heavy rain. Watch for tilting trees or cracking ground.",
    urgency: "now",
  },
  {
    id: "ls-2",
    title: "Listen for warnings",
    body: "Unusual sounds like cracking trees, boulders knocking, or faint rumbling may signal a landslide.",
    urgency: "now",
  },
  {
    id: "ls-3",
    title: "Stay alert at night",
    body: "Many landslides occur during heavy nighttime rain. Have an escape plan ready before sleeping.",
    urgency: "soon",
  },
];

const wildfireTips: PrepTip[] = [
  {
    id: "wf-1",
    title: "Prepare to evacuate",
    body: "Pack essentials and important documents. Know at least two evacuation routes from your area.",
    urgency: "now",
  },
  {
    id: "wf-2",
    title: "Reduce smoke exposure",
    body: "Stay indoors, close windows, and use damp towels under doors if smoke is heavy.",
    urgency: "now",
  },
  {
    id: "wf-3",
    title: "Create defensible space",
    body: "Clear dry vegetation within 10 meters of your home. Keep gutters free of leaves.",
    urgency: "general",
  },
];

const tipsByType: Record<IncidentEventType, PrepTip[]> = {
  typhoon: typhoonTips,
  flood: floodTips,
  earthquake: earthquakeTips,
  volcano: volcanoTips,
  landslide: landslideTips,
  wildfire: wildfireTips,
};

/**
 * Get preparation tips relevant to the current incident context.
 * Filters by urgency based on severity level.
 */
export function getPrepTips(
  eventType: IncidentEventType,
  severity: IncidentSeverity,
): PrepTip[] {
  const tips = tipsByType[eventType] ?? [];
  if (severity === "critical" || severity === "warning") {
    return tips; // Show all tips including "general"
  }
  if (severity === "watch") {
    return tips.filter((t) => t.urgency !== "general").length > 0
      ? tips.filter((t) => t.urgency !== "general")
      : tips.slice(0, 2);
  }
  // advisory — show general readiness tips only
  return tips.filter((t) => t.urgency === "general");
}
