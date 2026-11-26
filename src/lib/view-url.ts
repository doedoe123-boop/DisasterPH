import { LAYER_KEYS, QUAKE_RANGES, DEFAULT_QUAKE_RANGE, type LayerKey, type QuakeRange } from "@/lib/quake-filters";
import type { IncidentEventType } from "@/types/incident";

/**
 * Shareable map view in the URL, e.g. `/?view=bicol&layers=volcano,quake&range=48h`.
 *
 * Rules (map handoff, addendum 1):
 * - Only the parameters below are read, and every value is checked against a
 *   fixed list. Anything unknown or invalid is ignored, never echoed back.
 * - Nothing personal goes in the URL: no saved places, no coordinates, and no
 *   region that was worked out from the device's location.
 *
 *   view    region, as a short name (REGION_SLUGS)
 *   show    the hazard tab: warning | quake | volcano | typhoon | flood | landslide
 *   layers  map layers that are on: quake,volcano,typhoon,other (all on: omitted)
 *   range   earthquake time range: 1h | 6h | 24h | 48h | 7d (24h: omitted)
 *   mag     3 to include M3.0+ (M3.5+: omitted)
 *   event   the chosen event's id (must exist in the current data)
 */

/** Short URL names for the official region names (PSGC). */
export const REGION_SLUGS: Readonly<Record<string, string>> = {
  ilocos: "Ilocos Region",
  "cagayan-valley": "Cagayan Valley",
  "central-luzon": "Central Luzon",
  calabarzon: "CALABARZON",
  bicol: "Bicol Region",
  "western-visayas": "Western Visayas",
  "central-visayas": "Central Visayas",
  "eastern-visayas": "Eastern Visayas",
  "zamboanga-peninsula": "Zamboanga Peninsula",
  "northern-mindanao": "Northern Mindanao",
  davao: "Davao Region",
  soccsksargen: "SOCCSKSARGEN",
  ncr: "National Capital Region",
  car: "Cordillera Administrative Region",
  caraga: "Caraga",
  mimaropa: "MIMAROPA",
  "negros-island": "Negros Island Region",
  barmm: "BARMM",
};

export function regionSlug(region: string): string | null {
  for (const [slug, name] of Object.entries(REGION_SLUGS)) if (name === region) return slug;
  return null;
}

export type HazardTab = IncidentEventType | "all" | "critical";

const SHOW_TO_TAB: Readonly<Record<string, HazardTab>> = {
  warning: "critical",
  quake: "earthquake",
  volcano: "volcano",
  typhoon: "typhoon",
  flood: "flood",
  landslide: "landslide",
};
const LAYER_NAMES: Readonly<Record<string, LayerKey>> = {
  quake: "earthquake",
  volcano: "volcano",
  typhoon: "typhoon",
  other: "other",
};
/** Event ids look like "PHIVOLCS:20261124T232954Z" or "EONET_1234". */
const EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9:_.-]{0,99}$/;

export interface ViewState {
  region?: string;
  tab?: HazardTab;
  /** Layers that are on, when not all of them are. */
  layers?: LayerKey[];
  range?: QuakeRange;
  includeSmall?: boolean;
  /** Not yet checked against the data; the page drops it if no such event exists. */
  event?: string;
}

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function first(params: Params, key: string): string | undefined {
  const v = params instanceof URLSearchParams ? params.get(key) ?? undefined : params[key];
  const s = Array.isArray(v) ? v[0] : v;
  // Values are short; anything long is not ours.
  return typeof s === "string" && s.length <= 120 ? s : undefined;
}

/** Reads only the allowed parameters; invalid values are dropped. */
export function parseViewParams(params: Params): ViewState {
  const out: ViewState = {};
  const view = first(params, "view")?.toLowerCase();
  if (view && Object.hasOwn(REGION_SLUGS, view)) out.region = REGION_SLUGS[view];

  const show = first(params, "show")?.toLowerCase();
  if (show && Object.hasOwn(SHOW_TO_TAB, show)) out.tab = SHOW_TO_TAB[show];

  const layers = first(params, "layers");
  if (layers !== undefined) {
    const keys = new Set<LayerKey>();
    for (const part of layers.toLowerCase().split(",")) {
      if (Object.hasOwn(LAYER_NAMES, part)) keys.add(LAYER_NAMES[part]);
    }
    // An empty or all-invalid list is ignored (it would hide everything).
    if (keys.size > 0 && keys.size < LAYER_KEYS.length) out.layers = LAYER_KEYS.filter((k) => keys.has(k));
  }

  const range = first(params, "range")?.toLowerCase();
  if (range && QUAKE_RANGES.some((r) => r.key === range)) out.range = range as QuakeRange;

  if (first(params, "mag") === "3") out.includeSmall = true;

  const event = first(params, "event");
  if (event && EVENT_ID.test(event)) out.event = event;
  return out;
}

/**
 * The query string for a view ("" for the default view). Only non-default
 * values are written, in a fixed order. `region` must already be one the
 * visitor chose from the list (not from their location).
 */
export function viewQuery(state: {
  region?: string | null;
  tab: HazardTab;
  layers: Record<LayerKey, boolean>;
  range: QuakeRange;
  includeSmall: boolean;
  event?: string | null;
}): string {
  const q = new URLSearchParams();
  const slug = state.region ? regionSlug(state.region) : null;
  if (slug) q.set("view", slug);
  const show = Object.entries(SHOW_TO_TAB).find(([, tab]) => tab === state.tab)?.[0];
  if (show) q.set("show", show);
  const on = LAYER_KEYS.filter((k) => state.layers[k]);
  if (on.length < LAYER_KEYS.length && on.length > 0) {
    q.set("layers", on.map((k) => Object.entries(LAYER_NAMES).find(([, v]) => v === k)![0]).join(","));
  }
  if (state.range !== DEFAULT_QUAKE_RANGE) q.set("range", state.range);
  if (state.includeSmall) q.set("mag", "3");
  if (state.event && EVENT_ID.test(state.event)) q.set("event", state.event);
  const s = q.toString();
  // URLSearchParams encodes ":" and ","; both are safe in a query, keep them readable.
  return s ? `?${s.replace(/%3A/gi, ":").replace(/%2C/gi, ",")}` : "";
}
