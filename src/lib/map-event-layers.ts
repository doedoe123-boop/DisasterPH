import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MlMap,
  MapGeoJSONFeature,
} from "maplibre-gl";
import type { Incident } from "@/types/incident";
import { HAZARD_COLORS, SEVERITY_RING } from "@/lib/mapbox";

/**
 * Events drawn as MapLibre layers (not HTML markers), so the map can cluster
 * them, draw them under the base map's place labels and stay light on
 * low-end phones.
 *
 * Encoding (readable without colour):
 *   - Earthquakes: circle sized by magnitude, the magnitude written on it.
 *     Nearby quakes cluster; a cluster shows the count and the largest
 *     magnitude ("12" / "max M4.6"). Tapping a cluster zooms in.
 *   - Volcanoes: triangle with the PHIVOLCS alert level number; each level
 *     1-5 has its own colour as well.
 *   - Tropical cyclones: circle with the highest wind signal number.
 *   - Anything else (NASA EONET floods, landslides…): square with a letter.
 * Volcanoes and cyclones are drawn above earthquakes.
 *
 * Markers are drawn above the base map's labels, and each one reserves its
 * area in label placement (an invisible "blocker" icon), so a place name that
 * would overlap a marker is hidden instead of being drawn across it. Labels
 * elsewhere still show.
 *
 * Every marker has an invisible hit layer at least 22 px in radius (44 px
 * tap target). Keyboard users choose events from the event list instead.
 */

export const QUAKE_SOURCE = "events-quakes";
export const STATUS_SOURCE = "events-status";

const L = {
  quakeHit: "events-quake-hit",
  quake: "events-quake",
  quakeLabel: "events-quake-label",
  clusterHit: "events-cluster-hit",
  cluster: "events-cluster",
  clusterCount: "events-cluster-count",
  clusterMax: "events-cluster-max",
  statusHit: "events-status-hit",
  status: "events-status-icon",
  quakeBlock: "events-quake-block",
  quakeRing: "events-quake-selected-ring",
  statusRing: "events-status-selected-ring",
  clusterBlock: "events-cluster-block",
} as const;

/** Layers a tap or hover is tested against, topmost first. */
export const EVENT_HIT_LAYERS = [L.statusHit, L.quakeHit, L.clusterHit];
/** Visible layers (for checks that read what is drawn). */
export const EVENT_VISIBLE_LAYERS = [L.status, L.quake, L.cluster];

/** PHIVOLCS alert levels 1-5: each visibly distinct (and numbered). */
export const VOLCANO_LEVEL_COLORS = ["#9ca3af", "#facc15", "#fb923c", "#f05a28", "#dc2626", "#7f1d1d"];
/** Number colour on each level's triangle (white on the dark reds). */
export const VOLCANO_LEVEL_TEXT = ["#111827", "#111827", "#111827", "#111827", "#ffffff", "#ffffff"];

const FONT = ["Noto Sans Bold"];

/** Magnitude -> circle radius (px). */
const QUAKE_RADIUS: ExpressionSpecification = [
  "interpolate", ["linear"], ["coalesce", ["get", "mag"], 3],
  3, 11, 4, 13, 5, 16, 6, 20, 7, 24, 8, 28,
];

/** Zoom from which earthquakes are never clustered. */
export const QUAKE_SPLIT_ZOOM = 9;

/** Is this earthquake drawn on its own right now (not inside a cluster)? */
export function quakeShownAlone(map: MlMap, id: string): boolean {
  if (!map.getLayer(L.quake)) return true;
  return map.queryRenderedFeatures({ layers: [L.quake], filter: ["==", ["get", "id"], id] }).length > 0;
}

/** Opacity by age: solid in the last hour, fainter as quakes get older. */
const AGE_OPACITY: ExpressionSpecification = ["step", ["coalesce", ["get", "age"], 0], 1, 1, 0.9, 6, 0.78, 24, 0.62, 48, 0.48];

/** Size of the transparent "blocker" image (px); scaled to each marker. */
const BLOCK_PX = 8;

function statusKind(incident: Incident): { icon: string; label: string } {
  const m = incident.metadata;
  if (incident.event_type === "volcano") {
    const level = Math.max(0, Math.min(5, Number(m.alert_level) || 0));
    return { icon: `ev-volcano-${level}`, label: level ? String(level) : "?" };
  }
  if (incident.event_type === "typhoon") {
    const signal = Number(m.signal_number);
    return { icon: "ev-typhoon", label: Number.isFinite(signal) && signal > 0 ? String(signal) : "TC" };
  }
  if (incident.event_type === "tsunami") {
    // PHIVOLCS tsunami bulletin: TW (warning) or TA (advisory), else T.
    const kind = String(m.tsunami_kind ?? "");
    return kind === "warning"
      ? { icon: "ev-tsunami-warning", label: "TW" }
      : { icon: "ev-tsunami-advisory", label: kind === "advisory" ? "TA" : "T" };
  }
  if (incident.event_type === "flood" && incident.source === "PAGASA") {
    // PAGASA rainfall warning: the level's initial on a drop in its colour
    // (R / O / Y; A for a rainfall advisory). River basin: the status's
    // initials ("Flood Watch" -> "FW").
    if (m.product === "basin") {
      const initials = String(m.basin_status ?? "").split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
      return { icon: "ev-basin", label: initials || "FL" };
    }
    const level = String(m.warning_level ?? "").toLowerCase();
    if (level === "red" || level === "orange" || level === "yellow") {
      return { icon: `ev-rain-${level}`, label: level[0].toUpperCase() };
    }
    return { icon: "ev-rain-advisory", label: "A" };
  }
  const letters: Record<string, string> = { flood: "FL", landslide: "LS", wildfire: "WF" };
  return { icon: "ev-other", label: letters[incident.event_type] ?? "?" };
}

const SEVERITY_RANK: Record<string, number> = { advisory: 0, watch: 1, warning: 2, critical: 3 };

/** GeoJSON for both sources. Only plain values from the feed go into properties. */
export function eventCollections(incidents: Incident[], now: number = Date.now()): {
  quakes: GeoJSON.FeatureCollection;
  statuses: GeoJSON.FeatureCollection;
} {
  const quakes: GeoJSON.Feature[] = [];
  const statuses: GeoJSON.Feature[] = [];
  for (const i of incidents) {
    if (!Number.isFinite(i.latitude) || !Number.isFinite(i.longitude)) continue;
    const geometry: GeoJSON.Point = { type: "Point", coordinates: [i.longitude, i.latitude] };
    const rank = SEVERITY_RANK[i.severity] ?? 0;
    if (i.event_type === "earthquake") {
      const mag = Number(i.metadata.magnitude);
      quakes.push({
        type: "Feature",
        geometry,
        properties: {
          id: i.id,
          mag: Number.isFinite(mag) ? mag : null,
          label: Number.isFinite(mag) ? mag.toFixed(1) : "EQ",
          ring: SEVERITY_RING[i.severity] ?? SEVERITY_RING.advisory,
          rank,
          // Hours since the quake: older quakes are drawn fainter.
          age: Math.max(0, Math.round(((now - Date.parse(i.started_at || i.updated_at)) / 3_600_000) * 10) / 10) || 0,
        },
      });
    } else {
      const { icon, label } = statusKind(i);
      statuses.push({
        type: "Feature",
        geometry,
        properties: {
          id: i.id, icon, label, rank, type: i.event_type,
          textColor:
            i.event_type === "volcano"
              ? VOLCANO_LEVEL_TEXT[Number(label) || 0] ?? "#111827"
              : RAIN_TEXT[icon] ?? "#111827",
        },
      });
    }
  }
  return {
    quakes: { type: "FeatureCollection", features: quakes },
    statuses: { type: "FeatureCollection", features: statuses },
  };
}

/** PAGASA rainfall warning colours (Red / Orange / Yellow) and the advisory and basin markers. */
export const RAIN_COLORS: Record<string, string> = {
  "ev-rain-red": "#dc2626",
  "ev-rain-orange": "#f97316",
  "ev-rain-yellow": "#facc15",
  "ev-rain-advisory": "#64748b",
  "ev-basin": "#2563eb",
  "ev-tsunami-warning": "#b91c1c",
  "ev-tsunami-advisory": "#f59e0b",
};
const RAIN_TEXT: Record<string, string> = {
  "ev-rain-red": "#ffffff",
  "ev-rain-orange": "#111827",
  "ev-rain-yellow": "#111827",
  "ev-rain-advisory": "#ffffff",
  "ev-basin": "#ffffff",
  "ev-tsunami-warning": "#ffffff",
  "ev-tsunami-advisory": "#111827",
};

/* ── Icons (drawn once per style on a canvas; no image files to fetch) ── */

const ICON_PX = 30;
const RATIO = 2;

function drawIcon(draw: (ctx: CanvasRenderingContext2D, s: number) => void): ImageData {
  const size = ICON_PX * RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.lineJoin = "round";
  draw(ctx, size);
  return ctx.getImageData(0, 0, size, size);
}

function addIcons(map: MlMap) {
  const add = (name: string, data: ImageData) => {
    if (!map.hasImage(name)) map.addImage(name, data, { pixelRatio: RATIO });
  };
  VOLCANO_LEVEL_COLORS.forEach((color, level) => {
    add(
      `ev-volcano-${level}`,
      drawIcon((ctx, s) => {
        const pad = s * 0.08;
        ctx.beginPath();
        ctx.moveTo(s / 2, pad);
        ctx.lineTo(s - pad, s - pad);
        ctx.lineTo(pad, s - pad);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = s * 0.07;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }),
    );
  });
  // Transparent square: reserves a marker's area in label placement.
  add("ev-blocker", new ImageData(BLOCK_PX * RATIO, BLOCK_PX * RATIO));
  add(
    "ev-typhoon",
    drawIcon((ctx, s) => {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = HAZARD_COLORS.typhoon;
      ctx.fill();
      ctx.lineWidth = s * 0.07;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }),
  );
  // Rainfall warnings and advisories: a drop.
  for (const name of ["ev-rain-red", "ev-rain-orange", "ev-rain-yellow", "ev-rain-advisory"]) {
    add(
      name,
      drawIcon((ctx, s) => {
        const cx = s / 2;
        const r = s * 0.3;
        const cy = s * 0.6;
        ctx.beginPath();
        ctx.moveTo(cx, s * 0.06);
        ctx.bezierCurveTo(cx + r * 0.35, s * 0.25, cx + r, cy - r * 0.6, cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI);
        ctx.bezierCurveTo(cx - r, cy - r * 0.6, cx - r * 0.35, s * 0.25, cx, s * 0.06);
        ctx.closePath();
        ctx.fillStyle = RAIN_COLORS[name];
        ctx.fill();
        ctx.lineWidth = s * 0.07;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }),
    );
  }
  // Tsunami bulletin: a diamond (its own shape, so it reads without colour).
  for (const name of ["ev-tsunami-warning", "ev-tsunami-advisory"]) {
    add(
      name,
      drawIcon((ctx, s) => {
        const pad = s * 0.04;
        ctx.beginPath();
        ctx.moveTo(s / 2, pad);
        ctx.lineTo(s - pad, s / 2);
        ctx.lineTo(s / 2, s - pad);
        ctx.lineTo(pad, s / 2);
        ctx.closePath();
        ctx.fillStyle = RAIN_COLORS[name];
        ctx.fill();
        ctx.lineWidth = s * 0.07;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }),
    );
  }
  // River basin status: a rounded square with a wave line.
  add(
    "ev-basin",
    drawIcon((ctx, s) => {
      const pad = s * 0.1;
      const w = s - 2 * pad;
      ctx.beginPath();
      ctx.roundRect(pad, pad, w, w, s * 0.18);
      ctx.fillStyle = RAIN_COLORS["ev-basin"];
      ctx.fill();
      ctx.lineWidth = s * 0.07;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }),
  );
  add(
    "ev-other",
    drawIcon((ctx, s) => {
      const pad = s * 0.12;
      ctx.fillStyle = HAZARD_COLORS.landslide;
      ctx.fillRect(pad, pad, s - 2 * pad, s - 2 * pad);
      ctx.lineWidth = s * 0.07;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(pad, pad, s - 2 * pad, s - 2 * pad);
    }),
  );
}

/** First label (symbol) layer of the base style: danger zones and tracks go below it. */
export function firstLabelLayer(map: MlMap): string | undefined {
  return map.getStyle()?.layers?.find((l) => l.type === "symbol" && !l.id.startsWith("events-"))?.id;
}

/**
 * Add sources, icons and layers (idempotent; call again after a style
 * swap). `largestLabel` is the localized "max" word for cluster labels.
 */
export function ensureEventLayers(map: MlMap, incidents: Incident[], largestLabel: string): void {
  const data = eventCollections(incidents);
  addIcons(map);
  if (!map.getSource(QUAKE_SOURCE)) {
    map.addSource(QUAKE_SOURCE, {
      type: "geojson",
      data: data.quakes,
      promoteId: "id",
      cluster: true,
      clusterRadius: 38,
      // From zoom 9 (QUAKE_SPLIT_ZOOM) every quake is drawn on its own.
      clusterMaxZoom: QUAKE_SPLIT_ZOOM - 1,
      clusterProperties: { maxMag: ["max", ["coalesce", ["get", "mag"], 0]] },
    });
  }
  if (!map.getSource(STATUS_SOURCE)) {
    map.addSource(STATUS_SOURCE, { type: "geojson", data: data.statuses, promoteId: "id" });
  }
  // On top of the base map (labels included); see the blocker layers.
  const add = (layer: Parameters<MlMap["addLayer"]>[0]) => {
    if (!map.getLayer(layer.id)) map.addLayer(layer);
  };
  const clustered: ExpressionSpecification = ["has", "point_count"];
  const single: ExpressionSpecification = ["!", ["has", "point_count"]];
  const emphasis: ExpressionSpecification = [
    "case",
    ["boolean", ["feature-state", "selected"], false], 1,
    ["boolean", ["feature-state", "hover"], false], 1,
    0,
  ];

  // Earthquake clusters
  const clusterRadius: ExpressionSpecification = ["step", ["get", "point_count"], 15, 10, 18, 30, 22];
  add({ id: L.clusterHit, type: "circle", source: QUAKE_SOURCE, filter: clustered,
    paint: { "circle-radius": ["max", 22, ["+", clusterRadius, 6]], "circle-opacity": 0, "circle-stroke-opacity": 0 } });
  add({ id: L.cluster, type: "circle", source: QUAKE_SOURCE, filter: clustered,
    paint: {
      "circle-radius": clusterRadius,
      "circle-color": "#1f2937",
      "circle-opacity": 0.92,
      "circle-stroke-color": HAZARD_COLORS.earthquake,
      "circle-stroke-width": 3,
    } });
  add({ id: L.clusterBlock, type: "symbol", source: QUAKE_SOURCE, filter: clustered,
    layout: {
      "icon-image": "ev-blocker",
      "icon-size": ["/", ["*", 2, ["+", clusterRadius, 3]], BLOCK_PX],
      "icon-allow-overlap": true, "icon-ignore-placement": false,
    } });
  add({ id: L.clusterCount, type: "symbol", source: QUAKE_SOURCE, filter: clustered,
    layout: {
      "text-field": ["to-string", ["get", "point_count"]],
      "text-font": FONT, "text-size": 13,
      "text-allow-overlap": true, "text-ignore-placement": true,
    },
    paint: { "text-color": "#ffffff" } });
  add({ id: L.clusterMax, type: "symbol", source: QUAKE_SOURCE, filter: clustered,
    layout: {
      "text-field": ["concat", largestLabel, " M", ["number-format", ["get", "maxMag"], { "min-fraction-digits": 1, "max-fraction-digits": 1 }]],
      "text-font": FONT, "text-size": 12, "text-offset": [0, 2.1],
      // Always shown, and keeps base labels from being drawn across it.
      "text-allow-overlap": true, "text-ignore-placement": false,
    },
    paint: { "text-color": "#111827", "text-halo-color": "#ffffff", "text-halo-width": 1.6 } });

  // Single earthquakes
  // The chosen event: a bold orange ring (links the marker to its card).
  const selectedOpacity: ExpressionSpecification = ["case", ["boolean", ["feature-state", "selected"], false], 1, 0];
  add({ id: L.quakeRing, type: "circle", source: QUAKE_SOURCE, filter: single,
    paint: {
      "circle-radius": ["+", QUAKE_RADIUS, 7],
      "circle-color": "rgba(0,0,0,0)",
      "circle-stroke-color": "#f97316",
      "circle-stroke-width": 4,
      "circle-stroke-opacity": selectedOpacity,
    } });
  add({ id: L.quakeHit, type: "circle", source: QUAKE_SOURCE, filter: single,
    paint: { "circle-radius": ["max", 22, ["+", QUAKE_RADIUS, 8]], "circle-opacity": 0, "circle-stroke-opacity": 0 } });
  add({ id: L.quake, type: "circle", source: QUAKE_SOURCE, filter: single,
    layout: { "circle-sort-key": ["coalesce", ["get", "mag"], 0] },
    paint: {
      "circle-radius": ["+", QUAKE_RADIUS, ["*", emphasis, 2]],
      "circle-color": HAZARD_COLORS.earthquake,
      "circle-stroke-color": ["case", ["==", emphasis, 1], "#ffffff", ["get", "ring"]],
      "circle-stroke-width": ["+", 2, ["*", emphasis, 1.5]],
      // Selected or hovered quakes are always solid.
      "circle-opacity": ["case", ["==", emphasis, 1], 1, AGE_OPACITY],
      "circle-stroke-opacity": ["case", ["==", emphasis, 1], 1, AGE_OPACITY],
    } });
  add({ id: L.quakeBlock, type: "symbol", source: QUAKE_SOURCE, filter: single,
    layout: {
      "icon-image": "ev-blocker",
      "icon-size": ["/", ["*", 2, ["+", QUAKE_RADIUS, 3]], BLOCK_PX],
      "icon-allow-overlap": true, "icon-ignore-placement": false,
    } });
  add({ id: L.quakeLabel, type: "symbol", source: QUAKE_SOURCE, filter: single,
    layout: {
      "text-field": ["get", "label"],
      "text-font": FONT, "text-size": ["interpolate", ["linear"], ["coalesce", ["get", "mag"], 3], 3, 10, 5, 12, 7, 14],
      "symbol-sort-key": ["-", 0, ["coalesce", ["get", "mag"], 0]],
      "text-allow-overlap": true, "text-ignore-placement": true,
    },
    paint: { "text-color": "#111827", "text-opacity": ["max", 0.75, AGE_OPACITY] } });

  // Volcanoes, cyclones, other (above earthquakes)
  add({ id: L.statusRing, type: "circle", source: STATUS_SOURCE,
    paint: {
      "circle-radius": 21,
      "circle-color": "rgba(0,0,0,0)",
      "circle-stroke-color": "#f97316",
      "circle-stroke-width": 4,
      "circle-stroke-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 1, 0],
    } });
  add({ id: L.statusHit, type: "circle", source: STATUS_SOURCE,
    paint: { "circle-radius": 22, "circle-opacity": 0, "circle-stroke-opacity": 0 } });
  add({ id: L.status, type: "symbol", source: STATUS_SOURCE,
    layout: {
      "icon-image": ["get", "icon"],
      "icon-size": ["case", ["==", ["get", "type"], "volcano"], 1.05, 0.95],
      "icon-allow-overlap": true, "icon-ignore-placement": false,
      "text-field": ["get", "label"],
      "text-font": FONT, "text-size": 12,
      // Triangles: the number sits low, inside the wide part.
      "text-offset": ["case", ["==", ["get", "type"], "volcano"], ["literal", [0, 0.3]], ["literal", [0, 0]]],
      "text-allow-overlap": true, "text-ignore-placement": true,
      "symbol-sort-key": ["-", 0, ["get", "rank"]],
    },
    paint: {
      "text-color": ["get", "textColor"],
      "text-halo-color": "#ffffff",
      "text-halo-width": 0,
      "icon-opacity": 1,
    } });
}

export function setEventData(map: MlMap, incidents: Incident[]): void {
  const data = eventCollections(incidents);
  (map.getSource(QUAKE_SOURCE) as GeoJSONSource | undefined)?.setData(data.quakes);
  (map.getSource(STATUS_SOURCE) as GeoJSONSource | undefined)?.setData(data.statuses);
}

/** Which source holds an event (for feature-state). */
export function sourceFor(incident: Incident | undefined): string | null {
  if (!incident) return null;
  return incident.event_type === "earthquake" ? QUAKE_SOURCE : STATUS_SOURCE;
}

/** The topmost event or cluster under a screen point, or null. */
export function eventAt(map: MlMap, point: { x: number; y: number }): MapGeoJSONFeature | null {
  const layers = EVENT_HIT_LAYERS.filter((id) => map.getLayer(id));
  if (layers.length === 0) return null;
  const hits = map.queryRenderedFeatures([point.x, point.y], { layers });
  // Order by our layer priority: statuses, then single quakes, then clusters.
  // Within a layer, hit areas can overlap (two quakes a kilometre apart):
  // take the marker whose centre is nearest the tap.
  const distance = (f: MapGeoJSONFeature) => {
    const p = map.project((f.geometry as GeoJSON.Point).coordinates as [number, number]);
    return Math.hypot(p.x - point.x, p.y - point.y);
  };
  for (const id of EVENT_HIT_LAYERS) {
    const inLayer = hits.filter((f) => f.layer.id === id);
    if (inLayer.length) return inLayer.reduce((best, f) => (distance(f) < distance(best) ? f : best));
  }
  return null;
}
