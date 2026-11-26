"use client";

import { useState } from "react";
import { Bookmark, LocateFixed, MapPin } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { REGION_NAMES, locateRegion } from "@/lib/geo/ph-regions";
import { areaLabel, resolveArea, type SelectedArea } from "@/lib/area";
import type { Incident, SavedPlace } from "@/types/incident";
import { SavedPlacesPanel } from "./saved-places-panel";

type LocateState = "idle" | "locating" | "denied" | "unavailable" | "offshore";

/**
 * Place-first entry point: choose the area to focus on, then see a short,
 * honest summary for it. Device location is requested only when the visitor
 * presses the button, is reduced to a region, and is never stored.
 */
export function AreaBar({
  area,
  onChange,
  places,
  count,
  warningCount,
  locale,
  recentIncidents,
  placesOpen: placesOpenProp,
  onPlacesOpen,
}: {
  area: SelectedArea;
  onChange: (area: SelectedArea) => void;
  places: SavedPlace[];
  count: number;
  warningCount: number;
  locale: Locale;
  /** Recent events nationwide, for the saved-places panel. */
  recentIncidents: Incident[];
  /** The saved-places panel, when the page controls it (the map's "My places"). */
  placesOpen?: boolean;
  onPlacesOpen?: (open: boolean) => void;
}) {
  const copy = t(locale).area;
  const placesCopy = t(locale).places;
  const [locate, setLocate] = useState<LocateState>("idle");
  const [ownPlacesOpen, setOwnPlacesOpen] = useState(false);
  const placesOpen = placesOpenProp ?? ownPlacesOpen;
  const setPlacesOpen = onPlacesOpen ?? setOwnPlacesOpen;
  const effective = resolveArea(area, places);
  // In the summary: "3 recent events near your saved places".
  const label = areaLabel(effective, places, copy.all, copy.yourSavedPlaces);
  const value =
    effective.kind === "region"
      ? `region:${effective.region}`
      : effective.kind === "place"
        ? `place:${effective.placeId}`
        : effective.kind === "places"
          ? "places"
          : "all";

  function select(v: string) {
    setLocate("idle");
    if (v.startsWith("region:")) onChange({ kind: "region", region: v.slice(7) });
    else if (v.startsWith("place:")) onChange({ kind: "place", placeId: v.slice(6) });
    else if (v === "places") onChange({ kind: "places" });
    else onChange({ kind: "all" });
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocate("unavailable");
      return;
    }
    setLocate("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = locateRegion(pos.coords.latitude, pos.coords.longitude);
        const region = loc.offshore ? loc.nearName : loc.name;
        if (!region) {
          setLocate("offshore");
          return;
        }
        setLocate("idle");
        // Kept out of shareable links: it says roughly where the visitor is.
        onChange({ kind: "region", region, fromLocation: true });
      },
      (err) => setLocate(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 15_000 },
    );
  }

  const locateMessage =
    locate === "locating"
      ? copy.locating
      : locate === "denied"
        ? copy.locationDenied
        : locate === "unavailable"
          ? copy.locationUnavailable
          : locate === "offshore"
            ? copy.locationOffshore
            : null;

  const isPlace = effective.kind === "place" || effective.kind === "places";
  const summary =
    count === 0
      ? (isPlace ? copy.summaryPlaceNone : copy.summaryNone).replace("{area}", label)
      : (count === 1
          ? isPlace ? copy.summaryPlaceOne : copy.summaryOne
          : isPlace ? copy.summaryPlaceMany : copy.summaryMany)
          .replace("{n}", String(count))
          .replace("{area}", label) +
        (warningCount > 0 ? ` · ${copy.summaryWarning.replace("{n}", String(warningCount))}` : "");

  return (
    <section
      aria-label={copy.label}
      className="flex flex-col gap-2 px-4 pt-3 pb-1.5 md:flex-row md:items-center md:gap-4 md:px-5"
    >
      {/* Phones: one row (picker + two icon buttons); labels stay for screen readers. */}
      <div className="flex min-w-0 items-center gap-2 sm:flex-wrap">
        <label className="sr-only flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-dim)] sm:not-sr-only" htmlFor="area-select">
          <MapPin className="h-3.5 w-3.5" />
          {copy.label}
        </label>
        <select
          id="area-select"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-overlay/12 bg-[var(--bg-panel)] px-2.5 py-1.5 text-[13px] text-[var(--text-primary)] sm:min-h-0 sm:max-w-[16rem] sm:flex-none"
          onChange={(e) => select(e.target.value)}
          value={value}
        >
          <option value="all">{copy.all}</option>
          {places.length > 0 && (
            <optgroup label={copy.savedPlaces}>
              <option value="places">{copy.allSavedPlaces}</option>
              {places.map((p) => (
                <option key={p.id} value={`place:${p.id}`}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={copy.regions}>
            {[...REGION_NAMES].sort().map((r) => (
              <option key={r} value={`region:${r}`}>
                {r}
              </option>
            ))}
          </optgroup>
        </select>
        <button
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-overlay/12 px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] transition hover:bg-overlay/6 disabled:opacity-60 sm:min-h-0 sm:min-w-0"
          disabled={locate === "locating"}
          onClick={useMyLocation}
          title={copy.locationNote}
          type="button"
        >
          <LocateFixed aria-hidden className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="sr-only sm:not-sr-only">{copy.useLocation}</span>
        </button>
        <button
          className="relative flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-overlay/12 px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] transition hover:bg-overlay/6 sm:min-h-0 sm:min-w-0"
          aria-haspopup="dialog"
          onClick={() => setPlacesOpen(true)}
          type="button"
        >
          <Bookmark aria-hidden className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="sr-only sm:not-sr-only">
            {places.length > 0
              ? placesCopy.openWithCount.replace("{n}", String(places.length))
              : placesCopy.title}
          </span>
          {places.length > 0 && (
            <span aria-hidden className="absolute -right-1.5 -top-1.5 rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold leading-4 text-black sm:hidden">
              {places.length}
            </span>
          )}
        </button>
        <SavedPlacesPanel
          locale={locale}
          onClose={() => setPlacesOpen(false)}
          onShowPlace={(placeId) => {
            setLocate("idle");
            onChange({ kind: "place", placeId });
          }}
          open={placesOpen}
          recentIncidents={recentIncidents}
        />
      </div>
      <div className="min-w-0 text-[12px] leading-5 text-[var(--text-muted)]" role="status">
        {locateMessage ?? (
          <>
            <span className="text-[var(--text-primary)]">{summary}</span>
            {count === 0 && effective.kind !== "all" && (
              <span className="block text-[11px] text-[var(--text-dim)]">{copy.summaryCaveat}</span>
            )}
            {isPlace && (
              <span className="block text-[11px] text-[var(--text-dim)]">{copy.placeCaveat}</span>
            )}
          </>
        )}
      </div>
    </section>
  );
}
