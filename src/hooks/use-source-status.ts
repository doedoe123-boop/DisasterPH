"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SourceStatus } from "@/types/incident";

export interface UseSourceStatusResult {
  sourceStatuses: SourceStatus[];
  isLoading: boolean;
  error: string | null;
}

const POLL_MS = 60_000;
const SOURCE_STATUS_CACHE_KEY = "disasterph-source-status-cache";
const RETRY_MS = 4_000;

export function useSourceStatus(): UseSourceStatusResult {
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const hydrateFromCache = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(SOURCE_STATUS_CACHE_KEY);
      if (raw) {
        setSourceStatuses(JSON.parse(raw) as SourceStatus[]);
      }
    } catch {
      // Ignore corrupted cache
    }
  }, []);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/source-status", { signal: ctrl.signal });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setSourceStatuses(json.data);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          SOURCE_STATUS_CACHE_KEY,
          JSON.stringify(json.data),
        );
      }
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      hydrateFromCache();
      setError(
        err instanceof Error ? err.message : "Failed to fetch source status",
      );
      if (typeof window !== "undefined") {
        retryTimerRef.current = window.setTimeout(fetchData, RETRY_MS);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromCache]);

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

  return { sourceStatuses, isLoading, error };
}
