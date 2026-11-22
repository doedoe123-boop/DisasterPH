"use client";

import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { REGION_NAMES, locateRegion } from "@/lib/geo/ph-regions";
import { areaLabel, resolveArea, type SelectedArea } from "@/lib/area";
import type { SavedPlace } from "@/types/incident";

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
}: {
  area: SelectedArea;
  onChange: (area: SelectedArea) => void;
  places: SavedPlace[];
  count: number;
  warningCount: number;
  locale: Locale;
}) {
  const copy = t(locale).area;
  const [locate, setLocate] = useState<LocateState>("idle");
  const effective = resolveArea(area, places);
  const label = areaLabel(effective, places, copy.all);
  const value =
    effective.kind === "region"
      ? `region:${effective.region}`
      : effective.kind === "place"
        ? `place:${effective.placeId}`
        : "all";

  function select(v: string) {
    setLocate("idle");
    if (v.startsWith("region:")) onChange({ kind: "region", region: v.slice(7) });
    else if (v.startsWith("place:")) onChange({ kind: "place", placeId: v.slice(6) });
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
        onChange({ kind: "region", region });
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

  const summary =
    count === 0
      ? copy.summaryNone.replace("{area}", label)
      : (count === 1 ? copy.summaryOne : copy.summaryMany)
          .replace("{n}", String(count))
          .replace("{area}", label) +
        (warningCount > 0 ? ` · ${copy.summaryWarning.replace("{n}", String(warningCount))}` : "");

  return (
    <section
      aria-label={copy.label}
      className="flex flex-col gap-2 border-b border-overlay/8 px-4 py-3 md:flex-row md:items-center md:gap-4 md:px-5"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-dim)]" htmlFor="area-select">
          <MapPin className="h-3.5 w-3.5" />
          {copy.label}
        </label>
        <select
          id="area-select"
          className="max-w-[16rem] rounded-lg border border-overlay/12 bg-[var(--bg-panel)] px-2.5 py-1.5 text-[13px] text-[var(--text-primary)]"
          onChange={(e) => select(e.target.value)}
          value={value}
        >
          <option value="all">{copy.all}</option>
          {places.length > 0 && (
            <optgroup label={copy.savedPlaces}>
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
          className="flex items-center gap-1.5 rounded-lg border border-overlay/12 px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] transition hover:bg-overlay/6 disabled:opacity-60"
          disabled={locate === "locating"}
          onClick={useMyLocation}
          title={copy.locationNote}
          type="button"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {copy.useLocation}
        </button>
      </div>
      <div className="min-w-0 text-[12px] leading-5 text-[var(--text-muted)]" role="status">
        {locateMessage ?? (
          <>
            <span className="text-[var(--text-primary)]">{summary}</span>
            {count === 0 && effective.kind !== "all" && (
              <span className="block text-[11px] text-[var(--text-dim)]">{copy.summaryCaveat}</span>
            )}
          </>
        )}
      </div>
    </section>
  );
}
