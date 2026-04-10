import type { IncidentEventType, IncidentSeverity } from "@/types/incident";
import type { Locale } from "@/lib/i18n";

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

const filipinoTips: Record<string, Pick<PrepTip, "title" | "body">> = {
  "ty-1": {
    title: "Patibayin ang bahay",
    body: "Isara o takpan ang bintana, itali ang maluluwag na gamit sa labas, at ilipat sa mataas na lugar ang mahahalagang gamit.",
  },
  "ty-2": {
    title: "Ihanda ang go-bag",
    body: "Maglagay ng tubig, de-lata, flashlight, baterya, first-aid kit, at importanteng dokumento sa waterproof na lalagyan.",
  },
  "ty-3": {
    title: "Alamin ang evacuation route",
    body: "Tukuyin ang pinakamalapit na evacuation center. I-charge ang devices at i-save ang emergency numbers.",
  },
  "ty-4": {
    title: "Makinig sa opisyal na balita",
    body: "Bantayan ang PAGASA bulletins. Huwag tumawid sa baha, ilog, o tulay na may malakas na agos.",
  },
  "fl-1": {
    title: "Lumipat sa mataas na lugar",
    body: "Kung tumataas ang tubig, lumikas agad. Huwag maghintay kung hindi na ligtas ang paligid.",
  },
  "fl-2": {
    title: "Iwasan ang baha",
    body: "Huwag lumakad, lumangoy, o magmaneho sa baha. Kahit mababaw na agos ay puwedeng makatumba.",
  },
  "fl-3": {
    title: "Protektahan ang dokumento",
    body: "Ilagay ang papeles at electronics sa sealed bags. Itaas ang appliances kung kaya.",
  },
  "fl-4": {
    title: "Pagkatapos ng baha",
    body: "Huwag uminom ng posibleng kontaminadong tubig. Pakuluan muna at suriin ang pinsala sa bahay.",
  },
  "eq-1": {
    title: "Dapa, Kubli, Kapit",
    body: "Pumasok sa ilalim ng matibay na mesa. Protektahan ang ulo at leeg hanggang tumigil ang pagyanig.",
  },
  "eq-2": {
    title: "Lumayo sa salamin",
    body: "Lumayo sa bintana, salamin, at mabibigat na bagay na maaaring mahulog. Kung nasa labas, pumunta sa bukas na lugar.",
  },
  "eq-3": {
    title: "Suriin ang pinsala",
    body: "Pagkatapos ng pagyanig, tingnan kung may nasaktan o may structural damage. Maghanda sa aftershocks.",
  },
  "eq-4": {
    title: "Ihanda ang emergency kit",
    body: "Maghanda ng flashlight, pito, tubig, at first-aid kit. Alamin kung paano patayin ang gas at kuryente.",
  },
  "vo-1": {
    title: "Lumikas kung inutusan",
    body: "Sundin ang PHIVOLCS advisories. Umalis agad sa danger zone kapag tumaas ang alert level.",
  },
  "vo-2": {
    title: "Proteksyon sa ashfall",
    body: "Gumamit ng N95 mask o basang tela sa ilong at bibig. Isara ang bintana at takpan ang water tanks.",
  },
  "vo-3": {
    title: "Iwasan ang lambak at ilog",
    body: "Ang lahar ay dumadaan sa river channels. Manatili sa mataas na lugar at lumayo sa valleys.",
  },
  "vo-4": {
    title: "Pagkatapos ng pagputok",
    body: "Tanggalin ang abo sa bubong para maiwasan ang pagbagsak. Iwasang magmaneho sa makapal na ashfall.",
  },
  "ls-1": {
    title: "Lumikas sa matarik na lugar",
    body: "Kung malapit sa gilid ng bundok o burol, lumipat sa ligtas na lugar kapag malakas ang ulan.",
  },
  "ls-2": {
    title: "Makinig sa senyales",
    body: "Ang tunog ng pagbitak ng puno, gumugulong na bato, o dagundong ay maaaring senyales ng pagguho.",
  },
  "ls-3": {
    title: "Mag-ingat sa gabi",
    body: "Maraming pagguho ang nangyayari habang malakas ang ulan sa gabi. Ihanda ang escape plan bago matulog.",
  },
  "wf-1": {
    title: "Maghanda sa paglikas",
    body: "Ihanda ang essentials at dokumento. Alamin ang dalawang posibleng ruta palabas ng lugar.",
  },
  "wf-2": {
    title: "Iwasan ang usok",
    body: "Manatili sa loob, isara ang bintana, at gumamit ng basang tuwalya sa ilalim ng pinto kung makapal ang usok.",
  },
  "wf-3": {
    title: "Linisin ang paligid",
    body: "Alisin ang tuyong damo at dahon malapit sa bahay. Panatilihing malinis ang alulod.",
  },
};

export function localizePrepTip(tip: PrepTip, locale: Locale): PrepTip {
  if (locale !== "fil") return tip;
  const translated = filipinoTips[tip.id];
  return translated ? { ...tip, ...translated } : tip;
}
