"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OfficialAdvisory } from "@/types/incident";

export interface UseAdvisoriesResult {
  advisories: OfficialAdvisory[];
  isLoading: boolean;
  error: string | null;
}

const POLL_MS = 120_000;
const RETRY_MS = 4_000;
const CACHE_KEY = "disasterph-advisories-cache";

export function useAdvisories(): UseAdvisoriesResult {
  const [advisories, setAdvisories] = useState<OfficialAdvisory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrateFromCache = useCallback(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const cached: OfficialAdvisory[] = JSON.parse(raw);
      setAdvisories(cached);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/advisories", { signal: ctrl.signal });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setAdvisories(json.data);
      setError(null);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      hydrateFromCache();
      setError(
        err instanceof Error ? err.message : "Failed to fetch advisories",
      );
      if (typeof window !== "undefined") {
        retryTimerRef.current = setTimeout(fetchData, RETRY_MS);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromCache]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [fetchData]);

  return { advisories, isLoading, error };
}
