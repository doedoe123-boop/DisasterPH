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
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Failed to fetch incidents",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [fetchData]);

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
