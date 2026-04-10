"use client";

import { useCallback, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  type NotificationPrefs,
  getNotificationPrefs,
  saveNotificationPrefs,
  getPermissionState,
  notificationsSupported,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getVapidPublicKey,
} from "@/lib/notifications";
import { estimateRegion } from "@/lib/ingest/regions";
import { useSavedPlaces } from "@/hooks/use-saved-places";

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(getPermissionState);
  const [pushError, setPushError] = useState("");
  const [isSavingPush, setIsSavingPush] = useState(false);
  const { places } = useSavedPlaces();

  const savedPlaceRegions = Array.from(
    new Set(places.map((place) => estimateRegion(place.latitude, place.longitude))),
  ).sort();

  const update = useCallback((patch: Partial<NotificationPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveNotificationPrefs(next);
      return next;
    });
  }, []);

  const handleEnable = useCallback(async () => {
    setPushError("");

    const nextPrefs = {
      ...prefs,
      enabled: true,
      webPushEnabled: true,
      regions:
        prefs.regions.length > 0
          ? prefs.regions
          : savedPlaceRegions.length > 0
            ? savedPlaceRegions
            : prefs.regions,
    };

    if (!getVapidPublicKey()) {
      setPushError("Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to enable closed-tab push.");
      update({ enabled: true, webPushEnabled: false });
      return;
    }

    try {
      setIsSavingPush(true);
      await subscribeToPush(nextPrefs);
      setPermission(getPermissionState());
      update(nextPrefs);
    } catch (error) {
      setPermission(getPermissionState());
      setPushError(
        error instanceof Error
          ? error.message
          : "Could not enable push alerts.",
      );
    } finally {
      setIsSavingPush(false);
    }
  }, [prefs, savedPlaceRegions, update]);

  const handleDisable = useCallback(async () => {
    setPushError("");
    try {
      setIsSavingPush(true);
      await unsubscribeFromPush();
    } catch {
      // If the browser subscription is already gone, still disable local prefs.
    } finally {
      setIsSavingPush(false);
      update({ enabled: false, webPushEnabled: false });
    }
  }, [update]);

  if (!notificationsSupported()) return null;

  const isPushCapable = pushSupported();
  const isActive = prefs.enabled && permission === "granted";
  const isWebPushActive = isActive && prefs.webPushEnabled;

  return (
    <section className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)]">
      <div className="flex items-center justify-between border-b border-overlay/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Notifications
        </span>
        {isActive ? (
          <BellRing className="h-3.5 w-3.5 text-cyan-400" />
        ) : (
          <BellOff className="h-3.5 w-3.5 text-[var(--text-dim)]" />
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Master toggle */}
        {permission === "denied" ? (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/8 px-2.5 py-2">
            <p className="text-[11px] font-medium text-amber-300">
              Notifications blocked
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-amber-300/60">
              Enable notifications in your browser settings for this site.
            </p>
          </div>
        ) : !isActive ? (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/8 px-3 py-2 text-[12px] font-medium text-cyan-300 transition hover:bg-cyan-400/15"
            disabled={isSavingPush}
            onClick={handleEnable}
            type="button"
          >
            <Bell className="h-3.5 w-3.5" />
            {isSavingPush ? "Enabling alerts..." : "Enable regional push alerts"}
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-primary)]">
              {isWebPushActive ? "Web push active" : "In-app alerts active"}
            </span>
            <button
              className="text-[10px] text-[var(--text-dim)] hover:text-red-300 transition"
              disabled={isSavingPush}
              onClick={handleDisable}
              type="button"
            >
              Disable
            </button>
          </div>
        )}

        {!isPushCapable && (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/8 px-2.5 py-2">
            <p className="text-[11px] font-medium text-amber-300">
              Web Push is not supported in this browser.
            </p>
          </div>
        )}

        {pushError && (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/8 px-2.5 py-2">
            <p className="text-[11px] leading-4 text-amber-300">{pushError}</p>
          </div>
        )}

        {/* Preference toggles — only shown when active */}
        {isActive && (
          <div className="space-y-2 border-t border-overlay/6 pt-2.5">
            {/* Severity threshold */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)] mb-1.5">
                Alert threshold
              </p>
              <div className="flex gap-1.5">
                <button
                  className={`flex-1 rounded border px-2 py-1 text-[11px] font-medium transition ${
                    prefs.minSeverity === "warning"
                      ? "border-orange-400/40 bg-orange-400/15 text-orange-300"
                      : "border-overlay/8 bg-overlay/[0.03] text-[var(--text-dim)] hover:bg-overlay/[0.06]"
                  }`}
                  onClick={() => update({ minSeverity: "warning" })}
                  type="button"
                >
                  Warning+
                </button>
                <button
                  className={`flex-1 rounded border px-2 py-1 text-[11px] font-medium transition ${
                    prefs.minSeverity === "critical"
                      ? "border-red-400/40 bg-red-400/15 text-red-300"
                      : "border-overlay/8 bg-overlay/[0.03] text-[var(--text-dim)] hover:bg-overlay/[0.06]"
                  }`}
                  onClick={() => update({ minSeverity: "critical" })}
                  type="button"
                >
                  Critical only
                </button>
              </div>
            </div>

            {/* Toggle: escalations */}
            <ToggleRow
              label="Severity escalations"
              checked={prefs.escalations}
              onChange={(v) => update({ escalations: v })}
            />

            {/* Toggle: new place impacts */}
            <ToggleRow
              label="New place impacts"
              checked={prefs.newPlaceImpacts}
              onChange={(v) => update({ newPlaceImpacts: v })}
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  Regions
                </p>
                {savedPlaceRegions.length > 0 && (
                  <button
                    className="text-[10px] text-cyan-300 transition hover:text-cyan-200"
                    onClick={() => update({ regions: savedPlaceRegions })}
                    type="button"
                  >
                    Use saved places
                  </button>
                )}
              </div>
              {prefs.regions.length === 0 ? (
                <p className="rounded border border-overlay/8 bg-overlay/[0.03] px-2 py-1.5 text-[11px] leading-4 text-[var(--text-dim)]">
                  All regions are allowed until you sync saved-place regions.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {prefs.regions.map((region) => (
                    <span
                      key={region}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-2 py-0.5 text-[10px] font-medium text-cyan-300"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between py-0.5 text-left"
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
      <span
        className={`flex h-4 w-7 items-center rounded-full transition ${
          checked ? "bg-cyan-400/40" : "bg-overlay/10"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full transition-transform ${
            checked
              ? "translate-x-3.5 bg-cyan-300"
              : "translate-x-0.5 bg-overlay/40"
          }`}
        />
      </span>
    </button>
  );
}
