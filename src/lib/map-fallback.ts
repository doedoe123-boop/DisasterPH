import type { StyleSpecification } from "maplibre-gl";

/**
 * The map's fallback base: a plain outline of the Philippines and its
 * regions (public/map/ph-outline.json, kept by the service worker), used when
 * the base map from OpenFreeMap cannot load: offline, or when its server is
 * down. Events, danger zones and saved places are drawn on top as usual.
 *
 * Text on the map (magnitudes, cluster counts, labels) needs OpenFreeMap's
 * font files; the service worker keeps the ones already used, so they work
 * offline after one visit. Without them, markers still show their shape and
 * colour, and the list has every value.
 */

export const OUTLINE_URL = "/map/ph-outline.json";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

/** Sources of the OpenFreeMap styles (tile failures there mean the base map is down). */
export const BASE_SOURCES = new Set(["openmaptiles", "ne2_shaded"]);

export type BaseMapState = "normal" | "outline-offline" | "outline-unavailable";

/** Base tile failures before switching to the outline (with no tile loaded yet when online). */
export const OFFLINE_TILE_ERRORS = 3;
export const ONLINE_TILE_ERRORS = 6;

export function outlineStyle(theme: "day" | "night"): StyleSpecification {
  const day = theme === "day";
  return {
    version: 8,
    name: "DisasterPH outline",
    glyphs: GLYPHS,
    sources: {
      "ph-outline": {
        type: "geojson",
        data: OUTLINE_URL,
        attribution: "Outline: PSGC regions, faeldon/philippines-json-maps (MIT)",
      },
    },
    layers: [
      // Land clearly lighter than the sea in both themes, so the islands read.
      { id: "outline-water", type: "background", paint: { "background-color": day ? "#cddbe6" : "#0b0f14" } },
      { id: "outline-land", type: "fill", source: "ph-outline", paint: { "fill-color": day ? "#fbfaf7" : "#2a3442" } },
      {
        id: "outline-regions",
        type: "line",
        source: "ph-outline",
        paint: { "line-color": day ? "#a8a29e" : "#5b6b80", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.5, 9, 1.2] },
      },
    ],
  };
}

/** Whether the map is drawing the outline instead of the base map. */
export function isOutline(state: BaseMapState): boolean {
  return state !== "normal";
}
