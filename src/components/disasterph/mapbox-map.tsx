"use client";

import { useEffect, useRef, useState } from "react";
import type { Incident } from "@/types/incident";
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
  selectedIncidentId: string;
  hoveredIncidentId: string | null;
  onHoverIncident: (id: string | null) => void;
  onSelectIncident: (incident: Incident) => void;
  /** Width of the sidebar in pixels, used to offset the map center */
  sidebarWidth: number;
}

export default function MapLibreMapComponent({
  incidents,
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
  const popupRef = useRef<MlPopup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Initialize map (runtime-only import) ──
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

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
          padding: { top: 40, bottom: 40, left: 40, right: 40 + sidebarWidth },
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
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
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
          inner.style.filter = "drop-shadow(0 0 8px rgba(34,211,238,0.5))";
      } else if (isHovered) {
        el.style.zIndex = "20";
        if (inner)
          inner.style.filter = "drop-shadow(0 0 6px rgba(255,255,255,0.3))";
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

      const html = `<div style="font-family:system-ui,sans-serif;min-width:180px;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#8899aa;">${eventTypeLabel[incident.event_type]}</span>
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${SEVERITY_RING[incident.severity]};margin-left:auto;">${incident.severity}</span>
        </div>
        <div style="font-size:13px;font-weight:600;color:#fff;line-height:1.3;">${incident.title}</div>
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
  const size = 28;

  const el = document.createElement("div");
  el.className = "mapbox-marker";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.cursor = "pointer";
  el.style.position = "relative";

  el.innerHTML = `
    <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${ringColor};opacity:0.5;animation:marker-ping 2s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>
    <div class="marker-inner" style="width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${color}dd,${color}88);border:2px solid ${color};box-shadow:0 0 12px ${color}66,0 0 24px ${color}33;display:flex;align-items:center;justify-content:center;transition:transform 0.2s ease,filter 0.2s ease;">
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
