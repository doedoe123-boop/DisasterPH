"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SavedPlace } from "@/types/incident";
import {
  MAX_PLACES,
  PLACES_STORAGE_KEY,
  createPlace,
  mergePlaces,
  sanitizePlaces,
} from "@/lib/saved-places";

/*
 * One shared store over localStorage, so every component sees the same
 * places, other tabs stay in sync, and the server render (no places) matches
 * the first client render.
 */
const EMPTY: SavedPlace[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedPlaces: SavedPlace[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(PLACES_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): SavedPlace[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedPlaces = raw ? sanitizePlaces(JSON.parse(raw)) : EMPTY;
    } catch {
      cachedPlaces = EMPTY;
    }
  }
  return cachedPlaces;
}

function getServerSnapshot(): SavedPlace[] {
  return EMPTY;
}

let migrated = false;

/** Older versions stored full-precision coordinates: store the rounded list. */
function migrateOnce() {
  if (migrated) return;
  migrated = true;
  const raw = readRaw();
  if (!raw) return;
  const clean = JSON.stringify(getSnapshot());
  if (clean !== raw) {
    try {
      localStorage.setItem(PLACES_STORAGE_KEY, clean);
    } catch {
      /* storage unavailable: the rounded list is still what the app uses */
    }
  }
}

function subscribe(listener: () => void) {
  migrateOnce();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === PLACES_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns false when the browser would not store the places. */
function write(places: SavedPlace[]): boolean {
  let ok = true;
  try {
    localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(places));
  } catch {
    ok = false;
  }
  listeners.forEach((l) => l());
  return ok;
}

export function useSavedPlaces() {
  const places = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addPlace = useCallback((input: Parameters<typeof createPlace>[0]): boolean => {
    const current = getSnapshot();
    const place = createPlace(input);
    if (!place || current.length >= MAX_PLACES) return false;
    return write([...current, place]);
  }, []);

  const removePlace = useCallback((id: string) => {
    write(getSnapshot().filter((p) => p.id !== id));
  }, []);

  /** Adds restored places that are not already saved; returns how many were added. */
  const restorePlaces = useCallback((incoming: SavedPlace[]): number => {
    const current = getSnapshot();
    const merged = mergePlaces(current, incoming);
    return write(merged) ? merged.length - current.length : 0;
  }, []);

  return { places, addPlace, removePlace, restorePlaces } as const;
}
