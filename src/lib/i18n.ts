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
      healthy: "Healthy",
      delayed: "Delayed",
      degraded: "Degraded",
      unavailable: "Unavailable",
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
      nearbyIncidents: "Nearby incidents",
      nearestHazard: "Nearest hazard",
      strongestNearby: "Strongest nearby",
      lastNearbyUpdate: "Last nearby update",
      more: "more",
      eventNotFound: "Event Not Found",
      expiredIncident: "This incident may have expired or is no longer active.",
      noDescription: "No detailed description available for this event.",
      viewFullDetail: "View full detail",
    },
    notification: {
      enabledTitle: "Alerts active",
      enabledBody:
        "You'll be notified about critical and warning-level disasters in your region.",
      disable: "Turn off alerts",
      disabledError: "Could not disable alerts.",
      enableError: "Could not enable alerts.",
      blockedError:
        "Notifications were blocked. Please enable them in your browser settings.",
      blockedTitle: "Notifications blocked",
      blockedBody:
        "To receive disaster alerts, allow notifications for this site in your browser settings.",
      blockedIosHint: "On iPhone, add this site to your Home Screen first.",
      promptTitle: "Get disaster alerts",
      promptBody:
        "Receive instant push notifications when a critical disaster impacts your region — even when this tab is closed.",
      enable: "Enable push alerts",
      enabling: "Enabling…",
      disabling: "Disabling…",
      permissionHint:
        "Your browser will ask for permission. You can change this anytime.",
      bellEnabled: "Alert notifications enabled",
      bellBlocked: "Notifications blocked",
      bellPrompt: "Enable disaster alerts",
    },
    risk: {
      summary: "Risk Summary",
      headlines: {
        safe: "Area looks clear",
        monitor: "Monitoring activity nearby",
        "at-risk": "Hazards detected near this area",
        danger: "Immediate threat detected",
      },
      descriptions: {
        safe: "No significant hazards detected within 100 km of this location.",
        monitor: "Some activity detected nearby. Stay aware and monitor updates.",
        "at-risk":
          "Active hazards are within range. Review incidents below and prepare accordingly.",
        danger:
          "A critical-level event is very close. Check if evacuation is needed.",
      },
    },
    help: {
      title: "Help & Safety",
      copied: "Copied!",
      actionType: {
        call: "Call",
        link: "Open",
        share: "Share",
        copy: "Copy",
      },
      actions: {
        ndrrmc: {
          label: "Call NDRRMC",
          description: "National disaster hotline",
        },
        redCross: {
          label: "Red Cross PH",
          description: "143 emergency line",
        },
        pagasaAdvisory: {
          label: "PAGASA Advisories",
          description: "Official weather bulletins",
        },
        windSignalMap: {
          label: "Wind Signal Map",
          description: "Tropical cyclone wind signals",
        },
        rainfallAdvisory: {
          label: "Rainfall Advisory",
          description: "Hourly rainfall monitoring",
        },
        phivolcsBulletin: {
          label: "PHIVOLCS Bulletin",
          descriptionEarthquake: "Earthquake information",
          descriptionVolcano: "Volcano bulletin",
        },
        shareIncident: {
          label: "Share Incident",
          description: "Send hazard info to contacts",
        },
        copySummary: {
          label: "Copy Summary",
          description: "Copy incident details",
        },
        safetyTips: {
          label: "Safety Tips",
          typhoon: "Typhoon preparedness steps",
          flood: "Flood safety guidelines",
          earthquake: "Earthquake safety: Drop, Cover, Hold",
          volcano: "Volcanic hazard precautions",
          landslide: "Landslide awareness tips",
          wildfire: "Wildfire evacuation guidance",
          default: "General safety preparedness",
        },
        pagasa: {
          label: "PAGASA",
          description: "Weather forecasts & warnings",
        },
        phivolcs: {
          label: "PHIVOLCS",
          description: "Earthquake & volcano monitoring",
        },
      },
    },
    shelters: {
      title: "Sanctuary",
      subtitle: "Shelter Operations",
      searchPlaceholder: "Search shelters...",
      filters: {
        all: "All",
        open: "Open",
        full: "Full",
        standby: "Standby",
        closed: "Closed",
      },
      tabs: {
        overview: "Overview",
        guests: "Guest List",
        notices: "Notice Board",
      },
      tabsMobile: {
        overview: "Overview",
        guests: "Guests",
        notices: "Notices",
      },
      labels: {
        managingOffice: "Managing Office",
        hotline: "Hotline",
        services: "Services",
        capacity: "Capacity",
        current: "Current",
        available: "Available",
        maxCapacity: "Max Capacity",
        viewingDetails: "Viewing details",
        facilityOverview: "Facility Overview",
        occupancyBreakdown: "Occupancy Breakdown",
        evacuationCenter: "Evacuation Center",
        open: "Open",
        full: "Full",
        standby: "Standby",
        closed: "Closed",
        searchGuest: "Search guest name...",
      },
      amenities: {
        WiFi: "WiFi",
        water: "Water",
        food: "Food",
        medical: "Medical",
        electricity: "Power",
      },
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
      sources: "Mga Pinagmulan",
      healthy: "Maayos",
      delayed: "Naantala",
      degraded: "Mahina",
      unavailable: "Hindi available",
      all: "Lahat",
      feed: "Daloy",
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
      emergencyContacts: "Mga Emergency Contact",
      technicalData: "Teknikal na Datos",
      dataConfidence: "Tiwala sa Datos",
      affectedAreas: "Mga Apektadong Lugar",
      nearbyIncidents: "Mga kalapit na insidente",
      nearestHazard: "Pinakamalapit na panganib",
      strongestNearby: "Pinakamalakas sa paligid",
      lastNearbyUpdate: "Huling update sa paligid",
      more: "pa",
      eventNotFound: "Hindi Nahanap ang Abiso",
      expiredIncident: "Maaaring tapos na o hindi na aktibo ang abisong ito.",
      noDescription: "Walang detalyadong paliwanag para sa abisong ito.",
      viewFullDetail: "Tingnan ang buong detalye",
    },
    notification: {
      enabledTitle: "Aktibo ang mga alerto",
      enabledBody:
        "Makakatanggap ka ng abiso para sa kritikal at warning-level na sakuna sa iyong rehiyon.",
      disable: "Patayin ang mga alerto",
      disabledError: "Hindi mapatay ang mga alerto.",
      enableError: "Hindi ma-activate ang mga alerto.",
      blockedError:
        "Na-block ang notifications. Pakibuksan ito sa browser settings.",
      blockedTitle: "Naka-block ang notifications",
      blockedBody:
        "Para makatanggap ng alerto sa sakuna, payagan ang notifications para sa site na ito sa iyong browser settings.",
      blockedIosHint:
        "Sa iPhone, idagdag muna ang site na ito sa Home Screen.",
      promptTitle: "Tumanggap ng alerto sa sakuna",
      promptBody:
        "Makakatanggap ng push notification kapag may kritikal na sakunang tumama sa iyong rehiyon kahit sarado ang tab na ito.",
      enable: "Buksan ang push alerts",
      enabling: "Binubuksan…",
      disabling: "Pinapatay…",
      permissionHint:
        "Hihingi ng pahintulot ang browser mo. Maaari mo itong baguhin anumang oras.",
      bellEnabled: "Aktibo ang alert notifications",
      bellBlocked: "Naka-block ang notifications",
      bellPrompt: "Buksan ang disaster alerts",
    },
    risk: {
      summary: "Buod ng Panganib",
      headlines: {
        safe: "Mukhang ligtas ang lugar",
        monitor: "May minomonitor na kilos sa malapit",
        "at-risk": "May panganib malapit sa lugar na ito",
        danger: "May agarang banta",
      },
      descriptions: {
        safe: "Walang malaking panganib na natukoy sa loob ng 100 km mula sa lokasyong ito.",
        monitor: "May aktibidad sa paligid. Manatiling handa at bantayan ang mga update.",
        "at-risk":
          "May aktibong panganib sa abot ng lugar na ito. Suriin ang mga insidente sa ibaba at maghanda.",
        danger:
          "Napakalapit ng isang kritikal na pangyayari. Suriin kung kailangan ng paglikas.",
      },
    },
    help: {
      title: "Tulong at Kaligtasan",
      copied: "Nakopya!",
      actionType: {
        call: "Tawag",
        link: "Buksan",
        share: "Ibahagi",
        copy: "Kopya",
      },
      actions: {
        ndrrmc: {
          label: "Tawagan ang NDRRMC",
          description: "Pambansang hotline sa sakuna",
        },
        redCross: {
          label: "Red Cross PH",
          description: "143 emergency line",
        },
        pagasaAdvisory: {
          label: "PAGASA Advisories",
          description: "Opisyal na bulletin sa panahon",
        },
        windSignalMap: {
          label: "Mapa ng Wind Signal",
          description: "Mga signal ng malakas na hangin",
        },
        rainfallAdvisory: {
          label: "Rainfall Advisory",
          description: "Oras-oras na pagbantay sa ulan",
        },
        phivolcsBulletin: {
          label: "PHIVOLCS Bulletin",
          descriptionEarthquake: "Impormasyon sa lindol",
          descriptionVolcano: "Bulletin sa bulkan",
        },
        shareIncident: {
          label: "Ibahagi ang Insidente",
          description: "Ipadala ang hazard info sa mga contact",
        },
        copySummary: {
          label: "Kopyahin ang Buod",
          description: "Kopyahin ang detalye ng insidente",
        },
        safetyTips: {
          label: "Mga Safety Tip",
          typhoon: "Mga hakbang sa paghahanda sa bagyo",
          flood: "Mga gabay sa kaligtasan sa baha",
          earthquake: "Kaligtasan sa lindol: Duck, Cover, Hold",
          volcano: "Pag-iingat sa panganib ng bulkan",
          landslide: "Mga paalala laban sa pagguho",
          wildfire: "Gabay sa paglikas sa sunog sa gubat",
          default: "Pangkalahatang paghahanda sa kaligtasan",
        },
        pagasa: {
          label: "PAGASA",
          description: "Mga forecast at babala sa panahon",
        },
        phivolcs: {
          label: "PHIVOLCS",
          description: "Pagbabantay sa lindol at bulkan",
        },
      },
    },
    shelters: {
      title: "Silungan",
      subtitle: "Operasyon ng Silungan",
      searchPlaceholder: "Maghanap ng silungan...",
      filters: {
        all: "Lahat",
        open: "Bukas",
        full: "Puno",
        standby: "Handa",
        closed: "Sarado",
      },
      tabs: {
        overview: "Buod",
        guests: "Listahan ng Nandoon",
        notices: "Mga Abiso",
      },
      tabsMobile: {
        overview: "Buod",
        guests: "Tao",
        notices: "Abiso",
      },
      labels: {
        managingOffice: "Namamahalang Opisina",
        hotline: "Hotline",
        services: "Serbisyo",
        capacity: "Kapasidad",
        current: "Kasalukuyan",
        available: "Bakasante",
        maxCapacity: "Pinakamataas na Kapasidad",
        viewingDetails: "Tinitingnan ang detalye",
        facilityOverview: "Buod ng Pasilidad",
        occupancyBreakdown: "Hati ng Okupado",
        evacuationCenter: "Evacuation Center",
        open: "Bukas",
        full: "Puno",
        standby: "Handa",
        closed: "Sarado",
        searchGuest: "Hanapin ang pangalan ng tao...",
      },
      amenities: {
        WiFi: "WiFi",
        water: "Tubig",
        food: "Pagkain",
        medical: "Medikal",
        electricity: "Kuryente",
      },
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
