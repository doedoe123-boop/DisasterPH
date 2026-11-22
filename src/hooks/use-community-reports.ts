"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  createReportsController,
  type ReportsSnapshot,
} from "@/lib/community-reports-client";

export type { SubmitResult } from "@/lib/community-reports-client";

const SERVER_SNAPSHOT: ReportsSnapshot = { reports: [], isModerator: false };

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Community reports for the current visitor. Moderator data lives only in
 * memory while the moderator session is active and is cleared the moment it
 * ends; see src/lib/community-reports-client.ts.
 */
export function useCommunityReports() {
  const [controller] = useState(() =>
    createReportsController({
      fetch: (...args) => fetch(...args),
      storage: browserStorage(),
      addStorageListener: (fn) => {
        window.addEventListener("storage", fn);
        return () => window.removeEventListener("storage", fn);
      },
    }),
  );

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    () => SERVER_SNAPSHOT,
  );

  useEffect(() => {
    controller.start();
    return () => controller.stop();
  }, [controller]);

  return {
    reports: snapshot.reports,
    isModerator: snapshot.isModerator,
    addReport: controller.addReport,
    moderate: controller.moderate,
    removeReport: controller.remove,
    signInModerator: controller.signIn,
    signOutModerator: controller.signOut,
  } as const;
}
