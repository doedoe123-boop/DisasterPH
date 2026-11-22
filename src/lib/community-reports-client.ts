import type { CommunityReport, ReportStatus } from "@/types/incident";

/**
 * Browser-side state for community reports, independent of React so the
 * moderator-session rules can be tested directly.
 *
 * Private data rules:
 * - The moderation queue (pending/rejected rows, reporter names, moderation
 *   notes) exists only in memory while moderator access is active.
 * - When access ends (sign-out, session expiry, a 401, or sign-out in another
 *   tab) the queue is replaced with the public list immediately.
 * - Every moderator access change bumps `epoch`; responses to requests started
 *   under an older epoch are discarded, so a late reply from an ended session
 *   can never restore private rows.
 * - Only explicitly public fields of approved reports are written to storage.
 */

export const REPORTS_CACHE_KEY = "disasterph-community-reports:v2";
export const LEGACY_REPORTS_CACHE_KEY = "disasterph-community-reports";
/** Written on sign-out so other tabs drop moderator data too. */
export const MODERATOR_SIGNOUT_KEY = "disasterph-moderator-signout";
const POLL_INTERVAL_MS = 30_000;

/** Fields of a report that anyone may see. Nothing else is cached or shown publicly. */
export type PublicCommunityReport = Pick<
  CommunityReport,
  | "id"
  | "category"
  | "title"
  | "description"
  | "latitude"
  | "longitude"
  | "locationLabel"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

export interface ReportsSnapshot {
  reports: CommunityReport[];
  isModerator: boolean;
}

export type SubmitResult = "submitted" | "failed";

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

/** Copy only the public fields (allowlist, never a spread of the source). */
export function toPublicReport(r: CommunityReport): PublicCommunityReport {
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description,
    latitude: r.latitude,
    longitude: r.longitude,
    locationLabel: r.locationLabel,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function publicApproved(reports: CommunityReport[]): PublicCommunityReport[] {
  return reports.filter((r) => r.status === "approved").map(toPublicReport);
}

type TimerHandle = ReturnType<typeof setTimeout>;

export interface ReportsControllerDeps {
  fetch: typeof fetch;
  storage: Storage | null;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => TimerHandle;
  clearTimeout?: (h: TimerHandle) => void;
  setInterval?: (fn: () => void, ms: number) => TimerHandle;
  clearInterval?: (h: TimerHandle) => void;
  addStorageListener?: (fn: (e: StorageEvent) => void) => () => void;
}

export function createReportsController(deps: ReportsControllerDeps) {
  const now = deps.now ?? Date.now;
  const setT = deps.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const clearT = deps.clearTimeout ?? ((h) => clearTimeout(h));
  const setI = deps.setInterval ?? ((fn, ms) => setInterval(fn, ms));
  const clearI = deps.clearInterval ?? ((h) => clearInterval(h));

  function loadPublicCache(): CommunityReport[] {
    if (!deps.storage) return [];
    try {
      deps.storage.removeItem(LEGACY_REPORTS_CACHE_KEY);
      const raw = deps.storage.getItem(REPORTS_CACHE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      // Re-project on read too, in case an older build cached extra fields.
      return Array.isArray(parsed) ? publicApproved(parsed as CommunityReport[]) : [];
    } catch {
      return [];
    }
  }

  function savePublicCache(reports: CommunityReport[]) {
    try {
      deps.storage?.setItem(REPORTS_CACHE_KEY, JSON.stringify(publicApproved(reports)));
    } catch {
      /* storage full or unavailable */
    }
  }

  let snapshot: ReportsSnapshot = { reports: loadPublicCache(), isModerator: false };
  let epoch = 0;
  let expiryTimer: TimerHandle | null = null;
  let pollTimer: TimerHandle | null = null;
  let removeStorageListener: (() => void) | null = null;
  const listeners = new Set<() => void>();

  function set(next: ReportsSnapshot) {
    snapshot = next;
    listeners.forEach((l) => l());
  }

  function clearExpiry() {
    if (expiryTimer !== null) clearT(expiryTimer);
    expiryTimer = null;
  }

  /** End moderator access now: invalidate in-flight work, drop private rows. */
  function endModeratorAccess() {
    epoch += 1;
    clearExpiry();
    set({ reports: loadPublicCache(), isModerator: false });
    void refresh();
  }

  function beginModeratorAccess(expiresAtSeconds: number | null) {
    epoch += 1;
    clearExpiry();
    if (expiresAtSeconds !== null) {
      const delay = expiresAtSeconds * 1000 - now();
      if (delay <= 0) {
        endModeratorAccess();
        return;
      }
      expiryTimer = setT(endModeratorAccess, delay);
    }
    set({ reports: snapshot.reports, isModerator: true });
    void refresh();
  }

  async function refresh() {
    const started = epoch;
    const moderator = snapshot.isModerator;
    try {
      const res = await deps.fetch(moderator ? "/api/reports/moderation" : "/api/reports", {
        cache: "no-store",
      });
      if (started !== epoch) return;
      if (res.status === 401 && moderator) {
        endModeratorAccess();
        return;
      }
      if (!res.ok) return;
      const json = (await res.json()) as { data?: DbRow[] };
      if (started !== epoch) return; // access changed while the body was read
      const mapped = (json.data ?? []).map(rowToReport);
      if (moderator) {
        set({ reports: mapped, isModerator: true });
      } else {
        const pub = publicApproved(mapped);
        set({ reports: pub, isModerator: false });
        savePublicCache(pub);
      }
    } catch {
      /* offline: keep what we have */
    }
  }

  async function checkSession() {
    const started = epoch;
    try {
      const res = await deps.fetch("/api/moderator/session", { cache: "no-store" });
      const json = res.ok
        ? ((await res.json()) as { moderator?: boolean; expiresAt?: number | null })
        : {};
      if (started !== epoch) return;
      if (json.moderator === true) beginModeratorAccess(json.expiresAt ?? null);
      else void refresh();
    } catch {
      if (started === epoch) void refresh();
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    start() {
      void checkSession();
      pollTimer = setI(() => void refresh(), POLL_INTERVAL_MS);
      removeStorageListener =
        deps.addStorageListener?.((e) => {
          if (e.key === MODERATOR_SIGNOUT_KEY && snapshot.isModerator) endModeratorAccess();
        }) ?? null;
    },

    stop() {
      epoch += 1; // discard anything still in flight
      clearExpiry();
      if (pollTimer !== null) clearI(pollTimer);
      pollTimer = null;
      removeStorageListener?.();
      removeStorageListener = null;
    },

    refresh,

    async signIn(token: string): Promise<boolean> {
      const started = epoch;
      try {
        const res = await deps.fetch("/api/moderator/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) return false;
        const json = (await res.json()) as { expiresAt?: number | null };
        if (started !== epoch) return false;
        beginModeratorAccess(json.expiresAt ?? null);
        return true;
      } catch {
        return false;
      }
    },

    async signOut() {
      endModeratorAccess(); // clear private rows before any network round trip
      try {
        deps.storage?.setItem(MODERATOR_SIGNOUT_KEY, String(now()));
      } catch {
        /* ignore */
      }
      try {
        await deps.fetch("/api/moderator/session", { method: "DELETE" });
      } catch {
        /* offline: the cookie still expires on its own */
      }
    },

    async addReport(
      report: Omit<CommunityReport, "id" | "createdAt" | "updatedAt" | "status">,
    ): Promise<SubmitResult> {
      try {
        const res = await deps.fetch("/api/reports", {
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
            website: "", // honeypot: always empty from real clients
          }),
        });
        if (!res.ok) return "failed";
        if (snapshot.isModerator) void refresh();
        return "submitted";
      } catch {
        return "failed";
      }
    },

    async moderate(id: string, decision: { status: ReportStatus; reason: string }) {
      const started = epoch;
      if (!snapshot.isModerator) return;
      try {
        const res = await deps.fetch(`/api/reports/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: decision.status, moderation_reason: decision.reason }),
        });
        if (started !== epoch) return;
        if (res.status === 401) {
          endModeratorAccess();
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as { data: DbRow };
        if (started !== epoch || !snapshot.isModerator) return;
        const updated = rowToReport(json.data);
        set({
          reports: snapshot.reports.map((r) => (r.id === id ? updated : r)),
          isModerator: true,
        });
      } catch {
        /* offline */
      }
    },

    async remove(id: string) {
      const started = epoch;
      if (!snapshot.isModerator) return;
      try {
        const res = await deps.fetch(`/api/reports/${id}`, { method: "DELETE" });
        if (started !== epoch) return;
        if (res.status === 401) {
          endModeratorAccess();
          return;
        }
        if (!res.ok) return;
        set({ reports: snapshot.reports.filter((r) => r.id !== id), isModerator: true });
      } catch {
        /* offline */
      }
    },
  };
}

export type ReportsController = ReturnType<typeof createReportsController>;
