import type { SavedPlace } from "@/types/incident";
import { zoneRing } from "@/lib/danger-zone";

type MlMap = import("maplibre-gl").Map;
type GeoJSONSource = import("maplibre-gl").GeoJSONSource;

/**
 * The visitor's own things on the map, drawn only in this browser:
 * - saved places ("My places"), as pins with their labels;
 * - "Show my location": a dot and its accuracy circle.
 * Neither is stored by these layers or sent anywhere. Both are re-added after
 * a theme change (a style swap drops all sources).
 */

export interface DeviceLocation {
  lat: number;
  lon: number;
  /** Accuracy radius reported by the browser, in metres. */
  accuracyM: number;
}

const PLACES_SOURCE = "saved-places";
const LOCATION_SOURCE = "my-location";
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/** Accuracy circles are drawn between 50 m and 50 km. */
export function accuracyKm(location: DeviceLocation): number {
  return Math.min(50, Math.max(0.05, location.accuracyM / 1000));
}

function placesData(places: SavedPlace[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      properties: { label: p.label },
      geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
    })),
  };
}

function locationData(location: DeviceLocation | null): GeoJSON.FeatureCollection {
  if (!location) return EMPTY;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "accuracy" },
        geometry: { type: "Polygon", coordinates: [zoneRing(location.lat, location.lon, accuracyKm(location))] },
      },
      {
        type: "Feature",
        properties: { kind: "dot" },
        geometry: { type: "Point", coordinates: [location.lon, location.lat] },
      },
    ],
  };
}

export function syncUserLayers(map: MlMap, places: SavedPlace[], location: DeviceLocation | null) {
  if (!map.getStyle()) return;
  const day = document.documentElement.dataset.theme === "day";
  if (!map.getSource(PLACES_SOURCE)) {
    map.addSource(PLACES_SOURCE, { type: "geojson", data: EMPTY });
    map.addLayer({
      id: "saved-place-pins",
      type: "circle",
      source: PLACES_SOURCE,
      paint: {
        "circle-radius": 6,
        "circle-color": "#06b6d4",
        "circle-stroke-color": day ? "#0f172a" : "#ffffff",
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "saved-place-labels",
      type: "symbol",
      source: PLACES_SOURCE,
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.7],
        "text-max-width": 12,
      },
      paint: day
        ? { "text-color": "#0e7490", "text-halo-color": "#ffffff", "text-halo-width": 2 }
        : { "text-color": "#a5f3fc", "text-halo-color": "#0f172a", "text-halo-width": 2 },
    });
  }
  if (!map.getSource(LOCATION_SOURCE)) {
    map.addSource(LOCATION_SOURCE, { type: "geojson", data: EMPTY });
    map.addLayer({
      id: "my-location-accuracy",
      type: "fill",
      source: LOCATION_SOURCE,
      filter: ["==", ["get", "kind"], "accuracy"],
      paint: { "fill-color": "#3b82f6", "fill-opacity": 0.12 },
    });
    map.addLayer({
      id: "my-location-accuracy-line",
      type: "line",
      source: LOCATION_SOURCE,
      filter: ["==", ["get", "kind"], "accuracy"],
      paint: { "line-color": "#3b82f6", "line-opacity": 0.6, "line-width": 1 },
    });
    map.addLayer({
      id: "my-location-dot",
      type: "circle",
      source: LOCATION_SOURCE,
      filter: ["==", ["get", "kind"], "dot"],
      paint: { "circle-radius": 7, "circle-color": "#2563eb", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5 },
    });
  }
  (map.getSource(PLACES_SOURCE) as GeoJSONSource).setData(placesData(places));
  (map.getSource(LOCATION_SOURCE) as GeoJSONSource).setData(locationData(location));
}

/** [[west, south], [east, north]] around points, at least `minKm` from each. */
export function boundsAround(points: { lat: number; lon: number }[], minKm: number): [[number, number], [number, number]] {
  const dLat = minKm / 111;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const p of points) {
    const dLon = dLat / Math.max(0.2, Math.cos((p.lat * Math.PI) / 180));
    w = Math.min(w, p.lon - dLon);
    e = Math.max(e, p.lon + dLon);
    s = Math.min(s, p.lat - dLat);
    n = Math.max(n, p.lat + dLat);
  }
  return [[w, s], [e, n]];
}
