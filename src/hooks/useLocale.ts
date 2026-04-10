"use client";

import { useSyncExternalStore } from "react";
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

function getServerSnapshot(): Locale {
  return "en";
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getLocale, getServerSnapshot);

  return {
    locale,
    setLocale: persistLocale,
    isFilipino: locale === "fil",
  } as const;
}
