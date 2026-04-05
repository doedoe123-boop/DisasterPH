"use client";

import { useCallback, useState } from "react";
import type { SavedPlace } from "@/types/incident";

const STORAGE_KEY = "disasterph-saved-places";

function loadPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPlace[]) : [];
  } catch {
    return [];
  }
}

function persistPlaces(places: SavedPlace[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  } catch {
    // Storage full or unavailable
  }
}

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>(() => loadPlaces());

  const addPlace = useCallback(
    (place: Omit<SavedPlace, "id" | "createdAt">) => {
      setPlaces((prev) => {
        const newPlace: SavedPlace = {
          ...place,
          id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        const updated = [...prev, newPlace];
        persistPlaces(updated);
        return updated;
      });
    },
    [],
  );

  const removePlace = useCallback((id: string) => {
    setPlaces((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistPlaces(updated);
      return updated;
    });
  }, []);

  const updatePlace = useCallback(
    (id: string, patch: Partial<Omit<SavedPlace, "id" | "createdAt">>) => {
      setPlaces((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
        persistPlaces(updated);
        return updated;
      });
    },
    [],
  );

  return { places, addPlace, removePlace, updatePlace } as const;
}
