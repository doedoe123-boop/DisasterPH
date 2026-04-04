"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OfficialAdvisory } from "@/types/incident";

export interface UseAdvisoriesResult {
  advisories: OfficialAdvisory[];
  isLoading: boolean;
  error: string | null;
}

const POLL_MS = 120_000;

export function useAdvisories(): UseAdvisoriesResult {
  const [advisories, setAdvisories] = useState<OfficialAdvisory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Failed to fetch advisories",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [fetchData]);

  return { advisories, isLoading, error };
}
