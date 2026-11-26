"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  ALL_AREAS,
  AREA_STORAGE_KEY,
  parseArea,
  serializeArea,
  type SelectedArea,
} from "@/lib/area";
import { parseViewParams } from "@/lib/view-url";

const EVENT = "disasterph-area-change";
let cachedRaw: string | null | undefined;
let cachedArea: SelectedArea = ALL_AREAS;
// Used when storage is unavailable (private mode, blocked site data).
let memoryArea: SelectedArea | null = null;
let urlApplied = false;

function store(next: SelectedArea) {
  try {
    window.localStorage.setItem(AREA_STORAGE_KEY, serializeArea(next));
    memoryArea = null;
  } catch {
    memoryArea = next;
  }
}

/**
 * A shared link's region (`?view=bicol`) becomes the chosen area, once per
 * page load, before the first read, so the page shows what the server
 * rendered for that link.
 */
function applyUrlOnce() {
  if (urlApplied) return;
  urlApplied = true;
  const region = parseViewParams(new URLSearchParams(window.location.search)).region;
  if (region) store({ kind: "region", region });
}

function read(): SelectedArea {
  applyUrlOnce();
  if (memoryArea) return memoryArea;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(AREA_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedArea = parseArea(raw);
  }
  return cachedArea;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The visitor's chosen area, shared across components and tabs.
 * `serverArea`: the area the server rendered (from a shared link); pass a
 * stable object.
 */
export function useSelectedArea(serverArea: SelectedArea = ALL_AREAS) {
  const area = useSyncExternalStore(subscribe, read, () => serverArea);
  const setArea = useCallback((next: SelectedArea) => {
    store(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [area, setArea] as const;
}
