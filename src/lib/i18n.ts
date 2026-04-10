import type {
  IncidentEventType,
  IncidentSeverity,
  ReportCategory,
} from "@/types/incident";

export type Locale = "en" | "fil";

export const LOCALE_KEY = "disasterph-locale";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "fil" || value === "en" ? value : "en";
}

function getCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;

  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_KEY}=`))
    ?.split("=")[1];

  return value === "fil" || value === "en" ? value : null;
}

function setCookieLocale(locale: Locale): void {
  document.cookie = `${LOCALE_KEY}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function getLocale(): Locale {
  if (typeof window === "undefined") return "en";

  return normalizeLocale(
    window.localStorage.getItem(LOCALE_KEY) ??
      getCookieLocale() ??
      document.documentElement.dataset.locale ??
      "en",
  );
}

export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(LOCALE_KEY, locale);
  setCookieLocale(locale);
  document.documentElement.setAttribute("data-locale", locale);
  window.dispatchEvent(
    new CustomEvent("localechange", { detail: { locale } }),
  );
}

export const copy = {
  en: {
    nav: {
      live: "Live",
      liveSub: "Live Monitoring",
      pulse: "Pulse",
      pulseSub: "Alert Feed",
      sanctuary: "Sanctuary",
      sanctuarySub: "Shelters",
      commandCenter: "National Command Center",
      language: "Language",
    },
    common: {
      active: "Active",
      critical: "Critical",
      sources: "Sources",
      all: "All",
      feed: "Feed",
      events: "events",
      event: "event",
      searchEvents: "Search events...",
      loadingEvents: "Loading events...",
      loadingDetails: "Loading incident details...",
      noSignals: "No active signals",
      noFilterMatches: "No incidents match the current filter.",
      noEventsMatch: "No events match your current filters.",
      offlineShowingCached: "Offline — showing cached data",
      whatThisMeans: "What this means",
      whatToDo: "What to do",
      whatToDoNow: "What To Do Now",
      actionSubtitle:
        "Short, practical steps based on the current hazard and severity.",
      back: "Back",
      backToPulse: "Back to Pulse Feed",
      share: "Share",
      copyLink: "Copy link",
      copied: "Copied!",
      postToX: "Post to X",
      shareFacebook: "Share on Facebook",
      officialBulletin: "Official Bulletin",
      viewSourceAt: "View source at",
      emergencyContacts: "Emergency Contacts",
      technicalData: "Technical Data",
      dataConfidence: "Data Confidence",
      affectedAreas: "Affected Areas",
      eventNotFound: "Event Not Found",
      expiredIncident: "This incident may have expired or is no longer active.",
      noDescription: "No detailed description available for this event.",
      viewFullDetail: "View full detail",
    },
    severity: {
      advisory: "Info",
      watch: "Watch",
      warning: "Warning",
      critical: "Critical",
    },
    eventType: {
      earthquake: "Earthquake",
      typhoon: "Typhoon",
      flood: "Flood",
      volcano: "Volcano",
      landslide: "Landslide",
      wildfire: "Wildfire",
    },
    prepUrgency: {
      now: "Do Now",
      soon: "Prepare",
      general: "Know",
    },
  },
  fil: {
    nav: {
      live: "Bantay",
      liveSub: "Live na Bantay",
      pulse: "Abiso",
      pulseSub: "Alert Feed",
      sanctuary: "Silungan",
      sanctuarySub: "Evacuation Centers",
      commandCenter: "Pambansang Bantay-Sakuna",
      language: "Wika",
    },
    common: {
      active: "Aktibo",
      critical: "Kritikal",
      sources: "Sources",
      all: "Lahat",
      feed: "Feed",
      events: "kaganapan",
      event: "kaganapan",
      searchEvents: "Maghanap ng abiso...",
      loadingEvents: "Kinukuha ang mga abiso...",
      loadingDetails: "Kinukuha ang detalye ng abiso...",
      noSignals: "Walang aktibong abiso",
      noFilterMatches: "Walang tumugmang abiso sa filter.",
      noEventsMatch: "Walang tumugmang kaganapan sa filter.",
      offlineShowingCached: "Offline — huling naka-save na datos ang ipinapakita",
      whatThisMeans: "Ano ang ibig sabihin nito",
      whatToDo: "Ano ang gagawin",
      whatToDoNow: "Gawin Ngayon",
      actionSubtitle:
        "Maiikling hakbang batay sa uri at tindi ng panganib.",
      back: "Bumalik",
      backToPulse: "Bumalik sa Abiso",
      share: "Ibahagi",
      copyLink: "Kopyahin ang link",
      copied: "Nakopya!",
      postToX: "I-post sa X",
      shareFacebook: "Ibahagi sa Facebook",
      officialBulletin: "Opisyal na Bulletin",
      viewSourceAt: "Tingnan ang source sa",
      emergencyContacts: "Emergency Contacts",
      technicalData: "Teknikal na Datos",
      dataConfidence: "Tiwala sa Datos",
      affectedAreas: "Mga Apektadong Lugar",
      eventNotFound: "Hindi Nahanap ang Abiso",
      expiredIncident: "Maaaring tapos na o hindi na aktibo ang abisong ito.",
      noDescription: "Walang detalyadong paliwanag para sa abisong ito.",
      viewFullDetail: "Tingnan ang buong detalye",
    },
    severity: {
      advisory: "Info",
      watch: "Bantayan",
      warning: "Babala",
      critical: "Kritikal",
    },
    eventType: {
      earthquake: "Lindol",
      typhoon: "Bagyo",
      flood: "Baha",
      volcano: "Bulkan",
      landslide: "Pagguho",
      wildfire: "Sunog sa Gubat",
    },
    prepUrgency: {
      now: "Gawin Ngayon",
      soon: "Maghanda",
      general: "Tandaan",
    },
  },
} as const;

export function t(locale: Locale) {
  return copy[locale];
}

export function eventLabel(
  eventType: IncidentEventType,
  locale: Locale,
): string {
  return copy[locale].eventType[eventType] ?? eventType;
}

export function severityText(
  severity: IncidentSeverity,
  locale: Locale,
): string {
  return copy[locale].severity[severity] ?? severity;
}

export function reportCategoryLabel(
  category: ReportCategory,
  locale: Locale,
): string {
  if (locale === "en") return category.replaceAll("_", " ");

  const labels: Partial<Record<ReportCategory, string>> = {
    blocked_road: "Saradong Daan",
    flooding: "Baha",
    landslide: "Pagguho",
    power_outage: "Walang Kuryente",
    evacuation: "Evacuation",
    damage: "Pinsala",
    other: "Iba pa",
  };

  return labels[category] ?? category.replaceAll("_", " ");
}
