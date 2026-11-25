"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Download,
  GraduationCap,
  Home,
  LocateFixed,
  MapPin,
  Plus,
  Trash2,
  Upload,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Incident, SavedPlace } from "@/types/incident";
import { severityText, t, type Locale } from "@/lib/i18n";
import { computePlaceRisk, haversineKm } from "@/lib/risk-summary";
import {
  MAX_LABEL_LENGTH,
  MAX_PLACES,
  inPhilippineBounds,
  parsePlacesBackup,
  placesBackup,
  roundCoord,
} from "@/lib/saved-places";
import { useSavedPlaces } from "@/hooks/use-saved-places";

const TAG_ICONS: Record<SavedPlace["tag"], LucideIcon> = {
  family: Users,
  home: Home,
  work: Briefcase,
  school: GraduationCap,
  other: MapPin,
};
const TAG_ORDER: SavedPlace["tag"][] = ["family", "home", "work", "school", "other"];

/** [name, province, lat, lon] from src/data/ph-towns.json */
type Town = [string, string, number, number];

let townsPromise: Promise<Town[]> | null = null;
/** The town list (about 18 KB gzipped) loads only when someone adds a place. */
function loadTowns(): Promise<Town[]> {
  townsPromise ??= import("@/data/ph-towns.json").then((m) => m.default.towns as Town[]);
  return townsPromise;
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Towns matching the query: name starts with it first, then contains it, then province. */
function searchTowns(towns: Town[], query: string, limit = 8): Town[] {
  const q = fold(query.trim()).replace(/^city of /, "");
  if (q.length < 2) return [];
  const scored: Array<[number, Town]> = [];
  for (const town of towns) {
    const name = fold(town[0]).replace(/^city of /, "");
    const province = fold(town[1]);
    const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : province.startsWith(q) ? 2 : -1;
    if (score >= 0) scored.push([score, town]);
  }
  return scored
    .sort((a, b) => a[0] - b[0] || a[1][0].localeCompare(b[1][0]))
    .slice(0, limit)
    .map(([, town]) => town);
}

const townLabel = (town: Town) => `${town[0]}, ${town[1]}`;

interface Chosen {
  latitude: number;
  longitude: number;
  locality: string;
  fromDevice: boolean;
}

/**
 * Saved places: the places of people the visitor cares about. Shows which
 * recent events are near each place, never whether the people are safe.
 * Everything stays in this browser; a backup file guards against the
 * browser clearing it.
 */
export function SavedPlacesPanel({
  open,
  onClose,
  recentIncidents,
  locale,
  onShowPlace,
}: {
  open: boolean;
  onClose: () => void;
  recentIncidents: Incident[];
  locale: Locale;
  onShowPlace: (placeId: string) => void;
}) {
  const copy = t(locale).places;
  const disclaimer = t(locale).disclaimer;
  const { places, addPlace, removePlace, restorePlaces } = useSavedPlaces();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const risks = useMemo(
    () => places.map((p) => computePlaceRisk(p, recentIncidents)),
    [places, recentIncidents],
  );

  function download() {
    const blob = new Blob([placesBackup(places)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disasterph-places-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restore(file: File | undefined) {
    if (!file) return;
    const parsed = file.size <= 200_000 ? parsePlacesBackup(await file.text()) : null;
    setMessage(parsed ? copy.restored.replace("{n}", String(restorePlaces(parsed))) : copy.restoreFailed);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="saved-places-title"
      className="m-auto max-h-[90vh] w-[min(36rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-overlay/12 bg-[var(--bg-panel-strong)] p-0 text-[var(--text-primary)] shadow-2xl backdrop:bg-black/60"
      onClose={() => {
        setAdding(false);
        setMessage(null);
        onClose();
      }}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-overlay/8 bg-[var(--bg-panel-strong)] px-5 py-3.5">
        <h2 id="saved-places-title" className="text-[15px] font-bold">
          {copy.title}
        </h2>
        <button
          aria-label={copy.close}
          className="rounded-lg p-1.5 text-[var(--text-dim)] transition hover:bg-overlay/8 hover:text-[var(--text-primary)]"
          onClick={() => dialogRef.current?.close()}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <p className="text-[13px] leading-5 text-[var(--text-muted)]">
          {copy.intro} {copy.storedLocally}
        </p>
        <p className="place-caveat rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] leading-5 text-amber-200">
          {copy.caveat}
        </p>

        {places.length === 0 ? (
          <p className="text-[13px] text-[var(--text-dim)]">{copy.none}</p>
        ) : (
          <ul className="space-y-2">
            {risks.map((risk) => {
              const place = risk.place;
              const Icon = TAG_ICONS[place.tag];
              const n = risk.nearbyIncidents.length;
              return (
                <li key={place.id} className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-3">
                  <div className="flex items-start gap-3">
                    <Icon aria-hidden className="place-accent mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold">{place.label}</p>
                      <p className="text-[12px] text-[var(--text-dim)]">
                        {copy.tags[place.tag]}
                        {place.locality ? ` · ${place.locality}` : ""}
                      </p>
                      <p className={`mt-1.5 text-[12.5px] leading-5 ${n ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                        {n === 0
                          ? copy.noEvents
                          : `${(n === 1 ? copy.eventsOne : copy.eventsMany).replace("{n}", String(n))}${
                              risk.highestSeverity
                                ? ` · ${copy.highest.replace("{level}", severityText(risk.highestSeverity, locale))}`
                                : ""
                            }`}
                      </p>
                      {n > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {risk.nearbyIncidents.slice(0, 3).map((incident) => (
                            <li key={incident.id} className="truncate text-[12px]">
                              <Link className="text-cyan-400 hover:text-cyan-300" href={`/pulse/${encodeURIComponent(incident.id)}`}>
                                {incident.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        className="mt-2 text-[12px] font-medium text-cyan-400 hover:text-cyan-300"
                        onClick={() => {
                          onShowPlace(place.id);
                          dialogRef.current?.close();
                        }}
                        type="button"
                      >
                        {copy.showOnMap}
                      </button>
                    </div>
                    <button
                      aria-label={copy.removeLabel.replace("{name}", place.label)}
                      className="rounded-lg p-1.5 text-[var(--text-dim)] transition hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => removePlace(place.id)}
                      title={copy.removeLabel.replace("{name}", place.label)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {adding ? (
          <AddPlaceForm
            locale={locale}
            onCancel={() => setAdding(false)}
            onSave={(input) => {
              const ok = addPlace(input);
              if (ok) setAdding(false);
              return ok;
            }}
          />
        ) : places.length >= MAX_PLACES ? (
          <p className="text-[12.5px] text-[var(--text-dim)]">{copy.limit.replace("{n}", String(MAX_PLACES))}</p>
        ) : (
          <button
            className="place-accent flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-[13px] font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
            onClick={() => {
              setMessage(null);
              setAdding(true);
            }}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {copy.add}
          </button>
        )}

        <div className="border-t border-overlay/8 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-dim)]">{copy.backupTitle}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-muted)]">{copy.backupNote}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="flex items-center gap-1.5 rounded-lg border border-overlay/12 px-3 py-1.5 text-[12.5px] font-medium transition hover:bg-overlay/6 disabled:opacity-50"
              disabled={places.length === 0}
              onClick={download}
              type="button"
            >
              <Download className="h-3.5 w-3.5" />
              {copy.download}
            </button>
            <button
              className="flex items-center gap-1.5 rounded-lg border border-overlay/12 px-3 py-1.5 text-[12.5px] font-medium transition hover:bg-overlay/6"
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <Upload className="h-3.5 w-3.5" />
              {copy.restore}
            </button>
            <input
              ref={fileRef}
              accept="application/json,.json"
              aria-label={copy.restore}
              className="hidden"
              onChange={(e) => restore(e.target.files?.[0])}
              type="file"
            />
          </div>
          {message && (
            <p className="mt-2 text-[12.5px] text-[var(--text-primary)]" role="status">
              {message}
            </p>
          )}
        </div>

        <p className="border-t border-overlay/8 pt-3 text-[11.5px] leading-5 text-[var(--text-dim)]">
          {disclaimer}
        </p>
      </div>
    </dialog>
  );
}

function AddPlaceForm({
  locale,
  onCancel,
  onSave,
}: {
  locale: Locale;
  onCancel: () => void;
  onSave: (input: { label: string; tag: SavedPlace["tag"]; latitude: number; longitude: number; locality: string }) => boolean;
}) {
  const copy = t(locale).places;
  const areaCopy = t(locale).area;
  const [label, setLabel] = useState("");
  const [tag, setTag] = useState<SavedPlace["tag"]>("family");
  const [query, setQuery] = useState("");
  const [towns, setTowns] = useState<Town[] | null>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let live = true;
    loadTowns().then((list) => live && setTowns(list), () => live && setTowns([]));
    return () => {
      live = false;
    };
  }, []);

  const results = useMemo(() => (towns ? searchTowns(towns, query) : []), [towns, query]);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setError(areaCopy.locationUnavailable);
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Rounded straight away: the precise position is never kept.
        const latitude = roundCoord(pos.coords.latitude);
        const longitude = roundCoord(pos.coords.longitude);
        setLocating(false);
        if (!inPhilippineBounds(latitude, longitude)) {
          setError(areaCopy.locationOffshore);
          return;
        }
        const list = await loadTowns().catch(() => [] as Town[]);
        let nearest: Town | null = null;
        let best = Infinity;
        for (const town of list) {
          const d = haversineKm(latitude, longitude, town[2], town[3]);
          if (d < best) {
            best = d;
            nearest = town;
          }
        }
        setChosen({
          latitude,
          longitude,
          locality: nearest && best < 30 ? townLabel(nearest) : "",
          fromDevice: true,
        });
      },
      (err) => {
        setLocating(false);
        setError(err.code === err.PERMISSION_DENIED ? areaCopy.locationDenied : areaCopy.locationUnavailable);
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 15_000 },
    );
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return setError(copy.needName);
    if (!chosen) return setError(copy.needLocation);
    if (!onSave({ label, tag, latitude: chosen.latitude, longitude: chosen.longitude, locality: chosen.locality })) {
      setError(copy.limit.replace("{n}", String(MAX_PLACES)));
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-overlay/12 bg-[var(--bg-panel)] px-3 py-2 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-dim)]";

  return (
    <form className="space-y-3 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.04] p-4" onSubmit={save}>
      <p className="text-[13px] font-semibold">{copy.add}</p>
      <label className="block text-[12px] font-medium text-[var(--text-muted)]">
        {copy.nameLabel}
        <input
          className={field}
          maxLength={MAX_LABEL_LENGTH}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={copy.namePlaceholder}
          value={label}
        />
      </label>
      <label className="block text-[12px] font-medium text-[var(--text-muted)]">
        {copy.tagLabel}
        <select className={field} onChange={(e) => setTag(e.target.value as SavedPlace["tag"])} value={tag}>
          {TAG_ORDER.map((t) => (
            <option key={t} value={t}>
              {copy.tags[t]}
            </option>
          ))}
        </select>
      </label>

      {chosen ? (
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span>
            {copy.chosen.replace(
              "{place}",
              chosen.fromDevice
                ? [copy.currentLocation, chosen.locality].filter(Boolean).join(" · ")
                : chosen.locality,
            )}
          </span>
          <button className="text-[12px] font-medium text-cyan-400 hover:text-cyan-300" onClick={() => setChosen(null)} type="button">
            {copy.change}
          </button>
        </div>
      ) : (
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-muted)]">
            {copy.locationLabel}
            <input
              autoComplete="off"
              className={field}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              value={query}
            />
          </label>
          {towns === null ? (
            <p className="mt-1.5 text-[12px] text-[var(--text-dim)]">{copy.loadingTowns}</p>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <p className="mt-1.5 text-[12px] text-[var(--text-dim)]" role="status">{copy.noTownMatch}</p>
          ) : results.length > 0 ? (
            <ul className="mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-overlay/10">
              {results.map((town) => (
                <li key={townLabel(town)}>
                  <button
                    className="block w-full px-3 py-2 text-left text-[13px] transition hover:bg-overlay/8 focus:bg-overlay/8"
                    onClick={() => {
                      setChosen({ latitude: town[2], longitude: town[3], locality: townLabel(town), fromDevice: false });
                      setError(null);
                    }}
                    type="button"
                  >
                    {town[0]}
                    <span className="text-[var(--text-dim)]">, {town[1]}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-overlay/12 px-2.5 py-1.5 text-[12.5px] font-medium transition hover:bg-overlay/6 disabled:opacity-60"
            disabled={locating}
            onClick={useCurrentLocation}
            type="button"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {locating ? copy.locating : copy.useCurrent}
          </button>
          <p className="mt-1 text-[11.5px] text-[var(--text-dim)]">{copy.currentNote}</p>
        </div>
      )}

      {error && (
        <p className="text-[12.5px] text-red-300" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button className="rounded-lg bg-cyan-500 px-3.5 py-2 text-[13px] font-semibold text-black transition hover:bg-cyan-400" type="submit">
          {copy.save}
        </button>
        <button className="rounded-lg border border-overlay/12 px-3.5 py-2 text-[13px] font-medium transition hover:bg-overlay/6" onClick={onCancel} type="button">
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}
