export type Theme = "day" | "night";

export const THEME_KEY = "disasterph-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function normalizeTheme(value: string | null): Theme {
  return value === "day" || value === "night" ? value : "night";
}

function getCookieTheme(): Theme | null {
  if (typeof document === "undefined") return null;

  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${THEME_KEY}=`))
    ?.split("=")[1];

  return value === "day" || value === "night" ? value : null;
}

function setCookieTheme(t: Theme): void {
  document.cookie = `${THEME_KEY}=${t}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function applyTheme(t: Theme): void {
  document.documentElement.setAttribute("data-theme", t);
  document.documentElement.style.colorScheme = t === "day" ? "light" : "dark";
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return "night";

  return normalizeTheme(
    document.documentElement.dataset.theme ??
      window.localStorage.getItem(THEME_KEY) ??
      getCookieTheme() ??
      "night",
  );
}

export function setTheme(t: Theme): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(THEME_KEY, t);
  setCookieTheme(t);
  applyTheme(t);
  window.dispatchEvent(
    new CustomEvent("themechange", { detail: { theme: t } }),
  );
}
