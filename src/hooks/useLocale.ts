"use client";

import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from "react";
import {
  getLocale,
  setLocale as persistLocale,
  type Locale,
} from "@/lib/i18n";

function subscribe(callback: () => void) {
  window.addEventListener("localechange", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("localechange", callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * The language the server rendered the page in (from the locale cookie), so
 * server HTML and the first client render agree: a Filipino reader gets
 * Filipino text before any JavaScript runs.
 */
const ServerLocaleContext = createContext<Locale>("en");

export function ServerLocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return createElement(ServerLocaleContext.Provider, { value: locale }, children);
}

export function useLocale() {
  const serverLocale = useContext(ServerLocaleContext);
  const locale = useSyncExternalStore(subscribe, getLocale, () => serverLocale);

  return {
    locale,
    setLocale: persistLocale,
    isFilipino: locale === "fil",
  } as const;
}
