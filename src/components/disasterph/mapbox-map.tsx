"use client";

import { useEffect, useRef, useState } from "react";
import type { CommunityReport, Incident } from "@/types/incident";
import {
  PH_BOUNDS,
  DEFAULT_CAMERA,
  INCIDENT_ZOOM,
  MAP_STYLE,
  HAZARD_COLORS,
  SEVERITY_RING,
} from "@/lib/mapbox";
import { eventTypeLabel, formatShortTime } from "@/lib/incidents";

// Type-only imports — the real module is loaded at runtime via import()
type MapLibreModule = typeof import("maplibre-gl");
type MlMap = import("maplibre-gl").Map;
type MlMarker = import("maplibre-gl").Marker;
type MlPopup = import("maplibre-gl").Popup;

interface Props {
  incidents: Incident[];
  communityReports: CommunityReport[];
  selectedIncidentId: string;
  hoveredIncidentId: string | null;
  onHoverIncident: (id: string | null) => void;
  onSelectIncident: (incident: Incident) => void;
  /** Width of the sidebar in pixels, used to offset the map center */
  sidebarWidth: number;
}

export default function MapLibreMapComponent({
  incidents,
  communityReports,
  selectedIncidentId,
  hoveredIncidentId,
  onHoverIncident,
  onSelectIncident,
  sidebarWidth,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const mlRef = useRef<MapLibreModule | null>(null);
  const markersRef = useRef<Map<string, MlMarker>>(new Map());
  const communityMarkersRef = useRef<Map<string, MlMarker>>(new Map());
  const popupRef = useRef<MlPopup | null>(null);
  const initialSidebarWidthRef = useRef(sidebarWidth);
  const [mapReady, setMapReady] = useState(false);

  // ── Initialize map (runtime-only import) ──
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    const markers = markersRef.current;
    const communityMarkers = communityMarkersRef.current;

    async function init() {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !containerRef.current) return;

      mlRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: DEFAULT_CAMERA.center,
        zoom: DEFAULT_CAMERA.zoom,
        pitch: DEFAULT_CAMERA.pitch,
        bearing: DEFAULT_CAMERA.bearing,
        maxBounds: [
          [110, 2],
          [135, 23],
        ],
        minZoom: 4,
        maxZoom: 16,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          visualizePitch: true,
        }),
        "bottom-right",
      );

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-left",
      );

      map.on("load", () => {
        if (cancelled) return;

        // Dark sky atmosphere
        map.setSky({
          "sky-color": "#040d16",
          "horizon-color": "#0a1e30",
          "fog-color": "#061420",
          "fog-ground-blend": 0.5,
          "horizon-fog-blend": 0.1,
          "sky-horizon-blend": 0.3,
        });

        // Fit to Philippines bounds with padding that accounts for sidebar
        map.fitBounds(PH_BOUNDS, {
          padding: {
            top: 40,
            bottom: 40,
            left: 40,
            right: 40 + initialSidebarWidthRef.current,
          },
          pitch: DEFAULT_CAMERA.pitch,
          bearing: DEFAULT_CAMERA.bearing,
          duration: 0,
        });

        setMapReady(true);
      });

      mapRef.current = map;
    }

    init();

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      communityMarkers.forEach((marker) => marker.remove());
      communityMarkers.clear();
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      mlRef.current = null;
      setMapReady(false);
    };
  }, []);

  // ── Resize observer ──
  useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapReady]);

  // ── Re-fit bounds when sidebar width changes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Small delay so the container has resized before we re-fit
    const timeout = setTimeout(() => {
      map.resize();
      map.fitBounds(PH_BOUNDS, {
        padding: { top: 40, bottom: 40, left: 40, right: 40 + sidebarWidth },
        pitch: DEFAULT_CAMERA.pitch,
        bearing: DEFAULT_CAMERA.bearing,
        duration: 600,
      });
    }, 50);
    return () => clearTimeout(timeout);
  }, [sidebarWidth, mapReady]);

  // ── Sync markers ──
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !mapReady) return;

    const existingIds = new Set(markersRef.current.keys());
    const newIds = new Set(incidents.map((i) => i.id));

    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    });

    incidents.forEach((incident) => {
      const existing = markersRef.current.get(incident.id);
      if (existing) {
        existing.setLngLat([incident.longitude, incident.latitude]);
        return;
      }

      const el = createMarkerElement(incident);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectIncident(incident);
      });
      el.addEventListener("mouseenter", () => onHoverIncident(incident.id));
      el.addEventListener("mouseleave", () => onHoverIncident(null));

      const marker = new ml.Marker({ element: el, anchor: "center" })
        .setLngLat([incident.longitude, incident.latitude])
        .addTo(map);

      markersRef.current.set(incident.id, marker);
    });
  }, [incidents, mapReady, onSelectIncident, onHoverIncident]);

  // ── Hazard zone overlays (earthquake impact / volcano exclusion) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const ZONE_SOURCE = "hazard-zones";
    const ZONE_FILL = "hazard-zones-fill";
    const ZONE_STROKE = "hazard-zones-stroke";

    const features = incidents
      .filter(
        (i) => i.event_type === "earthquake" || i.event_type === "volcano",
      )
      .map((i) => {
        const radiusKm =
          i.event_type === "earthquake"
            ? earthquakeImpactRadiusKm(i)
            : volcanoExclusionRadiusKm(i);
        if (radiusKm <= 0) return null;

        const color =
          i.event_type === "earthquake"
            ? HAZARD_COLORS.earthquake
            : HAZARD_COLORS.volcano;

        return {
          type: "Feature" as const,
          properties: {
            color,
            id: i.id,
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [circlePolygon(i.longitude, i.latitude, radiusKm)],
          },
        };
      })
      .filter(Boolean);

    const geojson = {
      type: "FeatureCollection" as const,
      features,
    };

    if (map.getSource(ZONE_SOURCE)) {
      (
        map.getSource(ZONE_SOURCE) as import("maplibre-gl").GeoJSONSource
      ).setData(geojson as GeoJSON.FeatureCollection);
    } else {
      map.addSource(ZONE_SOURCE, {
        type: "geojson",
        data: geojson as GeoJSON.FeatureCollection,
      });
      map.addLayer({
        id: ZONE_FILL,
        type: "fill",
        source: ZONE_SOURCE,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.08,
        },
      });
      map.addLayer({
        id: ZONE_STROKE,
        type: "line",
        source: ZONE_SOURCE,
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": 0.3,
          "line-width": 1.5,
          "line-dasharray": [4, 3],
        },
      });
    }
  }, [incidents, mapReady]);

  // ── Typhoon track lines + wind radius circles ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const TRACK_SOURCE = "typhoon-tracks";
    const TRACK_LINE_OBSERVED = "typhoon-track-observed";
    const TRACK_LINE_FORECAST = "typhoon-track-forecast";
    const WIND_SOURCE = "typhoon-wind";
    const WIND_FILL = "typhoon-wind-fill";
    const WIND_STROKE = "typhoon-wind-stroke";

    const trackFeatures: GeoJSON.Feature[] = [];
    const windFeatures: GeoJSON.Feature[] = [];

    for (const incident of incidents) {
      if (incident.event_type !== "typhoon") continue;

      const trackJson = incident.metadata?.track_points;
      if (typeof trackJson !== "string") continue;

      let points: Array<{
        lat: number;
        lon: number;
        time: string;
        forecast: boolean;
        windSpeedKph?: number;
      }>;
      try {
        points = JSON.parse(trackJson);
      } catch {
        continue;
      }
      if (!Array.isArray(points) || points.length < 2) continue;

      const observed = points.filter((p) => !p.forecast);
      const forecast = points.filter((p) => p.forecast);

      // Observed track line
      if (observed.length >= 2) {
        trackFeatures.push({
          type: "Feature",
          properties: { type: "observed" },
          geometry: {
            type: "LineString",
            coordinates: observed.map((p) => [p.lon, p.lat]),
          },
        });
      }

      // Forecast track line (dashed)
      if (forecast.length >= 2) {
        trackFeatures.push({
          type: "Feature",
          properties: { type: "forecast" },
          geometry: {
            type: "LineString",
            coordinates: forecast.map((p) => [p.lon, p.lat]),
          },
        });
      }

      // Connect observed tail to forecast head
      if (observed.length > 0 && forecast.length > 0) {
        const tail = observed[observed.length - 1];
        const head = forecast[0];
        trackFeatures.push({
          type: "Feature",
          properties: { type: "forecast" },
          geometry: {
            type: "LineString",
            coordinates: [
              [tail.lon, tail.lat],
              [head.lon, head.lat],
            ],
          },
        });
      }

      // Wind radius circle at current position
      const windKph = Number(incident.metadata?.wind_speed_kph ?? 0);
      if (windKph > 30) {
        const radiusKm = windKph * 0.8; // rough approximation
        windFeatures.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              circlePolygon(incident.longitude, incident.latitude, radiusKm),
            ],
          },
        });
      }
    }

    const trackGeoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: trackFeatures,
    };
    const windGeoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: windFeatures,
    };

    // Track lines
    if (map.getSource(TRACK_SOURCE)) {
      (
        map.getSource(TRACK_SOURCE) as import("maplibre-gl").GeoJSONSource
      ).setData(trackGeoJson);
    } else {
      map.addSource(TRACK_SOURCE, { type: "geojson", data: trackGeoJson });
      map.addLayer({
        id: TRACK_LINE_OBSERVED,
        type: "line",
        source: TRACK_SOURCE,
        filter: ["==", ["get", "type"], "observed"],
        paint: {
          "line-color": "#39d0ff",
          "line-width": 2.5,
          "line-opacity": 0.7,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: TRACK_LINE_FORECAST,
        type: "line",
        source: TRACK_SOURCE,
        filter: ["==", ["get", "type"], "forecast"],
        paint: {
          "line-color": "#39d0ff",
          "line-width": 2,
          "line-opacity": 0.4,
          "line-dasharray": [4, 4],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });
    }

    // Wind radius
    if (map.getSource(WIND_SOURCE)) {
      (
        map.getSource(WIND_SOURCE) as import("maplibre-gl").GeoJSONSource
      ).setData(windGeoJson);
    } else {
      map.addSource(WIND_SOURCE, { type: "geojson", data: windGeoJson });
      map.addLayer({
        id: WIND_FILL,
        type: "fill",
        source: WIND_SOURCE,
        paint: { "fill-color": "#39d0ff", "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: WIND_STROKE,
        type: "line",
        source: WIND_SOURCE,
        paint: {
          "line-color": "#39d0ff",
          "line-opacity": 0.25,
          "line-width": 1.5,
        },
      });
    }
  }, [incidents, mapReady]);

  // ── Update visual states ──
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const inner = el.querySelector<HTMLElement>(".marker-inner");
      const isSelected = id === selectedIncidentId;
      const isHovered = id === hoveredIncidentId;

      el.classList.toggle("marker-selected", isSelected);
      el.classList.toggle("marker-hovered", isHovered);

      if (isSelected) {
        el.style.zIndex = "30";
        if (inner)
          inner.style.filter = "drop-shadow(0 0 4px rgba(34,211,238,0.4))";
      } else if (isHovered) {
        el.style.zIndex = "20";
        if (inner)
          inner.style.filter = "drop-shadow(0 0 3px rgba(255,255,255,0.25))";
      } else {
        el.style.zIndex = "10";
        if (inner) inner.style.filter = "";
      }
    });
  }, [selectedIncidentId, hoveredIncidentId]);

  // ── Hover tooltip ──
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !mapReady) return;

    if (hoveredIncidentId) {
      const incident = incidents.find((i) => i.id === hoveredIncidentId);
      if (!incident) return;

      const metaLine = buildPopupMeta(incident);
      const html = `<div style="font-family:system-ui,sans-serif;min-width:180px;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#8899aa;">${eventTypeLabel[incident.event_type]}</span>
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${SEVERITY_RING[incident.severity]};margin-left:auto;">${incident.severity}</span>
        </div>
        <div style="font-size:13px;font-weight:600;color:#fff;line-height:1.3;">${incident.title}</div>${metaLine}
        <div style="font-size:11px;color:#8899aa;margin-top:3px;">${incident.region} · ${formatShortTime(incident.updated_at)}</div>
      </div>`;

      popupRef.current?.remove();
      popupRef.current = new ml.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 16,
        className: "bantay-popup",
        maxWidth: "260px",
      })
        .setLngLat([incident.longitude, incident.latitude])
        .setHTML(html)
        .addTo(map);
    } else {
      popupRef.current?.remove();
      popupRef.current = null;
    }
  }, [hoveredIncidentId, incidents, mapReady]);

  // ── Community report markers (visually distinct from official data) ──
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !mapReady) return;

    const approvedReports = communityReports.filter(
      (r) => r.status === "approved",
    );
    const existingIds = new Set(communityMarkersRef.current.keys());
    const newIds = new Set(approvedReports.map((r) => r.id));

    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        communityMarkersRef.current.get(id)?.remove();
        communityMarkersRef.current.delete(id);
      }
    });

    approvedReports.forEach((report) => {
      if (communityMarkersRef.current.has(report.id)) return;

      const el = createCommunityMarkerElement(report);
      const marker = new ml.Marker({ element: el, anchor: "center" })
        .setLngLat([report.longitude, report.latitude])
        .addTo(map);

      communityMarkersRef.current.set(report.id, marker);
    });
  }, [communityReports, mapReady]);

  // ── Fly to selected incident ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedIncidentId) return;

    const incident = incidents.find((i) => i.id === selectedIncidentId);
    if (!incident) return;

    map.flyTo({
      center: [incident.longitude, incident.latitude],
      zoom: Math.max(map.getZoom(), INCIDENT_ZOOM),
      pitch: 50,
      duration: 1800,
      essential: true,
    });
  }, [selectedIncidentId, incidents, mapReady]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#061420]">
          <div className="text-center">
            <div className="loading-shimmer mx-auto h-3 w-24 rounded-full" />
            <p className="mt-3 text-xs text-[var(--text-dim)]">Loading map…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function createMarkerElement(incident: Incident): HTMLDivElement {
  const color = HAZARD_COLORS[incident.event_type];
  const ringColor = SEVERITY_RING[incident.severity];

  // Severity-scaled sizing
  const size =
    incident.severity === "critical"
      ? 34
      : incident.severity === "warning"
        ? 30
        : incident.severity === "watch"
          ? 26
          : 22;

  const el = document.createElement("div");
  el.className = "mapbox-marker";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.cursor = "pointer";
  el.style.position = "relative";

  el.innerHTML = `
    <div style="position:absolute;inset:-4px;border-radius:50%;border:1.5px solid ${ringColor};opacity:0.4;animation:marker-ping 2.5s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>
    <div class="marker-inner" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${color};box-shadow:0 0 6px ${color}44;display:flex;align-items:center;justify-content:center;transition:transform 0.2s ease,filter 0.2s ease;">
      <span style="font-size:11px;font-weight:700;color:#000;text-shadow:0 0 2px rgba(255,255,255,0.3);">${getMarkerLabel(incident)}</span>
    </div>`;

  return el;
}

function getMarkerLabel(incident: Incident): string {
  if (incident.event_type === "earthquake") {
    const mag = incident.metadata?.magnitude;
    return mag ? `${Number(mag).toFixed(1)}` : "EQ";
  }
  const labels: Record<string, string> = {
    typhoon: "TY",
    flood: "FL",
    volcano: "VO",
    landslide: "LS",
    wildfire: "WF",
  };
  return labels[incident.event_type] ?? "??";
}

function buildPopupMeta(incident: Incident): string {
  const m = incident.metadata;
  const parts: string[] = [];

  if (incident.event_type === "earthquake") {
    if (m.magnitude != null) parts.push(`M${Number(m.magnitude).toFixed(1)}`);
    if (m.depth_km != null)
      parts.push(`${Number(m.depth_km).toFixed(0)} km deep`);
    if (m.tsunami_warning) parts.push("Tsunami warning");
  } else if (incident.event_type === "typhoon") {
    if (m.signal_number != null) parts.push(`Signal #${m.signal_number}`);
    if (m.wind_speed_kph != null) parts.push(`${m.wind_speed_kph} kph`);
  } else if (incident.event_type === "volcano") {
    if (m.alert_level) parts.push(`Alert: ${String(m.alert_level)}`);
  }

  if (parts.length === 0) return "";
  return `\n        <div style="font-size:11px;color:#ffbf47;margin-top:2px;font-weight:500;">${parts.join(" · ")}</div>`;
}

/** Earthquake felt-impact radius based on magnitude (approx) */
function earthquakeImpactRadiusKm(incident: Incident): number {
  const mag = Number(incident.metadata?.magnitude ?? 0);
  if (mag < 4) return 0;
  // Rough felt-area approximation: grows exponentially with magnitude
  if (mag >= 7) return 200;
  if (mag >= 6) return 120;
  if (mag >= 5) return 60;
  return 25;
}

/** Volcano danger/exclusion zone radius based on alert level */
function volcanoExclusionRadiusKm(incident: Incident): number {
  const alert = String(incident.metadata?.alert_level ?? "");
  switch (alert) {
    case "red":
    case "warning":
      return 14;
    case "orange":
    case "watch":
      return 8;
    case "yellow":
    case "advisory":
      return 4;
    default:
      return incident.severity === "critical"
        ? 14
        : incident.severity === "warning"
          ? 8
          : 4;
  }
}

/** Generate a polygon approximating a circle on the globe */
function circlePolygon(
  centerLon: number,
  centerLat: number,
  radiusKm: number,
  steps = 48,
): [number, number][] {
  const coords: [number, number][] = [];
  const km2deg = 1 / 111.32;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle) * km2deg;
    const dy =
      (radiusKm * Math.sin(angle) * km2deg) /
      Math.cos((centerLat * Math.PI) / 180);
    coords.push([centerLon + dy, centerLat + dx]);
  }
  return coords;
}

const COMMUNITY_CATEGORY_LABELS: Record<string, string> = {
  blocked_road: "RD",
  flooding: "FL",
  landslide: "LS",
  power_outage: "PW",
  evacuation: "EV",
  damage: "DM",
  other: "CR",
};

function createCommunityMarkerElement(report: CommunityReport): HTMLDivElement {
  const size = 22;
  const label = COMMUNITY_CATEGORY_LABELS[report.category] ?? "CR";

  const el = document.createElement("div");
  el.className = "community-marker";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.cursor = "default";
  el.style.position = "relative";
  el.title = `Community: ${report.title}`;

  el.innerHTML = `
    <div style="width:${size}px;height:${size}px;border-radius:4px;background:rgba(255,255,255,0.12);border:1.5px dashed rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;">
      <span style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.02em;">${label}</span>
    </div>`;

  return el;
}
