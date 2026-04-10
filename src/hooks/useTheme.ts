"use client";

import { useSyncExternalStore } from "react";
import { getTheme, setTheme as persistTheme, type Theme } from "@/lib/theme";

function subscribe(callback: () => void) {
  window.addEventListener("themechange", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("themechange", callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerSnapshot(): Theme {
  return "night";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerSnapshot);

  return {
    theme,
    setTheme: persistTheme,
    isDay: theme === "day",
  } as const;
}
