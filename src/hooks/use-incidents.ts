"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardStats, Incident, SourceStatus } from "@/types/incident";

interface IncidentsPayload {
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
  refresh: () => void;
}

const POLL_MS = 60_000;
const STALE_MS = 5 * 60_000;
const INCIDENT_CACHE_KEY = "disasterph-incidents-cache";
const RETRY_MS = 4_000;

export function useIncidents(filter?: string): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeAlerts: 0,
    criticalAlerts: 0,
    sourcesOnline: 0,
    regionsTracked: 0,
  });
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<number | null>(null);

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
      hydrateFromCache();
      setError(
        err instanceof Error ? err.message : "Failed to fetch incidents",
      );
      if (typeof window !== "undefined") {
        retryTimerRef.current = window.setTimeout(fetchData, RETRY_MS);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, filter, hydrateFromCache]);

  useEffect(() => {
    hydrateFromCache();
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      clearInterval(id);
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      abortRef.current?.abort();
    };
  }, [fetchData, hydrateFromCache]);

  const staleAt =
    generatedAt && Date.now() - new Date(generatedAt).getTime() > STALE_MS
      ? generatedAt
      : null;

  return {
    incidents,
    stats,
    sourceStatuses,
    isLoading,
    error,
    staleAt,
    refresh: fetchData,
  };
}
