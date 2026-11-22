"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  ALL_AREAS,
  AREA_STORAGE_KEY,
  parseArea,
  serializeArea,
  type SelectedArea,
} from "@/lib/area";

const EVENT = "disasterph-area-change";
let cachedRaw: string | null | undefined;
let cachedArea: SelectedArea = ALL_AREAS;

function read(): SelectedArea {
  const raw = window.localStorage.getItem(AREA_STORAGE_KEY);
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

/** The visitor's chosen area, shared across components and tabs. */
export function useSelectedArea() {
  const area = useSyncExternalStore(subscribe, read, () => ALL_AREAS);
  const setArea = useCallback((next: SelectedArea) => {
    try {
      window.localStorage.setItem(AREA_STORAGE_KEY, serializeArea(next));
    } catch {
      /* storage unavailable: still update this page */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [area, setArea] as const;
}
