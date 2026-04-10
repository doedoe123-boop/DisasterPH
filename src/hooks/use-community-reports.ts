"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityReport, ReportStatus } from "@/types/incident";

const STORAGE_KEY = "disasterph-community-reports";
const POLL_INTERVAL = 30_000; // 30s
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

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
  reporter_name: string;
  created_at: string;
  updated_at: string;
  moderated_at: string | null;
  moderated_by: string | null;
  moderation_reason: string | null;
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
    reporterName: row.reporter_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.moderated_at && { moderatedAt: row.moderated_at }),
    ...(row.moderated_by && { moderatedBy: row.moderated_by }),
    ...(row.moderation_reason && { moderationReason: row.moderation_reason }),
  };
}

/* ── localStorage offline cache ── */

function cacheLoad(): CommunityReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CommunityReport[]) : [];
  } catch {
    return [];
  }
}

function cacheSave(reports: CommunityReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    /* storage full or unavailable */
  }
}

/* ── Hook ── */

export function useCommunityReports() {
  const [reports, setReports] = useState<CommunityReport[]>(() => cacheLoad());
  const polling = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  /* Fetch from API and update state + cache */
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) return;
      const json = await res.json();
      const mapped = (json.data as DbRow[]).map(rowToReport);
      setReports(mapped);
      cacheSave(mapped);
    } catch {
      /* offline — keep cached data */
    }
  }, []);

  /* Initial fetch + polling */
  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchReports();
    }, 0);
    polling.current = setInterval(fetchReports, POLL_INTERVAL);
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(polling.current);
    };
  }, [fetchReports]);

  /* Add */
  const addReport = useCallback(
    async (
      report: Omit<
        CommunityReport,
        "id" | "createdAt" | "updatedAt" | "status"
      >,
    ) => {
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
        if (!res.ok) return;
        const json = await res.json();
        const created = rowToReport(json.data as DbRow);
        setReports((prev) => {
          const updated = [created, ...prev];
          cacheSave(updated);
          return updated;
        });
      } catch {
        /* offline — no-op for now */
      }
    },
    [],
  );

  /* Moderate */
  const moderate = useCallback(
    async (
      id: string,
      decision: { status: ReportStatus; reason: string; moderator: string },
    ) => {
      try {
        const res = await fetch(`/api/reports/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": ADMIN_TOKEN,
          },
          body: JSON.stringify({
            status: decision.status,
            moderation_reason: decision.reason,
            moderated_by: decision.moderator,
          }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const updated = rowToReport(json.data as DbRow);
        setReports((prev) => {
          const next = prev.map((r) => (r.id === id ? updated : r));
          cacheSave(next);
          return next;
        });
      } catch {
        /* offline */
      }
    },
    [],
  );

  /* Remove */
  const removeReport = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": ADMIN_TOKEN },
      });
      if (!res.ok) return;
      setReports((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        cacheSave(updated);
        return updated;
      });
    } catch {
      /* offline */
    }
  }, []);

  return { reports, addReport, moderate, removeReport } as const;
}
