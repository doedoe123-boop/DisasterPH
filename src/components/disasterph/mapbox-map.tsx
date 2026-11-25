"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CommunityReport, Incident } from "@/types/incident";
import {
  PH_BOUNDS,
  DEFAULT_CAMERA,
  MAP_STYLE_NIGHT,
  MAP_STYLE_DAY,
  getMapStyle,
  HAZARD_COLORS,
  SEVERITY_RING,
} from "@/lib/mapbox";
import { eventTimeFull } from "@/lib/event-time";
import { PHIVOLCS_TSUNAMI_URL, showTsunamiPointer } from "@/lib/tsunami-check";
import { loadMapLibre } from "@/lib/maplibre-loader";
import { Mountain, LocateFixed } from "lucide-react";
import { TERRAIN_CONFIG, TERRAIN_SOURCE, disableTerrain, enableTerrain } from "@/lib/terrain";
import { focusZoom, isInView, mapPadding } from "@/lib/map-camera";
import { displayRegion } from "@/lib/geo/ph-regions";
import { eventLabel, severityText, t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { MapLegend } from "@/components/disasterph/map-legend";
import { applyBaseLabels } from "@/lib/map-labels";

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
  /** Width in pixels of a panel floating over the left edge of the map
   *  (the focus-mode incident card); 0 when nothing covers the map. */
  leftInset: number;
  /** Height in pixels of a panel over the bottom of the map (the phone list
   *  panel); 0 when nothing covers it. */
  bottomInset?: number;
}

/** Flat, north-up view of the whole country inside the unobstructed area. */
function fitNational(map: MlMap, leftInset: number, duration: number, bottomInset = 0) {
  const { clientWidth: w, clientHeight: h } = map.getContainer();
  map.fitBounds(PH_BOUNDS, {
    padding: mapPadding(w, h, leftInset, bottomInset),
    pitch: DEFAULT_CAMERA.pitch,
    bearing: DEFAULT_CAMERA.bearing,
    duration,
    essential: false,
  });
}

/** In the flat view the map cannot be rotated or tilted by accident (as in
 *  most web maps); 3D terrain turns those gestures back on. */
function setRotateGestures(map: MlMap, enabled: boolean) {
  if (enabled) {
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();
    map.keyboard.enableRotation();
  } else {
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();
    map.keyboard.disableRotation();
  }
}

export default function MapLibreMapComponent({
  incidents,
  communityReports,
  selectedIncidentId,
  hoveredIncidentId,
  onHoverIncident,
  onSelectIncident,
  leftInset,
  bottomInset = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const mlRef = useRef<MapLibreModule | null>(null);
  const markersRef = useRef<Map<string, MlMarker>>(new Map());
  const communityMarkersRef = useRef<Map<string, MlMarker>>(new Map());
  const popupRef = useRef<MlPopup | null>(null);
  // Read by long-lived map handlers; updated after commit.
  const leftInsetRef = useRef(leftInset);
  useEffect(() => {
    leftInsetRef.current = leftInset;
  }, [leftInset]);
  const bottomInsetRef = useRef(bottomInset);
  // Set once the resident pans/zooms/selects; until then layout changes
  // re-fit the national view instead of leaving it off-centre.
  const userMovedRef = useRef(false);
  // Re-fit when the phone list panel appears or goes (until the resident moves the map).
  useEffect(() => {
    bottomInsetRef.current = bottomInset;
    const map = mapRef.current;
    if (map && !userMovedRef.current) fitNational(map, leftInsetRef.current, 0, bottomInset);
  }, [bottomInset]);
  const [mapReady, setMapReady] = useState(false);
  // Set when MapLibre cannot load or start. "unsupported" = no WebGL2 (a
  // retry cannot help); "error" = e.g. a failed chunk load (retry may help).
  const [mapFailed, setMapFailed] = useState<false | "unsupported" | "error">(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  // Opt-in terrain: off by default, and only offered when a DEM source is configured.
  const [terrainOn, setTerrainOn] = useState(false);
  const [terrainFailed, setTerrainFailed] = useState(false);
  const terrainRef = useRef(false);
  const { locale } = useLocale();
  const mapCopy = t(locale).map;
  const incidentsRef = useRef(incidents);
  // Read later by the theme-change handler; updated after commit, not during render.
  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  // ── Initialize map (runtime-only import) ──
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let themeHandler: ((e: Event) => void) | null = null;
    const markers = markersRef.current;
    const communityMarkers = communityMarkersRef.current;

    async function init() {
      let maplibregl: MapLibreModule;
      let map: MlMap;
      try {
        maplibregl = await loadMapLibre();
        await import("maplibre-gl/dist/maplibre-gl.css");
        if (cancelled || !containerRef.current) return;

        // MapLibre v6 requires WebGL2; without it the constructor throws
        // GPUInitializationError instead of returning a map.
        map = new maplibregl.Map({
          container: containerRef.current,
          style: getMapStyle(),
          center: DEFAULT_CAMERA.center,
          zoom: DEFAULT_CAMERA.zoom,
          pitch: DEFAULT_CAMERA.pitch,
          bearing: DEFAULT_CAMERA.bearing,
          // No maxBounds: on a wide, short map a tight box forced the
          // camera to zoom in and cut off Mindanao. "Reset map view"
          // brings the resident back instead.
          minZoom: 3,
          maxZoom: 16,
          attributionControl: false,
          // MapLibre control labels (tooltips and accessible names). They can
          // only be set when the map is created, so the map is re-created
          // when the language changes.
          ...(locale === "fil" && { locale: MAPLIBRE_FIL_LOCALE }),
        });
      } catch (error) {
        if (!cancelled) {
          const name = error instanceof Error ? error.name : String(error);
          console.warn("Map unavailable:", name);
          setMapFailed(name === "GPUInitializationError" ? "unsupported" : "error");
        }
        return;
      }

      mlRef.current = maplibregl;

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          visualizePitch: true,
        }),
        "bottom-right",
      );

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        // Bottom-right, under the zoom buttons: the legend uses the bottom-left.
        "bottom-right",
      );

      map.on("load", () => {
        if (cancelled) return;

        // Theme-aware sky atmosphere
        applySky(map);
        applyBaseLabels(map);
        // Narrow maps: start the attribution collapsed to its "i" button (tap
        // to read it); expanded it covers the middle of a phone map.
        if (map.getContainer().clientWidth < 640) {
          map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
        }

        setRotateGestures(map, false);
        fitNational(map, leftInsetRef.current, 0, bottomInsetRef.current);

        setMapReady(true);
      });

      // Only gestures carry an originalEvent; programmatic moves do not.
      map.on("movestart", (e) => {
        if ((e as { originalEvent?: Event }).originalEvent) userMovedRef.current = true;
      });

      // Missing or failing DEM tiles never block the map: fall back to 2D.
      map.on("error", (e) => {
        if ((e as { sourceId?: string }).sourceId === TERRAIN_SOURCE) {
          setTerrainFailed(true);
          setTerrainOn(false);
        }
      });

      mapRef.current = map;

      themeHandler = (e: Event) => {
        const theme = (e as CustomEvent).detail.theme;
        map.setStyle(theme === "day" ? MAP_STYLE_DAY : MAP_STYLE_NIGHT);
        map.once("styledata", () => {
          applySky(map);
          applyBaseLabels(map);
          addAllSourcesAndLayers(map, incidentsRef.current);
          // Style swaps drop sources; restore terrain if it was on.
          if (terrainRef.current && TERRAIN_CONFIG) enableTerrain(map, TERRAIN_CONFIG, false);
        });
      };
      window.addEventListener("themechange", themeHandler);
    }

    init();

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      communityMarkers.forEach((marker) => marker.remove());
      communityMarkers.clear();
      popupRef.current?.remove();
      if (themeHandler) window.removeEventListener("themechange", themeHandler);
      mapRef.current?.remove();
      mapRef.current = null;
      mlRef.current = null;
      setMapReady(false);
    };
  }, [mapAttempt, locale]);

  // ── Resize observer ──
  useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;

    // The sidebar and feed sit beside the map, not over it, so they only
    // change the container size. Keep the national view fitted until the
    // resident moves the map; after that, leave their camera alone.
    const observer = new ResizeObserver(() => {
      map.resize();
      if (!userMovedRef.current) fitNational(map, leftInsetRef.current, 0, bottomInsetRef.current);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapReady]);

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
        existing.getElement().setAttribute("aria-label", markerLabel(incident, locale));
        return;
      }

      const el = createMarkerElement(incident, markerLabel(incident, locale));
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
  }, [incidents, mapReady, onSelectIncident, onHoverIncident, locale]);

  // ── Volcano Permanent Danger Zones (radius from the PHIVOLCS bulletin) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    syncHazardZones(map, incidents);
  }, [incidents, mapReady]);

  // ── Typhoon track lines + wind radius circles ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    syncTyphoonTracks(map, incidents);
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
    // incidents/mapReady: markers created after a selection still get the highlight.
  }, [selectedIncidentId, hoveredIncidentId, incidents, mapReady]);

  // ── Popup: the hovered event, otherwise the selected one ──
  // Showing it for the selection gives an offshore pin its context (place
  // and source description) on touch screens too, where there is no hover.
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !mapReady) return;

    const popupId = hoveredIncidentId ?? (selectedIncidentId || null);
    const incident = popupId ? incidents.find((i) => i.id === popupId) : undefined;
    if (incident) {

      popupRef.current?.remove();
      popupRef.current = new ml.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 16,
        className: "bantay-popup",
        maxWidth: "260px",
        // Opened by hover too: never move keyboard focus into it.
        focusAfterOpen: false,
      })
        .setLngLat([incident.longitude, incident.latitude])
        // Built with DOM nodes + textContent: feed text never becomes markup.
        .setDOMContent(buildPopupContent(incident, locale))
        .addTo(map);
    } else {
      popupRef.current?.remove();
      popupRef.current = null;
    }
  }, [hoveredIncidentId, selectedIncidentId, incidents, mapReady, locale]);

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

  // ── Bring a newly selected incident into view ──
  // Runs only when the resident's selection changes — not when the feed
  // refreshes — and moves the camera only if the pin is hidden or behind a
  // panel. Pitch and bearing are left as they are.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedIncidentId) return;

    const incident = incidentsRef.current.find((i) => i.id === selectedIncidentId);
    if (!incident) return;

    const lngLat: [number, number] = [incident.longitude, incident.latitude];
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    const padding = mapPadding(w, h, leftInsetRef.current, bottomInsetRef.current);
    if (isInView(map.project(lngLat), w, h, padding)) return;

    userMovedRef.current = true;
    map.easeTo({
      center: lngLat,
      zoom: focusZoom(map.getZoom()),
      // Centre the pin in the unobstructed area. (offset, not padding:
      // easeTo's padding would persist on the map after the move.)
      offset: [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2],
      duration: 700,
      essential: false,
    });
  }, [selectedIncidentId, mapReady]);

  // Apply the terrain toggle (no DEM request happens until it is turned on).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !TERRAIN_CONFIG) return;
    if (terrainOn) {
      enableTerrain(map, TERRAIN_CONFIG);
      setRotateGestures(map, true);
    } else if (terrainRef.current) {
      disableTerrain(map);
      setRotateGestures(map, false);
    }
    terrainRef.current = terrainOn;
  }, [terrainOn, mapReady]);

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    if (terrainRef.current) {
      // Turn terrain off without disableTerrain's own camera move, which
      // would interrupt the fit below.
      map.setTerrain(null);
      setRotateGestures(map, false);
      terrainRef.current = false;
      setTerrainOn(false);
    }
    userMovedRef.current = false;
    fitNational(map, leftInsetRef.current, 600, bottomInsetRef.current);
  };

  return (
    <div
      className="map-root relative h-full w-full"
      // Read by the legend, the top-left buttons and MapLibre's bottom controls.
      style={{ "--map-left-inset": `${leftInset}px`, "--map-bottom-inset": `${bottomInset}px` } as CSSProperties}
    >
      <div ref={containerRef} className="h-full w-full" />
      <MapLegend locale={locale} />
      {mapReady && !mapFailed && (
        <div
          // The inset panel (focus-mode card) is only shown at lg and up.
          className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5 lg:left-[calc(var(--map-left-inset)+0.75rem)]"
        >
          <button
            className="flex items-center gap-1.5 rounded-lg border border-overlay/15 bg-[var(--bg-panel)]/90 px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] shadow transition hover:bg-[var(--bg-panel)]"
            onClick={resetView}
            title={mapCopy.resetViewTitle}
            type="button"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {mapCopy.resetView}
          </button>
          {TERRAIN_CONFIG && (
          <button
            aria-pressed={terrainOn}
            className="flex items-center gap-1.5 rounded-lg border border-overlay/15 bg-[var(--bg-panel)]/90 px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] shadow transition hover:bg-[var(--bg-panel)]"
            onClick={() => {
              setTerrainFailed(false);
              setTerrainOn((on) => !on);
            }}
            type="button"
          >
            <Mountain className="h-3.5 w-3.5" />
            {terrainOn ? mapCopy.terrainOff : mapCopy.terrainOn}
          </button>
          )}
          {terrainFailed && (
            <p className="rounded-md bg-[var(--bg-panel)]/90 px-2 py-1 text-[11px] text-amber-300" role="status">
              {mapCopy.terrainFailed}
            </p>
          )}
        </div>
      )}
      {mapFailed ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-background p-4"
          role="status"
        >
          <div className="max-w-xs text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {mapCopy.unavailableTitle}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-dim)]">
              {mapCopy.unavailableBody}
            </p>
            {mapFailed === "error" && (
              <button
                className="mt-3 rounded-md border border-overlay/12 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-overlay/6"
                onClick={() => {
                  setMapFailed(false);
                  setMapAttempt((n) => n + 1);
                }}
                type="button"
              >
                {mapCopy.retry}
              </button>
            )}
          </div>
        </div>
      ) : (
        !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="loading-shimmer mx-auto h-3 w-24 rounded-full" />
              <p className="mt-3 text-xs text-[var(--text-dim)]">{mapCopy.loading}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/** Filipino labels for MapLibre's built-in controls (English uses defaults). */
const MAPLIBRE_FIL_LOCALE: Record<string, string> = {
  "NavigationControl.ZoomIn": "Palakihin",
  "NavigationControl.ZoomOut": "Paliitin",
  "NavigationControl.ResetBearing": "Ibalik sa hilaga",
  "AttributionControl.ToggleAttribution": "Ipakita o itago ang attribution",
  "AttributionControl.MapFeedback": "Feedback sa mapa",
  "FullscreenControl.Enter": "Buong screen",
  "FullscreenControl.Exit": "Lumabas sa buong screen",
  "Map.Title": "Mapa",
};

/* ═══════════════════════════════════════════════════════════
   EXTRACTED MAP HELPERS — called on init AND after style swap
   ═══════════════════════════════════════════════════════════ */

function applySky(map: MlMap) {
  const isDayMode = document.documentElement.dataset.theme === "day";
  map.setSky(
    isDayMode
      ? {
          "sky-color": "#c0d8f0",
          "horizon-color": "#e8eef5",
          "fog-color": "#dce4ec",
          "fog-ground-blend": 0.5,
          "horizon-fog-blend": 0.1,
          "sky-horizon-blend": 0.3,
        }
      : {
          "sky-color": "#040d16",
          "horizon-color": "#0a1e30",
          "fog-color": "#061420",
          "fog-ground-blend": 0.5,
          "horizon-fog-blend": 0.1,
          "sky-horizon-blend": 0.3,
        },
  );
}

function syncHazardZones(map: MlMap, incidents: Incident[]) {
  const ZONE_SOURCE = "hazard-zones";
  const ZONE_FILL = "hazard-zones-fill";
  const ZONE_STROKE = "hazard-zones-stroke";

  const features = incidents
    // Only the volcano Permanent Danger Zone, with the radius PHIVOLCS gives.
    // (Earthquakes have no circle: a felt area guessed from magnitude would
    // look official. Where shaking was felt comes from the PHIVOLCS bulletin.)
    .filter((i) => i.event_type === "volcano")
    .map((i) => {
      const radiusKm = volcanoExclusionRadiusKm(i);
      if (radiusKm <= 0) return null;
      const color = HAZARD_COLORS.volcano;

      return {
        type: "Feature" as const,
        properties: { color, id: i.id },
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
    (map.getSource(ZONE_SOURCE) as import("maplibre-gl").GeoJSONSource).setData(
      geojson as GeoJSON.FeatureCollection,
    );
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
}

function syncTyphoonTracks(map: MlMap, incidents: Incident[]) {
  const TRACK_SOURCE = "typhoon-tracks";
  const TRACK_LINE_OBSERVED = "typhoon-track-observed";
  const TRACK_LINE_FORECAST = "typhoon-track-forecast";

  const trackFeatures: GeoJSON.Feature[] = [];

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
  }

  const trackGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: trackFeatures,
  };

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
}

function addAllSourcesAndLayers(map: MlMap, incidents: Incident[]) {
  syncHazardZones(map, incidents);
  syncTyphoonTracks(map, incidents);
}

/** Accessible name: hazard type, then the title ("Earthquake: M5.1 · …"). */
function markerLabel(incident: Incident, locale: "en" | "fil"): string {
  return `${eventLabel(incident.event_type, locale)}: ${incident.title}`;
}

function createMarkerElement(incident: Incident, label: string): HTMLDivElement {
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
  el.dataset.incidentId = incident.id;
  // Attribute, not markup: feed text is never parsed as HTML.
  el.setAttribute("aria-label", label);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.cursor = "pointer";
  // No inline position: MapLibre's .maplibregl-marker class makes the
  // element absolute. An inline "relative" put markers in normal flow, so
  // each one was drawn lower by the heights of the markers before it.

  el.innerHTML = `
    <div style="position:absolute;inset:-4px;border-radius:50%;border:1.5px solid ${ringColor};opacity:0.4;animation:marker-ping 2.5s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>
    <div class="marker-inner" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${color};box-shadow:0 0 6px ${color}44;display:flex;align-items:center;justify-content:center;transition:transform 0.2s ease,filter 0.2s ease;">
      <span style="font-size:11px;font-weight:700;color:#000;text-shadow:0 1px 2px rgba(0,0,0,0.5);">${getMarkerLabel(incident)}</span>
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

/** Create an element with inline style and plain-text content. */
function textEl(tag: string, style: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.style.cssText = style;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Hover popup for an incident. Upstream strings are only ever set as text. */
function buildPopupContent(incident: Incident, locale: "en" | "fil"): HTMLElement {
  const root = textEl("div", "font-family:system-ui,sans-serif;min-width:180px;");

  const header = textEl("div", "display:flex;align-items:center;gap:4px;margin-bottom:4px;");
  header.append(
    textEl(
      "span",
      "font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-dim);",
      eventLabel(incident.event_type, locale),
    ),
    textEl(
      "span",
      `font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${SEVERITY_RING[incident.severity] ?? "inherit"};margin-left:auto;`,
      severityText(incident.severity, locale),
    ),
  );
  root.append(header);

  root.append(
    textEl(
      "div",
      "font-size:13px;font-weight:600;color:var(--text-primary);line-height:1.3;",
      String(incident.title),
    ),
  );

  const meta = buildPopupMeta(incident);
  if (meta) {
    root.append(
      textEl("div", "font-size:11px;color:var(--accent-orange);margin-top:2px;font-weight:500;", meta),
    );
  }

  root.append(
    textEl(
      "div",
      "font-size:11px;color:var(--text-muted);margin-top:3px;",
      `${displayRegion(incident.region, locale)} · ${eventTimeFull(incident, locale)}`,
    ),
  );
  // The source agency's own location text (e.g. "045 km S 31° W of …"):
  // context for offshore pins. Skipped when the title already contains it.
  const place = incident.metadata.source_place;
  if (typeof place === "string" && place.trim() && !incident.title.includes(place.trim())) {
    root.append(textEl("div", "font-size:11px;color:var(--text-dim);margin-top:2px;", place.trim()));
  }

  const copy = t(locale).common;
  if (showTsunamiPointer(incident)) {
    root.append(textEl("div", "font-size:11px;line-height:1.4;color:var(--text-primary);margin-top:6px;", copy.tsunami.pointer));
    root.append(popupLink(PHIVOLCS_TSUNAMI_URL, copy.tsunami.link));
  }
  // Event coordinates only (never the visitor's location).
  const lat = incident.latitude.toFixed(4);
  const lng = incident.longitude.toFixed(4);
  root.append(
    popupLink(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, copy.mapPopup.openInMaps),
  );
  return root;
}

/** External link in a popup: new tab, 44px-tall tap target, text only. */
function popupLink(href: string, label: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "popup-link";
  a.textContent = label;
  return a;
}

/** Short metric line for the popup (plain text). */
function buildPopupMeta(incident: Incident): string {
  const m = incident.metadata;
  const parts: string[] = [];

  if (incident.event_type === "earthquake") {
    if (m.magnitude != null) parts.push(`M${Number(m.magnitude).toFixed(1)}`);
    if (m.depth_km != null)
      parts.push(`${Number(m.depth_km).toFixed(0)} km deep`);
  } else if (incident.event_type === "typhoon") {
    if (m.signal_number != null) parts.push(`Signal #${m.signal_number}`);
    if (m.wind_speed_kph != null) parts.push(`${m.wind_speed_kph} kph`);
  } else if (incident.event_type === "volcano") {
    if (m.alert_level != null) parts.push(`Alert Level ${String(m.alert_level)}`);
    if (m.pdz_radius_km != null) parts.push(`${String(m.pdz_radius_km)} km danger zone`);
  }

  return parts.join(" · ");
}

/**
 * Permanent Danger Zone radius from the PHIVOLCS bulletin (e.g. 4 km, 6 km).
 * No circle when the bulletin gives none (Taal's PDZ is the whole volcano
 * island) — a guessed radius could look official.
 */
function volcanoExclusionRadiusKm(incident: Incident): number {
  const km = Number(incident.metadata?.pdz_radius_km);
  return Number.isFinite(km) && km > 0 && km <= 30 ? km : 0;
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
  // No inline position: MapLibre's .maplibregl-marker class makes the
  // element absolute. An inline "relative" put markers in normal flow, so
  // each one was drawn lower by the heights of the markers before it.
  el.title = `Community: ${report.title}`;

  el.innerHTML = `
    <div style="width:${size}px;height:${size}px;border-radius:4px;background:rgba(255,255,255,0.12);border:1.5px dashed rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;">
      <span style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.02em;">${label}</span>
    </div>`;

  return el;
}
