"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardStats, Incident, SourceStatus } from "@/types/incident";

export interface IncidentsPayload {
  data: Incident[];
  meta: {
    count: number;
    stats: DashboardStats;
    sources: SourceStatus[];
    generated_at: string;
  };
}

export interface UseIncidentsResult {
  incidents: Incident[];
  stats: DashboardStats;
  sourceStatuses: SourceStatus[];
  isLoading: boolean;
  error: string | null;
  /** ISO timestamp when data was generated, or null if fresh. */
  staleAt: string | null;
  /** ISO timestamp when data was last generated (always set once data loads). */
  generatedAt: string | null;
  refresh: () => void;
}

const POLL_MS = 60_000;
const STALE_MS = 5 * 60_000;
const INCIDENT_CACHE_KEY = "disasterph-incidents-cache";
const RETRY_MS = 4_000;

/**
 * Live incidents, polled every minute. `initial` is the payload the server
 * rendered the page with: the list shows immediately (no loading state, no
 * fetch on mount), and polling continues from there.
 */
export function useIncidents(filter?: string, initial?: IncidentsPayload): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>(initial?.data ?? []);
  const [stats, setStats] = useState<DashboardStats>(
    initial?.meta.stats ?? {
      activeAlerts: 0,
      criticalAlerts: 0,
      sourcesOnline: 0,
      regionsTracked: 0,
    },
  );
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>(initial?.meta.sources ?? []);
  const [isLoading, setIsLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initial?.meta.generated_at ?? null);
  const hasInitial = useRef(Boolean(initial));
  const initialRef = useRef(initial);
  const abortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const [staleAt, setStaleAt] = useState<string | null>(null);
  // Latest fetchData for the retry timer (a callback cannot reference itself).
  const fetchRef = useRef<() => void>(() => {});

  const cacheKey = `${INCIDENT_CACHE_KEY}:${filter ?? "all"}`;

  const hydrateFromCache = useCallback(() => {
    if (typeof window === "undefined") return false;

    try {
      const raw = window.localStorage.getItem(cacheKey);
      if (!raw) return false;

      const cached: IncidentsPayload = JSON.parse(raw);
      setIncidents(cached.data);
      setStats(cached.meta.stats);
      setSourceStatuses(cached.meta.sources);
      setGeneratedAt(cached.meta.generated_at);
      return true;
    } catch {
      return false;
    }
  }, [cacheKey]);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const params = new URLSearchParams();
      if (filter && filter !== "all") params.set("type", filter);
      const qs = params.toString();
      const url = `/api/incidents${qs ? `?${qs}` : ""}`;

      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const json: IncidentsPayload = await res.json();
      setIncidents(json.data);
      setStats(json.meta.stats);
      setSourceStatuses(json.meta.sources);
      setGeneratedAt(json.meta.generated_at);
      setError(null);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(cacheKey, JSON.stringify(json));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Never replace server-rendered data with an older cached copy.
      if (!hasInitial.current) hydrateFromCache();
      setError(
        err instanceof Error ? err.message : "Failed to fetch incidents",
      );
      if (typeof window !== "undefined") {
        retryTimerRef.current = window.setTimeout(() => fetchRef.current(), RETRY_MS);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, filter, hydrateFromCache]);

  useEffect(() => {
    fetchRef.current = () => void fetchData();
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    // Cached data first, then a fresh fetch; started on the next microtask
    // rather than synchronously in the effect body.
    queueMicrotask(() => {
      if (cancelled) return;
      if (hasInitial.current) {
        // Server-rendered data stays on screen. Keep it for offline use, and
        // check once for anything newer: a page restored by Back or served
        // from the offline cache can be minutes old.
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(initialRef.current));
        } catch {
          /* storage full or blocked */
        }
        void fetchData();
        return;
      }
      hydrateFromCache();
      void fetchData();
    });
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      abortRef.current?.abort();
    };
  }, [fetchData, hydrateFromCache, cacheKey]);

  // Staleness is time-dependent, so it is recomputed when data changes and
  // every 30 s rather than read from the clock during render.
  useEffect(() => {
    const check = () =>
      setStaleAt(
        generatedAt && Date.now() - new Date(generatedAt).getTime() > STALE_MS
          ? generatedAt
          : null,
      );
    const first = window.setTimeout(check, 0);
    const id = window.setInterval(check, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [generatedAt]);

  return {
    incidents,
    stats,
    sourceStatuses,
    isLoading,
    error,
    staleAt,
    generatedAt,
    refresh: fetchData,
  };
}
