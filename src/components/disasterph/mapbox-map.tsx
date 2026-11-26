"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
import { House, MapPinned, Mountain, Navigation, X } from "lucide-react";
import type { SavedPlace } from "@/types/incident";
import { boundsAround, syncUserLayers, type DeviceLocation } from "@/lib/map-user-layers";
import { TERRAIN_CONFIG, TERRAIN_SOURCE, disableTerrain, enableTerrain } from "@/lib/terrain";
import { focusZoom, isInView, mapPadding, popoverFitsBesideZone, zonePadding } from "@/lib/map-camera";
import { displayRegion } from "@/lib/geo/ph-regions";
import { eventLabel, severityText, t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { MapLegend } from "@/components/disasterph/map-legend";
import { applyBaseLabels } from "@/lib/map-labels";
import { pdzRadiusKm, zoneRing } from "@/lib/danger-zone";
import {
  QUAKE_SPLIT_ZOOM,
  ensureEventLayers,
  eventAt,
  firstLabelLayer,
  quakeShownAlone,
  setEventData,
  sourceFor,
} from "@/lib/map-event-layers";

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
  /** Changes each time an event is chosen from the list: bring it into view again. */
  focusRequest?: number;
  /** Height in pixels of controls over the top of the map (time chips). */
  topInset?: number;
  /** Wide screens: the chosen event's card, shown in a popover anchored to its marker. */
  popover?: ReactNode;
  /** Small preview when hovering a marker (wide screens with a pointer). */
  hoverPreviews?: boolean;
  /** The visitor's saved places (this browser only). */
  savedPlaces?: SavedPlace[];
  /** Draw the saved places as pins ("My places" or one saved place chosen). */
  showPlacePins?: boolean;
  /** "My places": list events near the saved places. */
  onMyPlaces?: () => void;
  /** No saved places yet: open the saved-places panel. */
  onAddPlace?: () => void;
}

const NO_PLACES: SavedPlace[] = [];

/** Top-left map buttons: 44 px on touch screens, compact with a label on wider ones. */
const MAP_BUTTON =
  "flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-overlay/15 bg-[var(--bg-panel)]/90 px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] shadow transition hover:bg-[var(--bg-panel)] disabled:opacity-60 sm:min-h-0 sm:min-w-0 aria-pressed:border-cyan-500/50";

/** Flat, north-up view of the whole country inside the unobstructed area. */
function fitNational(map: MlMap, leftInset: number, duration: number, bottomInset = 0, topInset = 0) {
  const { clientWidth: w, clientHeight: h } = map.getContainer();
  map.fitBounds(PH_BOUNDS, {
    padding: mapPadding(w, h, leftInset, bottomInset, topInset),
    pitch: DEFAULT_CAMERA.pitch,
    bearing: DEFAULT_CAMERA.bearing,
    duration,
    essential: false,
  });
}

/** Fit bounds into the part of the map that panels and buttons leave clear. */
function fitClear(
  map: MlMap,
  bounds: [[number, number], [number, number]],
  maxZoom: number,
  leftInset: number,
  bottomInset: number,
  topInset: number,
) {
  const { clientWidth: w, clientHeight: h } = map.getContainer();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  map.fitBounds(bounds, {
    padding: zonePadding(w, h, leftInset, bottomInset, topInset),
    maxZoom,
    duration: reduce ? 0 : 700,
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
  focusRequest = 0,
  topInset = 0,
  popover = null,
  hoverPreviews = true,
  savedPlaces = NO_PLACES,
  showPlacePins = false,
  onMyPlaces,
  onAddPlace,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const mlRef = useRef<MapLibreModule | null>(null);
  const communityMarkersRef = useRef<Map<string, MlMarker>>(new Map());
  const popupRef = useRef<MlPopup | null>(null);
  // Read by long-lived map handlers; updated after commit.
  const leftInsetRef = useRef(leftInset);
  useEffect(() => {
    leftInsetRef.current = leftInset;
  }, [leftInset]);
  const bottomInsetRef = useRef(bottomInset);
  const selectedIdRef = useRef(selectedIncidentId);
  useEffect(() => {
    selectedIdRef.current = selectedIncidentId;
  }, [selectedIncidentId]);
  const topInsetRef = useRef(topInset);
  useEffect(() => {
    topInsetRef.current = topInset;
  }, [topInset]);
  // Set once the resident pans/zooms/selects; until then layout changes
  // re-fit the national view instead of leaving it off-centre.
  const userMovedRef = useRef(false);
  // A fit just asked for ("My places", "Show my location"): the list panel
  // often changes height right after (the list follows the new area), so the
  // fit is re-applied with the new height for a short while.
  const recentFitRef = useRef<{ bounds: [[number, number], [number, number]]; maxZoom: number; at: number } | null>(null);
  // Re-fit when the phone list panel appears or goes (until the resident moves the map).
  useEffect(() => {
    bottomInsetRef.current = bottomInset;
    const map = mapRef.current;
    if (!map) return;
    const recent = recentFitRef.current;
    if (recent && Date.now() - recent.at < 2000) {
      fitClear(map, recent.bounds, recent.maxZoom, leftInsetRef.current, bottomInset, topInsetRef.current);
      return;
    }
    if (!userMovedRef.current && !selectedIdRef.current) fitNational(map, leftInsetRef.current, 0, bottomInset, topInsetRef.current);
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
  // Cluster label word ("max" / "pinakamalakas") for layers re-added after a style swap.
  const clusterWord = t(locale).common.legend.clusterMax;
  const clusterWordRef = useRef(clusterWord);
  useEffect(() => {
    clusterWordRef.current = clusterWord;
  }, [clusterWord]);
  // "{n} km Permanent Danger Zone (PHIVOLCS)" for the chosen volcano's circle.
  const zoneLabel = t(locale).common.card.zoneLabel;
  const zoneLabelRef = useRef(zoneLabel);
  useEffect(() => {
    zoneLabelRef.current = zoneLabel;
  }, [zoneLabel]);
  // "Show my location": kept in memory for this page only (never stored or sent).
  const [located, setLocated] = useState<DeviceLocation | null>(null);
  const [locateState, setLocateState] = useState<"idle" | "locating" | "denied" | "unavailable">("idle");
  // "My places" pressed with nothing saved: show how to add one.
  const [placesNote, setPlacesNote] = useState(false);
  const shownPlaces = showPlacePins ? savedPlaces : NO_PLACES;
  const userLayersRef = useRef({ places: shownPlaces, location: located });
  useEffect(() => {
    userLayersRef.current = { places: shownPlaces, location: located };
  }, [shownPlaces, located]);
  // Latest callbacks for the map's own event handlers (registered once).
  const onSelectRef = useRef(onSelectIncident);
  const onHoverRef = useRef(onHoverIncident);
  useEffect(() => {
    onSelectRef.current = onSelectIncident;
    onHoverRef.current = onHoverIncident;
  }, [onSelectIncident, onHoverIncident]);

  // ── Initialize map (runtime-only import) ──
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let themeHandler: ((e: Event) => void) | null = null;
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
        fitNational(map, leftInsetRef.current, 0, bottomInsetRef.current, topInsetRef.current);

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
      // Read-only handle for automated browser checks (markers are drawn on a
      // canvas, so tests query the map's rendered features).
      (containerRef.current as HTMLDivElement & { __map?: MlMap }).__map = map;

      themeHandler = (e: Event) => {
        const theme = (e as CustomEvent).detail.theme;
        map.setStyle(theme === "day" ? MAP_STYLE_DAY : MAP_STYLE_NIGHT);
        map.once("styledata", () => {
          applySky(map);
          applyBaseLabels(map);
          addAllSourcesAndLayers(map, incidentsRef.current, clusterWordRef.current, zoneLabelRef.current);
          syncUserLayers(map, userLayersRef.current.places, userLayersRef.current.location);
          // Style swaps drop sources; restore terrain if it was on.
          if (terrainRef.current && TERRAIN_CONFIG) enableTerrain(map, TERRAIN_CONFIG, false);
        });
      };
      window.addEventListener("themechange", themeHandler);
    }

    init();

    return () => {
      cancelled = true;
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
      // A fit just asked for ("My places", "Show my location") often changes
      // the page above the map (the area summary): fit again at the new size.
      const recent = recentFitRef.current;
      if (recent && Date.now() - recent.at < 2000) {
        fitClear(map, recent.bounds, recent.maxZoom, leftInsetRef.current, bottomInsetRef.current, topInsetRef.current);
        return;
      }
      if (!userMovedRef.current) fitNational(map, leftInsetRef.current, 0, bottomInsetRef.current, topInsetRef.current);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapReady]);

  // ── Event markers as map layers (clustered earthquakes; see map-event-layers.ts) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    ensureEventLayers(map, incidents, clusterWord);
    setEventData(map, incidents);
  }, [incidents, mapReady, clusterWord]);

  // Taps and hover on markers and clusters (registered once per map).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    let hovered: string | null = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onClick = async (e: { point: { x: number; y: number } }) => {
      const hit = eventAt(map, e.point);
      if (!hit) return;
      const props = hit.properties ?? {};
      if (props.cluster) {
        // Zoom in until the cluster splits.
        const source = map.getSource("events-quakes") as import("maplibre-gl").GeoJSONSource;
        try {
          const zoom = await source.getClusterExpansionZoom(Number(props.cluster_id));
          const [lng, lat] = (hit.geometry as GeoJSON.Point).coordinates;
          userMovedRef.current = true;
          map.easeTo({ center: [lng, lat], zoom, duration: reduceMotion ? 0 : 500 });
        } catch {
          /* cluster gone after a data refresh */
        }
        return;
      }
      const incident = incidentsRef.current.find((i) => i.id === props.id);
      if (incident) onSelectRef.current(incident);
    };
    const onMove = (e: { point: { x: number; y: number } }) => {
      const hit = eventAt(map, e.point);
      map.getCanvas().style.cursor = hit ? "pointer" : "";
      const id = hit && !hit.properties?.cluster ? String(hit.properties?.id) : null;
      if (id !== hovered) {
        hovered = id;
        onHoverRef.current(id);
      }
    };
    const canvas = map.getCanvas();
    const onLeave = () => {
      canvas.style.cursor = "";
      if (hovered) {
        hovered = null;
        onHoverRef.current(null);
      }
    };
    map.on("click", onClick);
    map.on("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [mapReady]);

  // ── Volcano Permanent Danger Zones (radius from the PHIVOLCS bulletin) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    syncHazardZones(map, incidents, zoneLabel);
  }, [incidents, mapReady, zoneLabel]);

  // ── Typhoon track lines + wind radius circles ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    syncTyphoonTracks(map, incidents);
  }, [incidents, mapReady]);

  // ── Selected and hovered markers: feature-state (white, thicker outline) ──
  const shownStateRef = useRef<{ selected: string | null; hover: string | null }>({ selected: null, hover: null });
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const set = (id: string | null, key: "selected" | "hover", value: boolean) => {
      if (!id) return;
      const source = sourceFor(incidentsRef.current.find((i) => i.id === id));
      if (source && map.getSource(source)) map.setFeatureState({ source, id }, { [key]: value });
    };
    const shown = shownStateRef.current;
    set(shown.selected, "selected", false);
    set(shown.hover, "hover", false);
    const selected = selectedIncidentId || null;
    set(selected, "selected", true);
    set(hoveredIncidentId, "hover", true);
    shownStateRef.current = { selected, hover: hoveredIncidentId };
    // The chosen volcano's danger zone: stronger and labelled.
    if (map.getSource("hazard-zones")) {
      if (shown.selected) map.setFeatureState({ source: "hazard-zones", id: shown.selected }, { selected: false });
      if (selected) map.setFeatureState({ source: "hazard-zones", id: selected }, { selected: true });
    }
    if (map.getLayer("hazard-zone-label")) map.setFilter("hazard-zone-label", ["==", ["get", "id"], selected ?? ""]);
    // incidents: a refresh re-creates features, so state is re-applied.
  }, [selectedIncidentId, hoveredIncidentId, incidents, mapReady]);

  // ── Hover preview: a small popup for a hovered marker other than the chosen one ──
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !mapReady) return;

    const popupId = hoverPreviews && hoveredIncidentId !== selectedIncidentId ? hoveredIncidentId : null;
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
  }, [hoveredIncidentId, selectedIncidentId, incidents, mapReady, locale, hoverPreviews]);

  // ── Chosen event (wide screens): its card in a popover anchored to the marker ──
  const popoverRef = useRef<MlPopup | null>(null);
  const [popoverNode, setPopoverNode] = useState<HTMLDivElement | null>(null);
  const chosen = selectedIncidentId ? incidents.find((i) => i.id === selectedIncidentId) : undefined;
  const chosenLng = chosen?.longitude;
  const chosenLat = chosen?.latitude;
  const chosenZoneKm = chosen ? pdzRadiusKm(chosen) : 0;
  const hasPopover = Boolean(popover);
  // A volcano with a danger zone: the popover sits beside the circle (to its
  // right) instead of over it, when the map is wide enough.
  const popoverSideRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !mapReady || !hasPopover || chosenLng === undefined || chosenLat === undefined) {
      popoverRef.current?.remove();
      popoverRef.current = null;
      popoverSideRef.current = false;
      setPopoverNode(null);
      return;
    }
    const side = chosenZoneKm > 0 && popoverFitsBesideZone(map.getContainer().clientWidth, leftInsetRef.current);
    if (popoverRef.current && popoverSideRef.current !== side) {
      popoverRef.current.remove();
      popoverRef.current = null;
    }
    popoverSideRef.current = side;
    if (!popoverRef.current) {
      const node = document.createElement("div");
      node.className = "bantay-popover-body";
      popoverRef.current = new ml.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 20,
        anchor: side ? "left" : undefined,
        className: "bantay-popover",
        maxWidth: "340px",
        // The card moves focus to its own heading.
        focusAfterOpen: false,
      })
        .setDOMContent(node)
        .setLngLat([chosenLng, chosenLat])
        .addTo(map);
      setPopoverNode(node);
    } else {
      popoverRef.current.setLngLat([chosenLng, chosenLat]);
    }
  }, [mapReady, hasPopover, chosenLng, chosenLat, chosenZoneKm, selectedIncidentId]);
  // Keep the popover inside the map: cap its height to the larger free side
  // of the marker, then let MapLibre re-place it (it picks the side that
  // fits). Re-run when the card grows (details load) or the map moves.
  useEffect(() => {
    const map = mapRef.current;
    const popup = popoverRef.current;
    if (!map || !popup || !popoverNode || chosenLng === undefined || chosenLat === undefined) return;
    const side = popoverSideRef.current;
    // Beside a zone: keep the popover just outside the circle at any zoom.
    const besideZone = () => {
      if (!side) return;
      const y = map.project([chosenLng, chosenLat]).y;
      const edge = map.project([chosenLng, chosenLat + chosenZoneKm / 111]).y;
      popup.setOffset(Math.round(Math.abs(y - edge)) + 14);
    };
    const place = () => {
      const h = map.getContainer().clientHeight;
      const y = map.project([chosenLng, chosenLat]).y;
      const above = y - (topInsetRef.current + 12);
      const below = h - y - 12;
      // Side anchor: the card is centred on the marker, so both halves count.
      const room = side ? 2 * Math.min(above, below) - 12 : Math.max(above, below) - 36;
      const body = popup.getElement()?.querySelector<HTMLElement>(".bantay-popover-body");
      if (body) body.style.maxHeight = `${Math.max(160, Math.round(room))}px`;
      besideZone();
      popup.setLngLat([chosenLng, chosenLat]);
    };
    place();
    const observer = new ResizeObserver(place);
    const body = popup.getElement()?.querySelector(".bantay-popover-body");
    if (body) observer.observe(body);
    map.on("moveend", place);
    map.on("zoom", besideZone);
    return () => {
      observer.disconnect();
      map.off("moveend", place);
      map.off("zoom", besideZone);
    };
  }, [popoverNode, chosenLng, chosenLat, chosenZoneKm]);
  useEffect(
    () => () => {
      popoverRef.current?.remove();
      popoverRef.current = null;
    },
    [],
  );

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
    const padding = mapPadding(w, h, leftInsetRef.current, bottomInsetRef.current, topInsetRef.current);
    // An earthquake inside a cluster isn't visible on its own: zoom in far
    // enough for the cluster to split.
    const zoneKm = pdzRadiusKm(incident);
    if (zoneKm > 0) {
      // A 6 km circle is a few pixels at the national view: show the whole
      // zone in the clear part of the map (phones: as large as the strip
      // above the sheet allows) and, on wide screens, the popover beside it.
      const zonePad = zonePadding(w, h, leftInsetRef.current, bottomInsetRef.current, topInsetRef.current, popoverSideRef.current);
      const dLat = (zoneKm * (w < 640 ? 1.04 : 1.15)) / 111;
      const dLng = dLat / Math.cos((incident.latitude * Math.PI) / 180);
      userMovedRef.current = true;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.fitBounds(
        [
          [incident.longitude - dLng, incident.latitude - dLat],
          [incident.longitude + dLng, incident.latitude + dLat],
        ],
        { padding: zonePad, maxZoom: 12.5, duration: reduce ? 0 : 800, essential: false },
      );
      return;
    }
    const inCluster = incident.event_type === "earthquake" && !quakeShownAlone(map, incident.id);
    if (!inCluster && isInView(map.project(lngLat), w, h, padding)) return;

    userMovedRef.current = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.easeTo({
      center: lngLat,
      zoom: inCluster ? Math.max(focusZoom(map.getZoom()), QUAKE_SPLIT_ZOOM) : focusZoom(map.getZoom()),
      // Centre the pin in the unobstructed area. (offset, not padding:
      // easeTo's padding would persist on the map after the move.)
      offset: [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2],
      duration: reduceMotion ? 0 : 700,
      essential: false,
    });
    // focusRequest: choosing the same event again from the list re-runs this.
    // bottomInset: the phone card changes how much of the map is clear.
  }, [selectedIncidentId, mapReady, focusRequest, bottomInset]);

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
    fitNational(map, leftInsetRef.current, 600, bottomInsetRef.current, topInsetRef.current);
  };

  // Saved-place pins and the location dot (drawn in this browser only).
  useEffect(() => {
    const map = mapRef.current;
    if (map && mapReady) syncUserLayers(map, shownPlaces, located);
  }, [mapReady, shownPlaces, located]);

  /** Fit points into the clear part of the map (not past `maxZoom`). */
  const fitPoints = (points: { lat: number; lon: number }[], minKm: number, maxZoom: number) => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    userMovedRef.current = true;
    const bounds = boundsAround(points, minKm);
    recentFitRef.current = { bounds, maxZoom, at: Date.now() };
    fitClear(map, bounds, maxZoom, leftInsetRef.current, bottomInsetRef.current, topInsetRef.current);
  };

  // "Show my location": asked only when pressed; the position stays in this
  // page's memory and is never stored or sent (no request carries it).
  const locateMe = () => {
    setPlacesNote(false);
    if (!("geolocation" in navigator)) {
      setLocateState("unavailable");
      return;
    }
    setLocateState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracyM: pos.coords.accuracy };
        setLocated(loc);
        setLocateState("idle");
        fitPoints([loc], Math.min(50, Math.max(1, (loc.accuracyM / 1000) * 1.3)), 13);
      },
      (err) => setLocateState(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
  };

  // "My places": the list follows the saved places; the map shows them all.
  const showMyPlaces = () => {
    setLocateState((s) => (s === "locating" ? s : "idle"));
    if (savedPlaces.length === 0) {
      setPlacesNote(true);
      return;
    }
    setPlacesNote(false);
    onMyPlaces?.();
    fitPoints(savedPlaces.map((p) => ({ lat: p.latitude, lon: p.longitude })), 15, 10);
  };
  const locateMessage =
    locateState === "locating"
      ? mapCopy.locating
      : locateState === "denied"
        ? mapCopy.locateDenied
        : locateState === "unavailable"
          ? mapCopy.locateUnavailable
          : null;

  return (
    <div
      className="map-root relative h-full w-full"
      // Read by the legend, the top-left buttons and MapLibre's bottom controls.
      style={{ "--map-left-inset": `${leftInset}px`, "--map-bottom-inset": `${bottomInset}px` } as CSSProperties}
    >
      <div ref={containerRef} className="h-full w-full" data-map-container />
      {popoverNode && popover ? createPortal(popover, popoverNode) : null}
      <p className="sr-only">{mapCopy.keyboardNote}</p>
      <MapLegend locale={locale} />
      {mapReady && !mapFailed && (
        <div
          // The inset panel (focus-mode card) is only shown at lg and up.
          className="absolute left-3 top-[calc(var(--map-toolbar-h,0px)+0.75rem)] z-10 flex flex-col items-start gap-1.5 lg:left-[calc(var(--map-left-inset)+0.75rem)]"
        >
          {/* Phones: one row of icon buttons (labels for screen readers), so
              the map keeps its height; wider screens: a labelled column. */}
          <div className="flex flex-row items-start gap-1.5 sm:flex-col">
            <button
              className={MAP_BUTTON}
              onClick={resetView}
              title={mapCopy.resetViewTitle}
              aria-label={mapCopy.resetView}
              type="button"
            >
              <House aria-hidden className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only sm:not-sr-only">{mapCopy.resetView}</span>
            </button>
            <button
              className={MAP_BUTTON}
              onClick={locateMe}
              disabled={locateState === "locating"}
              title={mapCopy.locateTitle}
              aria-label={mapCopy.locate}
              type="button"
            >
              <Navigation aria-hidden className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only sm:not-sr-only">{mapCopy.locate}</span>
            </button>
            <button
              className={MAP_BUTTON}
              onClick={showMyPlaces}
              aria-pressed={showPlacePins}
              title={mapCopy.myPlacesTitle}
              aria-label={mapCopy.myPlaces}
              type="button"
            >
              <MapPinned aria-hidden className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only sm:not-sr-only">{mapCopy.myPlaces}</span>
            </button>
          </div>
          {(locateMessage || placesNote) && (
            <div
              role="status"
              className="flex max-w-[16rem] items-start gap-2 rounded-lg border border-overlay/15 bg-[var(--bg-panel)] px-3 py-2 text-[12px] leading-snug text-[var(--text-primary)] shadow"
            >
              <div className="min-w-0 flex-1">
                <p>{placesNote ? mapCopy.myPlacesEmpty : locateMessage}</p>
                {placesNote && onAddPlace && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlacesNote(false);
                      onAddPlace();
                    }}
                    className="mt-1.5 min-h-11 rounded-md border border-cyan-500/40 px-2.5 text-[12px] font-semibold text-[var(--text-primary)] sm:min-h-8"
                  >
                    {mapCopy.addPlace}
                  </button>
                )}
              </div>
              {locateState !== "locating" && (
                <button
                  type="button"
                  aria-label={mapCopy.dismiss}
                  onClick={() => {
                    setPlacesNote(false);
                    setLocateState("idle");
                  }}
                  className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-[var(--text-dim)] sm:h-8 sm:w-8"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
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

const ZONE_SOURCE = "hazard-zones";
const ZONE_LABEL_SOURCE = "hazard-zone-labels";
const ZONE_LABEL_LAYER = "hazard-zone-label";

/**
 * Volcano Permanent Danger Zones, with the radius PHIVOLCS gives (no radius,
 * no circle). Faint for every volcano; the chosen volcano's zone gets a
 * stronger fill, a solid outline and a label (feature-state + filter).
 * (Earthquakes have no circle: a felt area guessed from magnitude would look
 * official. Where shaking was felt comes from the PHIVOLCS bulletin.)
 */
function syncHazardZones(map: MlMap, incidents: Incident[], labelText: string) {
  const zones = incidents
    .filter((i) => i.event_type === "volcano")
    .map((i) => ({ i, km: pdzRadiusKm(i) }))
    .filter((z) => z.km > 0);
  const polygons: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: zones.map(({ i, km }) => ({
      type: "Feature",
      properties: { id: i.id, color: HAZARD_COLORS.volcano },
      geometry: { type: "Polygon", coordinates: [zoneRing(i.latitude, i.longitude, km)] },
    })),
  };
  // Label point at the top of the circle (1° latitude ≈ 111 km).
  const labels: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: zones.map(({ i, km }) => ({
      type: "Feature",
      properties: { id: i.id, label: labelText.replace("{n}", String(km)) },
      geometry: { type: "Point", coordinates: [i.longitude, i.latitude + km / 111] },
    })),
  };

  const existing = map.getSource(ZONE_SOURCE) as import("maplibre-gl").GeoJSONSource | undefined;
  if (existing) {
    existing.setData(polygons);
    (map.getSource(ZONE_LABEL_SOURCE) as import("maplibre-gl").GeoJSONSource | undefined)?.setData(labels);
    return;
  }
  const chosen: import("maplibre-gl").ExpressionSpecification = ["boolean", ["feature-state", "selected"], false];
  map.addSource(ZONE_SOURCE, { type: "geojson", data: polygons, promoteId: "id" });
  map.addLayer({
    id: "hazard-zones-fill",
    type: "fill",
    source: ZONE_SOURCE,
    paint: { "fill-color": ["get", "color"], "fill-opacity": ["case", chosen, 0.22, 0.08] },
  }, belowEvents(map));
  map.addLayer({
    id: "hazard-zones-stroke",
    type: "line",
    source: ZONE_SOURCE,
    paint: {
      "line-color": ["get", "color"],
      "line-opacity": ["case", chosen, 0.95, 0.35],
      "line-width": ["case", chosen, 3, 1.5],
    },
  }, belowEvents(map));
  map.addSource(ZONE_LABEL_SOURCE, { type: "geojson", data: labels });
  map.addLayer({
    id: ZONE_LABEL_LAYER,
    type: "symbol",
    source: ZONE_LABEL_SOURCE,
    filter: ["==", ["get", "id"], ""],
    layout: {
      "text-field": ["get", "label"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      // Just inside the top of the circle, on one line, so it never sits
      // under the controls above the zone.
      "text-anchor": "top",
      "text-offset": [0, 0.4],
      "text-max-width": 40,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    // Rebuilt on theme change (addAllSourcesAndLayers runs after setStyle).
    paint:
      document.documentElement.dataset.theme === "day"
        ? { "text-color": "#7c2d12", "text-halo-color": "#ffffff", "text-halo-width": 2 }
        : { "text-color": "#fed7aa", "text-halo-color": "#1c1917", "text-halo-width": 2 },
  });
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
    }, belowEvents(map));
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
    }, belowEvents(map));
  }
}

function addAllSourcesAndLayers(map: MlMap, incidents: Incident[], clusterWord: string, zoneLabel: string) {
  ensureEventLayers(map, incidents, clusterWord);
  syncHazardZones(map, incidents, zoneLabel);
  syncTyphoonTracks(map, incidents);
}

/** Zones and tracks are drawn under the base map's labels (and the markers above them). */
function belowEvents(map: MlMap): string | undefined {
  return firstLabelLayer(map);
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
