"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, BellRing, ShieldCheck, X } from "lucide-react";
import {
  getPermissionState,
  notificationsSupported,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPrefs,
  saveNotificationPrefs,
} from "@/lib/notifications";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

type PermState = "prompt" | "granted" | "denied" | "unsupported" | "loading";

export function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  const i18n = t(locale);
  const [state, setState] = useState<PermState>("loading");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Resolve permission state on mount
  useEffect(() => {
    if (!notificationsSupported()) {
      setState("unsupported");
      return;
    }
    const perm = getPermissionState();
    if (perm === "unsupported") {
      setState("unsupported");
    } else if (perm === "granted") {
      // Browser says granted — check if user has actually enabled in our app
      const prefs = getNotificationPrefs();
      setState(prefs.enabled ? "granted" : "prompt");
    } else if (perm === "denied") {
      setState("denied");
    } else {
      // "default" → prompt
      setState("prompt");
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleDisable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const prefs = getNotificationPrefs();
      prefs.enabled = false;
      prefs.webPushEnabled = false;
      saveNotificationPrefs(prefs);
      await unsubscribeFromPush();
      setState("prompt");
      setOpen(false);
    } catch {
      setError(i18n.notification.disabledError);
    } finally {
      setBusy(false);
    }
  }, [i18n.notification.disabledError]);

  const handleEnable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const prefs = getNotificationPrefs();
      prefs.enabled = true;
      prefs.webPushEnabled = true;
      saveNotificationPrefs(prefs);

      if (pushSupported()) {
        await subscribeToPush(prefs);
      }
      setState("granted");
      setOpen(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : i18n.notification.enableError;
      if (msg.includes("permission")) {
        setState("denied");
        setError(i18n.notification.blockedError);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }, [i18n.notification.blockedError, i18n.notification.enableError]);

  // Don't render on unsupported browsers
  if (state === "unsupported" || state === "loading") return null;

  const isGranted = state === "granted";
  const isDenied = state === "denied";

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center rounded-full border transition ${
          compact ? "h-8 w-8" : "h-9 w-9"
        } ${
          isGranted
            ? "border-emerald-400/25 bg-emerald-400/8 text-emerald-400"
            : isDenied
              ? "border-red-400/25 bg-red-400/8 text-red-400"
              : "border-orange-400/30 bg-orange-400/12 text-orange-400 animate-pulse"
        }`}
        title={
          isGranted
            ? i18n.notification.bellEnabled
            : isDenied
              ? i18n.notification.bellBlocked
              : i18n.notification.bellPrompt
        }
      >
        {isGranted ? (
          <BellRing className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        ) : isDenied ? (
          <BellOff className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        ) : (
          <Bell className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2.5 origin-top-right overflow-hidden rounded-xl border border-overlay/12 bg-[var(--bg-panel)] shadow-[var(--shadow-elevated)] ${
              compact
                ? "right-[-3rem] w-[min(18rem,calc(100vw-1.5rem))] sm:right-0"
                : "right-0 w-72"
            }`}
          >
            <div className="p-4">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition"
              >
                <X className="h-4 w-4" />
              </button>

              {/* ── Granted state ── */}
              {isGranted && (
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/12">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {i18n.notification.enabledTitle}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
                      {i18n.notification.enabledBody}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisable}
                    disabled={busy}
                    className="w-full rounded-lg border border-overlay/12 py-2 text-[12px] font-medium text-[var(--text-muted)] transition hover:bg-overlay/6 hover:text-[var(--text-primary)] disabled:opacity-60"
                  >
                    {busy
                      ? i18n.notification.disabling
                      : i18n.notification.disable}
                  </button>
                </div>
              )}

              {/* ── Denied state ── */}
              {isDenied && (
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/12">
                    <BellOff className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {i18n.notification.blockedTitle}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
                      {i18n.notification.blockedBody}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--text-dim)]">
                      {i18n.notification.blockedIosHint}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Prompt state (default / not yet asked) ── */}
              {state === "prompt" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/12">
                      <Bell className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                        {i18n.notification.promptTitle}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
                        {i18n.notification.promptBody}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnable}
                    disabled={busy}
                    className="w-full rounded-lg bg-orange-500 py-2.5 text-[13px] font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                  >
                    {busy
                      ? i18n.notification.enabling
                      : i18n.notification.enable}
                  </button>
                  <p className="text-center text-[11px] text-[var(--text-dim)]">
                    {i18n.notification.permissionHint}
                  </p>
                </div>
              )}

              {/* Error banner */}
              {error && (
                <p className="mt-3 rounded-lg bg-red-500/10 p-2.5 text-[12px] text-red-400">
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
