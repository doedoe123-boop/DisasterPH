"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityReport, ReportStatus } from "@/types/incident";

// v2 caches only the public (approved, public-field) list. The v1 key could
// hold pending/rejected rows and reporter names, so it is purged on load.
const STORAGE_KEY = "disasterph-community-reports:v2";
const LEGACY_STORAGE_KEY = "disasterph-community-reports";
const POLL_INTERVAL = 30_000; // 30s

/* ── snake_case ↔ camelCase mapping ── */

interface DbRow {
  id: string;
  category: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_label: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Moderator-only fields (absent from the public list)
  reporter_name?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  moderation_reason?: string | null;
}

function rowToReport(row: DbRow): CommunityReport {
  return {
    id: row.id,
    category: row.category as CommunityReport["category"],
    title: row.title,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    locationLabel: row.location_label,
    status: row.status as CommunityReport["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.reporter_name && { reporterName: row.reporter_name }),
    ...(row.moderated_at && { moderatedAt: row.moderated_at }),
    ...(row.moderated_by && { moderatedBy: row.moderated_by }),
    ...(row.moderation_reason && { moderationReason: row.moderation_reason }),
  };
}

/* ── localStorage offline cache (public list only) ── */

function cacheLoad(): CommunityReport[] {
  if (typeof window === "undefined") return [];
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CommunityReport[]) : [];
  } catch {
    return [];
  }
}

function cacheSave(reports: CommunityReport[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(reports.filter((r) => r.status === "approved")),
    );
  } catch {
    /* storage full or unavailable */
  }
}

export type SubmitResult = "submitted" | "failed";

/* ── Hook ── */

export function useCommunityReports() {
  const [reports, setReports] = useState<CommunityReport[]>(() => cacheLoad());
  const [isModerator, setIsModerator] = useState(false);
  const moderatorRef = useRef(false);
  const polling = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  /* Fetch the public list, or the full queue for a signed-in moderator */
  const fetchReports = useCallback(async () => {
    try {
      const url = moderatorRef.current
        ? "/api/reports/moderation"
        : "/api/reports";
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 401 && moderatorRef.current) {
        // Session expired or ADMIN_TOKEN rotated: drop back to public view.
        moderatorRef.current = false;
        setIsModerator(false);
        return;
      }
      if (!res.ok) return;
      const json = await res.json();
      const mapped = (json.data as DbRow[]).map(rowToReport);
      setReports(mapped);
      if (!moderatorRef.current) cacheSave(mapped);
    } catch {
      /* offline — keep cached data */
    }
  }, []);

  const applyModeratorState = useCallback(
    (active: boolean) => {
      moderatorRef.current = active;
      setIsModerator(active);
      void fetchReports();
    },
    [fetchReports],
  );

  /* Initial session check + fetch + polling */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/moderator/session", { cache: "no-store" });
        const json = res.ok ? ((await res.json()) as { moderator?: boolean }) : {};
        if (!cancelled) applyModeratorState(json.moderator === true);
      } catch {
        if (!cancelled) applyModeratorState(false);
      }
    })();
    polling.current = setInterval(fetchReports, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(polling.current);
    };
  }, [applyModeratorState, fetchReports]);

  /* Moderator sign-in: the token is sent once to the server, never stored */
  const signInModerator = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/moderator/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) return false;
        applyModeratorState(true);
        return true;
      } catch {
        return false;
      }
    },
    [applyModeratorState],
  );

  const signOutModerator = useCallback(async () => {
    try {
      await fetch("/api/moderator/session", { method: "DELETE" });
    } catch {
      /* offline — cookie expires on its own */
    }
    applyModeratorState(false);
  }, [applyModeratorState]);

  /* Add — new reports enter moderation and are not public until approved */
  const addReport = useCallback(
    async (
      report: Omit<
        CommunityReport,
        "id" | "createdAt" | "updatedAt" | "status"
      >,
    ): Promise<SubmitResult> => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: report.category,
            title: report.title,
            description: report.description,
            latitude: report.latitude,
            longitude: report.longitude,
            location_label: report.locationLabel,
            reporter_name: report.reporterName,
            website: "", // honeypot — always empty from real clients
          }),
        });
        if (!res.ok) return "failed";
        if (moderatorRef.current) void fetchReports();
        return "submitted";
      } catch {
        return "failed";
      }
    },
    [fetchReports],
  );

  /* Moderate (requires moderator session cookie) */
  const moderate = useCallback(
    async (id: string, decision: { status: ReportStatus; reason: string }) => {
      try {
        const res = await fetch(`/api/reports/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: decision.status,
            moderation_reason: decision.reason,
          }),
        });
        if (res.status === 401) {
          applyModeratorState(false);
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        const updated = rowToReport(json.data as DbRow);
        setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      } catch {
        /* offline */
      }
    },
    [applyModeratorState],
  );

  /* Remove (requires moderator session cookie) */
  const removeReport = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
        if (res.status === 401) {
          applyModeratorState(false);
          return;
        }
        if (!res.ok) return;
        setReports((prev) => prev.filter((r) => r.id !== id));
      } catch {
        /* offline */
      }
    },
    [applyModeratorState],
  );

  return {
    reports,
    isModerator,
    addReport,
    moderate,
    removeReport,
    signInModerator,
    signOutModerator,
  } as const;
}
