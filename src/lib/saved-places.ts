import type { SavedPlace } from "@/types/incident";

/**
 * Saved places live only in the visitor's browser. Coordinates are kept to
 * 2 decimals (about 1 km): enough to match events, which are coarse, and no
 * more precise than needed for a family member's home.
 */
export const PLACES_STORAGE_KEY = "disasterph-saved-places";
export const MAX_PLACES = 20;
export const MAX_LABEL_LENGTH = 60;

const TAGS: ReadonlyArray<SavedPlace["tag"]> = ["family", "home", "work", "school", "other"];

/** Generous box around the Philippines, including the Kalayaan Islands. */
const BOUNDS = { minLat: 4, maxLat: 22, minLon: 112, maxLon: 128 };

export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function inPhilippineBounds(lat: number, lon: number): boolean {
  return lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon;
}

function cleanText(value: unknown, max: number): string {
  // Strip control characters; React escapes the rest when rendering.
  if (typeof value !== "string") return "";
  const printable = Array.from(value, (c) => {
    const code = c.charCodeAt(0);
    return code < 32 || code === 127 ? " " : c;
  }).join("");
  return printable.replace(/\s+/g, " ").trim().slice(0, max);
}

function newId(): string {
  return `place-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** One stored or imported place, or null when it is not usable. */
function sanitizePlace(raw: unknown): SavedPlace | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const label = cleanText(r.label, MAX_LABEL_LENGTH);
  const lat = Number(r.latitude);
  const lon = Number(r.longitude);
  if (!label || !Number.isFinite(lat) || !Number.isFinite(lon) || !inPhilippineBounds(lat, lon)) {
    return null;
  }
  const tag = TAGS.includes(r.tag as SavedPlace["tag"]) ? (r.tag as SavedPlace["tag"]) : "other";
  const locality = cleanText(r.locality, 120);
  const createdAt =
    typeof r.createdAt === "string" && !Number.isNaN(Date.parse(r.createdAt))
      ? r.createdAt
      : new Date().toISOString();
  return {
    id: typeof r.id === "string" && /^[\w-]{1,64}$/.test(r.id) ? r.id : newId(),
    label,
    tag,
    latitude: roundCoord(lat),
    longitude: roundCoord(lon),
    ...(locality ? { locality } : {}),
    createdAt,
  };
}

/**
 * Validate a list read from storage or a backup: drops unusable entries,
 * rounds coordinates (older versions stored full precision), removes
 * duplicate ids, and keeps at most MAX_PLACES.
 */
export function sanitizePlaces(raw: unknown): SavedPlace[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SavedPlace[] = [];
  for (const item of raw) {
    const place = sanitizePlace(item);
    if (!place) continue;
    if (seen.has(place.id)) place.id = newId();
    seen.add(place.id);
    out.push(place);
    if (out.length >= MAX_PLACES) break;
  }
  return out;
}

export function createPlace(input: {
  label: string;
  tag: SavedPlace["tag"];
  latitude: number;
  longitude: number;
  locality?: string;
}): SavedPlace | null {
  return sanitizePlace({ ...input, id: newId(), createdAt: new Date().toISOString() });
}

const BACKUP_APP = "DisasterPH";
const BACKUP_KIND = "saved-places";

/** A small JSON file the visitor keeps; contains only what they saved. */
export function placesBackup(places: SavedPlace[], now = new Date()): string {
  return JSON.stringify(
    {
      app: BACKUP_APP,
      kind: BACKUP_KIND,
      version: 1,
      exportedAt: now.toISOString(),
      places: places.map(({ label, tag, latitude, longitude, locality }) => ({
        label,
        tag,
        latitude,
        longitude,
        ...(locality ? { locality } : {}),
      })),
    },
    null,
    1,
  );
}

/** Places from a backup file, or null when the file is not a places backup. */
export function parsePlacesBackup(text: string): SavedPlace[] | null {
  if (text.length > 200_000) return null;
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    if (data?.app !== BACKUP_APP || data.kind !== BACKUP_KIND || !Array.isArray(data.places)) return null;
    // Imported places get fresh ids.
    return sanitizePlaces(data.places.map((p) => (p && typeof p === "object" ? { ...p, id: undefined } : p)));
  } catch {
    return null;
  }
}

/** Add restored places that are not already saved (same name and spot). */
export function mergePlaces(existing: SavedPlace[], incoming: SavedPlace[]): SavedPlace[] {
  const key = (p: SavedPlace) => `${p.label.toLowerCase()}|${p.latitude}|${p.longitude}`;
  const have = new Set(existing.map(key));
  const merged = [...existing];
  for (const p of incoming) {
    if (merged.length >= MAX_PLACES) break;
    if (have.has(key(p))) continue;
    have.add(key(p));
    merged.push(p);
  }
  return merged;
}
