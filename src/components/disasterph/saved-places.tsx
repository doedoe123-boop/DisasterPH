"use client";

import { useState } from "react";
import {
  Home,
  Briefcase,
  Users,
  GraduationCap,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { formatShortTime } from "@/lib/incidents";
import { visualFromRiskLevel } from "@/lib/severity";
import type { PlaceRiskSummary, SavedPlace } from "@/types/incident";
import type { LucideIcon } from "lucide-react";
import { StateCard } from "./state-card";

interface SavedPlacesProps {
  risks: PlaceRiskSummary[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
  onAddPlace: (place: Omit<SavedPlace, "id" | "createdAt">) => void;
  onRemovePlace: (id: string) => void;
}

const tagIcons: Record<SavedPlace["tag"], LucideIcon> = {
  home: Home,
  work: Briefcase,
  family: Users,
  school: GraduationCap,
  other: MapPin,
};

const riskLabel: Record<PlaceRiskSummary["riskLevel"], string> = {
  safe: "Safe",
  monitor: "Monitor",
  "at-risk": "At Risk",
  danger: "Danger",
};

const PRESET_PLACES: Array<{
  label: string;
  tag: SavedPlace["tag"];
  latitude: number;
  longitude: number;
}> = [
  {
    label: "Metro Manila",
    tag: "home",
    latitude: 14.5995,
    longitude: 120.9842,
  },
  { label: "Cebu City", tag: "family", latitude: 10.3157, longitude: 123.8854 },
  { label: "Davao City", tag: "family", latitude: 7.1907, longitude: 125.4553 },
  { label: "Tacloban City", tag: "family", latitude: 11.25, longitude: 125.0 },
  {
    label: "Legazpi City",
    tag: "family",
    latitude: 13.1391,
    longitude: 123.7438,
  },
  {
    label: "Baguio City",
    tag: "family",
    latitude: 16.4023,
    longitude: 120.596,
  },
];

export function SavedPlaces({
  risks,
  selectedPlaceId,
  onSelectPlace,
  onAddPlace,
  onRemovePlace,
}: SavedPlacesProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <section className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)]">
      <div className="flex items-center justify-between border-b border-overlay/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          My Places
        </span>
        <button
          className="flex items-center gap-1 rounded-md border border-overlay/10 bg-overlay/[0.03] px-2 py-0.5 text-[10px] text-[var(--text-muted)] transition hover:bg-overlay/[0.08] hover:text-[var(--text-primary)]"
          onClick={() => setShowAdd(!showAdd)}
          type="button"
        >
          {showAdd ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showAdd ? "Cancel" : "Add"}
        </button>
      </div>

      {showAdd && (
        <div className="border-b border-overlay/8 p-3 bg-black/20">
          <div className="text-left">
            <p className="mb-1.5 px-1 text-[10px] text-[var(--text-dim)] tracking-wide uppercase">
              Quick Add Location:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PLACES.map((preset) => (
                <button
                  key={preset.label}
                  className="flex items-center gap-1.5 rounded border border-overlay/8 bg-overlay/[0.04] px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] transition hover:bg-overlay/[0.08]"
                  onClick={() => {
                    onAddPlace({
                      label: preset.label,
                      tag: preset.tag,
                      latitude: preset.latitude,
                      longitude: preset.longitude,
                    });
                    setShowAdd(false);
                  }}
                  type="button"
                >
                  {(() => {
                    const Icon = tagIcons[preset.tag];
                    return (
                      <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                    );
                  })()}
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {risks.length === 0 ? (
        <div className="p-2">
          <StateCard
            compact
            message="Add places where your family lives to monitor nearby hazards."
            title="No saved places yet"
          />
        </div>
      ) : (
        <div className="space-y-0.5 p-1.5">
          {risks.map((risk) => (
            <div
              key={risk.place.id}
              role="button"
              tabIndex={0}
              className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-l-2 p-2 text-left transition hover:bg-overlay/[0.04] ${
                selectedPlaceId === risk.place.id
                  ? "bg-cyan-400/8 border-l-cyan-400/70"
                  : visualFromRiskLevel(risk.riskLevel).accent
              }`}
              onClick={() => onSelectPlace(risk.place.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPlace(risk.place.id);
                }
              }}
            >
              {(() => {
                const Icon = tagIcons[risk.place.tag];
                return (
                  <Icon className="h-4 w-4 shrink-0 text-[var(--text-dim)]" />
                );
              })()}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                    {risk.place.label}
                  </span>
                  <span
                    className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${visualFromRiskLevel(risk.riskLevel).dot}`}
                  />
                </div>
                <p
                  className={`mt-0.5 truncate text-[11px] leading-tight ${
                    risk.riskLevel === "danger"
                      ? "font-medium text-red-300"
                      : risk.riskLevel === "at-risk"
                        ? "text-orange-300"
                        : risk.riskLevel === "monitor"
                          ? "text-amber-300"
                          : "text-emerald-300/70"
                  }`}
                >
                  {risk.riskLevel === "safe"
                    ? "No active threats nearby"
                    : risk.nearbyIncidents.length > 0
                      ? `${risk.nearbyIncidents[0].title}${risk.nearbyIncidents.length > 1 ? ` +${risk.nearbyIncidents.length - 1} more` : ""}`
                      : riskLabel[risk.riskLevel]}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]">
                  <span>{riskLabel[risk.riskLevel]}</span>
                  {risk.nearestDistanceKm !== null && (
                    <>
                      <span className="text-overlay/10">·</span>
                      <span>{Math.round(risk.nearestDistanceKm)} km away</span>
                    </>
                  )}
                  {risk.nearbyIncidents.length > 0 && (
                    <>
                      <span className="text-overlay/10">·</span>
                      <span>
                        {risk.nearbyIncidents.length} event
                        {risk.nearbyIncidents.length > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>
                {risk.strongestIncident && (
                  <p className="mt-1 truncate text-[10px] text-[var(--text-dim)]">
                    Strongest nearby: {risk.strongestIncident.title}
                  </p>
                )}
                <p className="mt-0.5 truncate text-[10px] text-[var(--text-dim)]">
                  {risk.placeRegion}
                </p>
                {risk.freshestUpdateAt && (
                  <p
                    className="mt-0.5 text-[10px] text-[var(--text-dim)]"
                    suppressHydrationWarning
                  >
                    Updated {formatShortTime(risk.freshestUpdateAt)}
                  </p>
                )}
              </div>
              <button
                className="shrink-0 rounded p-0.5 text-[var(--text-dim)] opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePlace(risk.place.id);
                }}
                title="Remove place"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
