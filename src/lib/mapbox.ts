import type { IncidentEventType } from "@/types/incident";

/** Philippines center coordinates */
export const PH_CENTER: [number, number] = [122.0, 12.5];

/** Philippines bounding box [SW, NE] */
export const PH_BOUNDS: [[number, number], [number, number]] = [
  [116.5, 4.5],
  [127.5, 21.2],
];

/** Default camera settings (used as initial hint before fitBounds) */
export const DEFAULT_CAMERA = {
  center: PH_CENTER,
  zoom: 5.2,
  // Flat and north-up by default; 3D terrain is opt-in.
  pitch: 0,
  bearing: 0,
} as const;

/** MapLibre night tile style (OpenFreeMap, free, no key) */
export const MAP_STYLE_NIGHT = "https://tiles.openfreemap.org/styles/dark";
/** MapLibre day tile style: Positron, a light grey map with few colours, so
 *  event markers and their labels stand out (was "bright", busier). */
export const MAP_STYLE_DAY = "https://tiles.openfreemap.org/styles/positron";
/** Returns the correct tile style URL based on the current theme */
export const getMapStyle = () =>
  typeof document !== "undefined" &&
  document.documentElement.dataset.theme === "day"
    ? MAP_STYLE_DAY
    : MAP_STYLE_NIGHT;

/** Color per hazard type */
export const HAZARD_COLORS: Record<IncidentEventType, string> = {
  earthquake: "#ffbf47",
  typhoon: "#39d0ff",
  volcano: "#ff6b35",
  flood: "#39d0ff",
  landslide: "#ffa726",
  wildfire: "#ff5d5d",
  tsunami: "#ef4444",
};

/** Severity to ring color */
export const SEVERITY_RING: Record<string, string> = {
  advisory: "#22d3ee",
  watch: "#fbbf24",
  warning: "#fb923c",
  critical: "#f87171",
};
