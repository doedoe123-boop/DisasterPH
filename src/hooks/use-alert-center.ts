"use client";

import { useEffect, useReducer } from "react";
import { evaluateAlertEngine } from "@/lib/alerts";
import {
  alertPassesPrefs,
  getNotificationPrefs,
  showAlertNotification,
} from "@/lib/notifications";
import type {
  AlertEvent,
  AlertSnapshot,
  Incident,
  PlaceRiskSummary,
} from "@/types/incident";

interface AlertCenterState {
  recentEvents: AlertEvent[];
  snapshots: Record<string, AlertSnapshot>;
}

type AlertCenterAction = {
  type: "reconcile";
  incidents: Incident[];
  placeRisks: PlaceRiskSummary[];
};

const STORAGE_KEY = "disasterph-alert-center";
const PUSH_DISPATCH_ENDPOINT = "/api/push/dispatch";

function dispatchWebPush(alert: AlertEvent): void {
  fetch(PUSH_DISPATCH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alert }),
  }).catch(() => {
    // Push dispatch is best-effort from the browser MVP path.
  });
}

function initState(): AlertCenterState {
  if (typeof window === "undefined") {
    return { recentEvents: [], snapshots: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { recentEvents: [], snapshots: {} };
    return JSON.parse(raw) as AlertCenterState;
  } catch {
    return { recentEvents: [], snapshots: {} };
  }
}

function reducer(
  state: AlertCenterState,
  action: AlertCenterAction,
): AlertCenterState {
  if (action.type !== "reconcile") return state;

  const result = evaluateAlertEngine(
    action.incidents,
    action.placeRisks,
    state.snapshots,
  );

  if (result.events.length === 0) {
    return {
      ...state,
      snapshots: result.snapshots,
    };
  }

  // Fire browser notifications for new events that pass prefs
  const prefs = getNotificationPrefs();
  for (const event of result.events) {
    if (alertPassesPrefs(event, prefs)) {
      showAlertNotification(event);
      if (prefs.webPushEnabled) {
        dispatchWebPush(event);
      }
    }
  }

  const merged = [...result.events, ...state.recentEvents].filter(
    (event, index, all) =>
      index ===
      all.findIndex((candidate) => candidate.dedupeKey === event.dedupeKey),
  );

  return {
    snapshots: result.snapshots,
    recentEvents: merged.slice(0, 12),
  };
}

export function useAlertCenter(
  incidents: Incident[],
  placeRisks: PlaceRiskSummary[],
) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => {
    dispatch({ type: "reconcile", incidents, placeRisks });
  }, [incidents, placeRisks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return {
    recentEvents: state.recentEvents,
    activeAlertCount: state.recentEvents.length,
  };
}
