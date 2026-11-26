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
      live: "Map",
      pulse: "Alerts",
      sanctuary: "Evacuation centers",
      sanctuaryShort: "Evacuation",
      commandCenter: "Disaster information for the Philippines",
      language: "Language",
      liveBadge: "Live",
      call911: "911",
      call911Label: "Call 911 for emergencies",
      recentEvents: "Recent events",
    },
    area: {
      label: "Your area",
      all: "All of the Philippines",
      savedPlaces: "Saved places",
      regions: "Regions",
      useLocation: "Use my location",
      locating: "Finding your region…",
      locationNote: "Your location is only used to pick a region and is not stored.",
      locationDenied: "Location permission was not given. Choose your area from the list.",
      locationUnavailable: "Your location could not be determined. Choose your area from the list.",
      locationOffshore: "Your location is not within a Philippine region. Choose your area from the list.",
      summaryOne: "{n} recent event in or near {area}",
      summaryMany: "{n} recent events in or near {area}",
      summaryWarning: "{n} at warning level or higher",
      summaryNone: "No recent events from DisasterPH's sources in or near {area} in the last 10 days.",
      summaryCaveat: "This is not an official all-clear. Follow PAGASA, PHIVOLCS, and your local DRRMO.",
      summaryPlaceOne: "{n} recent event near {area}",
      summaryPlaceMany: "{n} recent events near {area}",
      summaryPlaceNone: "No recent events from DisasterPH's sources near {area} in the last 10 days.",
      placeCaveat: "This shows events near the place, not whether the people there are okay.",
    },
    controls: {
      switchToNight: "Switch to night mode",
      switchToDay: "Switch to day mode",
      switchLanguage: "Switch to Filipino",
      openFullMap: "Open full map",
      exitFullMap: "Exit full map",
      focusMode: "Focus mode (F)",
      exitFocusMode: "Exit focus mode (Esc)",
      expandSidebar: "Expand sidebar",
      collapseSidebar: "Collapse sidebar",
      closeSidebar: "Close sidebar",
      closeFeed: "Close feed",
      showFeed: "Show feed",
      showFeedTitle: "Show incident feed",
      initializingMap: "Initializing map view…",
    },
    common: {
      active: "Active",
      critical: "Critical",
      sources: "Sources",
      recent: "Recent",
      warningPlus: "Warning+",
      sourcesHealthy: "Sources OK",
      showingOf: "showing {shown} of {total}",
      showMore: "Show {n} more",
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
      emergencyContacts: "Emergency Contacts",
      technicalData: "Technical Data",
      source: {
        heading: "Source",
        publishedBy: "Data from",
        publishers: {
          PHIVOLCS: "PHIVOLCS earthquake information",
          PHIVOLCS_VOLCANO: "PHIVOLCS volcano bulletin",
          USGS: "USGS earthquake catalogue",
          PAGASA: "PAGASA",
          NASA_EONET: "NASA EONET",
          OTHER: "Other source",
        },
        updated: "Last updated by source",
        record: "View this event's source record",
        usgsNote:
          "Shown from the USGS catalogue because PHIVOLCS could not be reached. For official Philippine earthquake information, see PHIVOLCS.",
        referenceOnly:
          "Reference only. This is not an official Philippine advisory.",
        agencyLink: "Official information from",
      },
      affectedAreas: "Areas named in the bulletin",
      nearbyIncidents: "Nearby incidents",
      nearestHazard: "Nearest hazard",
      strongestNearby: "Strongest nearby",
      lastNearbyUpdate: "Last nearby update",
      more: "more",
      eventNotFound: "Event Not Found",
      expiredIncident: "This incident may have expired or is no longer active.",
      noDescription: "No detailed description available for this event.",
      viewFullDetail: "View full detail",
      mapPopup: {
        openInMaps: "Open in Google Maps",
      },
      noneActive: "None active",
      mapFilters: {
        rangeLabel: "Earthquakes from the last",
        ranges: { "1h": "1h", "6h": "6h", "24h": "24h", "48h": "48h", "7d": "7d" },
        rangeNames: { "1h": "hour", "6h": "6 hours", "24h": "24 hours", "48h": "48 hours", "7d": "7 days" },
        layers: "Layers",
        layersTitle: "Map layers",
        layerNames: { earthquake: "Earthquakes", volcano: "Volcanoes", typhoon: "Tropical cyclones", other: "Other (NASA EONET)" },
        includeSmall: "Include smaller earthquakes (M3.0 to 3.4)",
        about: "About {layer}",
        info: { source: "Source", updates: "Updates", limits: "Limits", ours: "Computed by DisasterPH" },
        close: "Close",
        filterNote: "Earthquakes: last {range}, {mag}",
        magDefault: "M3.5 and up",
        magAll: "M3.0 and up",
      },
      statusStrip: {
        label: "Nationwide, official data",
        volcanoNamed: "{name} at Alert Level {n}",
        volcanoLevelOne: "{n} at Alert Level 1",
        volcanoUnknown: "Volcano levels unavailable",
        quakesMany: "{n} earthquakes M4.0+ in the last 24 h",
        quakesOne: "1 earthquake M4.0+ in the last 24 h",
        quakesNone: "No earthquakes M4.0+ in the last 24 h",
        quakesUnknown: "Earthquake data unavailable",
        cyclone: "Tropical cyclone {name}: Signal No. {n}",
        cycloneNoSignal: "Tropical cyclone {name}: no wind signal raised",
        noCyclone: "No active tropical cyclone",
        cycloneUnknown: "PAGASA unavailable",
      },
      eventSheet: {
        one: "1 event, newest first",
        many: "{n} events, newest first",
        none: "No events for this filter",
        show: "Show list",
        hide: "Hide list",
        all: "See all {n} on the alert list",
      },
      sourcesLine: {
        checking: "Sources: checking…",
        count: "Sources: {live} of {total} live",
        updated: "updated {age}",
        problem: "{name} {state}, last update {age}",
        problemNever: "{name} {state}, no data yet",
        usgsBackup: "USGS backup in use for earthquakes",
        offline: "Sources: can't be checked while offline (last checked {age})",
        offlineNever: "Sources: can't be checked while offline",
        names: {
          PHIVOLCS: "PHIVOLCS earthquakes",
          PHIVOLCS_VOLCANO: "PHIVOLCS volcanoes",
          PAGASA: "PAGASA",
          EONET: "NASA EONET",
          USGS: "USGS",
        },
        states: { delayed: "delayed", degraded: "having problems", unavailable: "not reached yet" },
      },
      legend: {
        title: "Legend",
        earthquake: "Earthquake: size and number = magnitude",
        cluster: "Nearby earthquakes: how many, and the largest (tap to zoom in)",
        clusterMax: "max",
        volcano: "Volcano: PHIVOLCS alert level (number)",
        volcanoLevels: "Alert levels 1 to 5",
        typhoon: "Tropical cyclone: highest wind signal",
        ringTitle: "Earthquake ring colour = severity",
        age: "Fainter earthquake = older (solid = last hour)",
        levelsTitle: "Info, Watch, Warning, Critical are DisasterPH's own labels:",
        levelDefs: {
          advisory: "below M4.0 · Alert Level 1",
          watch: "M4.0 to 4.9 · Alert Level 2 · Signal No. 1",
          warning: "M5.0 to 6.4 · Alert Level 3 · Signal No. 2",
          critical: "M6.5+ · Alert Level 4 to 5 · Signal No. 3+",
        },
        official: "Official: magnitudes, PHIVOLCS alert levels and PAGASA wind signals.",
        dangerZone: "Volcano danger zone (radius from PHIVOLCS)",
        track: "Storm track (NASA EONET); dashed = forecast",
        note: "Tap a marker for details. Severity is also written in each popup and list item.",
      },
      tsunami: {
        pointer: "DisasterPH doesn't show tsunami warnings. This earthquake's magnitude and depth are in the range where PHIVOLCS may issue a tsunami advisory or warning.",
        link: "Check PHIVOLCS Tsunami Information",
      },
      quake: {
        heading: "PHIVOLCS earthquake bulletin",
        bulletinNo: "Earthquake Information No. {no}",
        issued: "Issued {time}",
        damage: "Damage expected",
        aftershocks: "Aftershocks expected",
        yes: "Yes",
        no: "No",
        unknown: "Not stated",
        origin: "Origin",
        reported: "Felt intensities (reported by people)",
        instrumental: "Measured intensities (PHIVOLCS instruments)",
        noIntensities: "This bulletin lists no places where the earthquake was felt.",
        intensity: "Intensity {n}",
        scale: ["", "Scarcely perceptible", "Slightly felt", "Weak", "Moderately strong", "Strong", "Very strong", "Destructive", "Very destructive", "Devastating", "Completely devastating"],
        scaleNote: "PHIVOLCS Earthquake Intensity Scale (PEIS), I to X.",
        mapAlt: "PHIVOLCS epicentre map: red dot marks where this earthquake started",
        mapCredit: "Map: PHIVOLCS",
        mapOpen: "Open full-size map",
        unavailable: "DisasterPH couldn't read the PHIVOLCS bulletin for this earthquake right now. Open it on the PHIVOLCS site.",
        readBulletin: "Read the full bulletin",
      },
      volcano: {
        heading: "PHIVOLCS volcano bulletin",
        bulletinDate: "Bulletin of {date}",
        stale: "This is the latest bulletin DisasterPH could read, from {date}. Check PHIVOLCS for newer advisories.",
        mismatch: "PHIVOLCS's current alert level differs from this bulletin. Check PHIVOLCS for the latest advisory.",
        notAllowed: "Should not be allowed",
        hazards: "Possible hazards",
        monitoring: "Monitoring (past 24 hours)",
        params: {
          Seismicity: "Seismicity",
          "Sulfur Dioxide Flux": "Sulfur dioxide flux",
          Plume: "Plume",
          "Ground Deformation": "Ground deformation",
        },
        readBulletin: "Read the full bulletin",
        alertLevel: "Alert Level",
      },
      typhoon: {
        heading: "PAGASA tropical cyclone bulletin",
        bulletinNo: "Bulletin #{no}",
        issued: "Issued {time}",
        stale: "This is the latest bulletin DisasterPH could read, issued {time}. PAGASA may have issued newer bulletins.",
        position: "Position",
        movement: "Movement",
        strength: "Strength",
        signals: "Wind signals",
        signalNo: "Wind Signal No. {n}",
        noSignals: "No wind signals are raised in this bulletin.",
        luzon: "Luzon",
        visayas: "Visayas",
        mindanao: "Mindanao",
        whatToDo: "What to do (PAGASA, Signal No. {n})",
        precautions: "Precautions (PAGASA, Signal No. {n})",
        forecast: "Forecast positions (PAGASA)",
        officialBulletin: "Official bulletin",
        pdf: "Bulletin (PDF)",
        trackMap: "Track map",
        signalMap: "Wind signal map",
      },
    },
    hazardEmpty: {
      typhoonNone:
        "No active tropical cyclone in the Philippine Area of Responsibility, according to PAGASA's bulletin page (checked {time}).",
      typhoonActive:
        "PAGASA has an active tropical cyclone bulletin, but DisasterPH could not read it. Read the official bulletin.",
      typhoonUnknown:
        "Tropical cyclone status from PAGASA is not available right now. Check the official bulletin.",
      floodNotCovered:
        "DisasterPH does not show PAGASA flood advisories yet. Check PAGASA's flood information.",
      volcanoNone:
        "Every volcano PHIVOLCS monitors is at Alert Level 0 (normal), according to PHIVOLCS (checked {time}).",
      volcanoUnknown:
        "PHIVOLCS volcano alert levels are not available right now. Check PHIVOLCS directly.",
      landslideNotCovered:
        "DisasterPH does not track landslide advisories yet. Follow your local DRRMO for landslide warnings.",
      pagasaTcLink: "PAGASA tropical cyclone bulletin",
      pagasaFloodLink: "PAGASA flood information",
      phivolcsLink: "PHIVOLCS bulletins",
    },
    map: {
      loading: "Loading map…",
      unavailableTitle: "Map unavailable on this device",
      unavailableBody:
        "This browser can't display the interactive map. Alerts and incidents are still listed in the feed.",
      retry: "Try again",
      terrainOn: "3D terrain",
      terrainOff: "Return to 2D",
      terrainFailed: "Terrain could not load. Showing the 2D map.",
      resetView: "Reset map view",
      resetViewTitle: "Show all of the Philippines, flat and north-up",
      keyboardNote: "Map of events. To choose an event with the keyboard, use the event list.",
    },
    notification: {
      enabledTitle: "Alerts active",
      enabledBody:
        "You'll be notified about critical and warning-level disasters in your region while DisasterPH is open.",
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
        "Get notified when a critical disaster impacts your region. Alerts are available while DisasterPH is open in your browser.",
      enable: "Enable alerts",
      enabling: "Enabling…",
      disabling: "Disabling…",
      permissionHint:
        "Your browser will ask for permission. You can change this anytime.",
      bellEnabled: "Alert notifications enabled",
      bellBlocked: "Notifications blocked",
      bellPrompt: "Enable disaster alerts",
      settingsTitle: "Notifications",
      settingsEnable: "Enable regional alerts",
      settingsActive: "Alerts active while DisasterPH is open",
      settingsBlockedBody:
        "Enable notifications in your browser settings for this site.",
      openTabNote:
        "Alerts appear only while DisasterPH is open. Keep a tab open to receive them.",
    },
    places: {
      title: "Saved places",
      openWithCount: "Saved places ({n})",
      intro: "Add the places where your family and friends are. DisasterPH shows events from its sources near each place.",
      storedLocally: "Saved only on this device. Nothing is sent to DisasterPH.",
      caveat: "This shows events near a place. It cannot tell you whether the people there are okay. Contact them directly, and follow PAGASA, PHIVOLCS, and the local DRRMO.",
      none: "No saved places yet.",
      eventsOne: "{n} recent event near this place",
      eventsMany: "{n} recent events near this place",
      highest: "highest: {level}",
      noEvents: "No recent events from DisasterPH's sources near this place. This is not an all-clear.",
      showOnMap: "Show on map",
      removeLabel: "Remove {name}",
      add: "Add a place",
      nameLabel: "Name",
      namePlaceholder: "e.g. Lola's house",
      tagLabel: "Who or what",
      tags: { family: "Family", home: "Home", work: "Work", school: "School", other: "Other" },
      locationLabel: "Town or city",
      searchPlaceholder: "Type a town or city",
      loadingTowns: "Loading the list of towns…",
      noTownMatch: "No town or city matches. Check the spelling.",
      useCurrent: "Use my current location",
      locating: "Finding your location…",
      currentNote: "Your current location will be saved on this device, rounded to about 1 km.",
      currentLocation: "Current location (about 1 km)",
      chosen: "Location: {place}",
      change: "Change",
      save: "Save place",
      cancel: "Cancel",
      needName: "Enter a name.",
      needLocation: "Choose a town or city, or use your current location.",
      limit: "You can save up to {n} places.",
      backupTitle: "Backup",
      backupNote: "Browsers can delete saved data, especially Safari on iPhone when DisasterPH is not added to the home screen. Download a backup to keep your places.",
      download: "Download backup",
      restore: "Restore from backup",
      restored: "{n} places restored.",
      restoreFailed: "That file is not a DisasterPH places backup.",
      close: "Close",
    },
    disclaimer: "DisasterPH is not a government service. Official warnings come from PAGASA, PHIVOLCS, NDRRMC, and your local DRRMO. Follow them. In an emergency, call 911.",
    hotlines: {
      title: "Emergency Hotlines",
      emergencyTitle: "Emergency",
      emergencyBody: "Police, fire, medical, and rescue. Free, 24/7.",
      call: "Call",
      agencyTitle: "Agency lines",
      agencyLabel: "Agency line",
      agencyNote:
        "For information and coordination, not emergencies. From public listings, last reviewed {date}.",
      purpose: {
        ndrrmc: "Disaster operations center",
        redCross: "Red Cross hotline",
        phivolcs: "Earthquakes and volcanoes",
        pagasa: "Weather and tropical cyclones",
        bfp: "Fire protection office",
        doh: "Health hotline",
        coastGuard: "Maritime incidents",
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
        emergency911: {
          label: "Call 911",
          description: "Emergency: police, fire, medical, rescue",
        },
        ndrrmc: {
          label: "Call NDRRMC",
          description: "Disaster operations center (not for emergencies)",
        },
        redCross: {
          label: "Red Cross PH",
          description: "Red Cross hotline (143)",
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
      unavailable: {
        title: "Evacuation center information",
        body: "DisasterPH does not have verified evacuation center information yet, so no shelter status, capacity, or contact numbers are shown here.",
        followLocal:
          "During an emergency, follow the instructions of your barangay and your city or municipal disaster risk reduction and management office (DRRMO).",
        emergency: "For emergencies, call",
        findTitle: "Where to find your evacuation center",
        findSteps: [
          "Ask your barangay hall or barangay officials. They know the assigned evacuation center for your area.",
          "Call or message your city or municipal DRRMO (MDRRMO/CDRRMO). Their number is usually on your city or municipality's official website or Facebook page.",
          "Check your LGU's official page for announcements during an emergency. Rely only on official accounts.",
        ],
        ndrrmc: "NDRRMC (national disaster agency)",
      },
      demoBanner:
        "Development preview: sample data only. These are not real shelter records, statuses, or phone numbers.",
      title: "Evacuation centers",
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
      live: "Mapa",
      pulse: "Mga Abiso",
      sanctuary: "Mga evacuation center",
      sanctuaryShort: "Evacuation",
      commandCenter: "Impormasyon sa sakuna sa Pilipinas",
      language: "Wika",
      liveBadge: "Live",
      call911: "911",
      call911Label: "Tumawag sa 911 para sa emergency",
      recentEvents: "Mga kamakailang pangyayari",
    },
    area: {
      label: "Inyong lugar",
      all: "Buong Pilipinas",
      savedPlaces: "Mga naka-save na lugar",
      regions: "Mga rehiyon",
      useLocation: "Gamitin ang aking lokasyon",
      locating: "Hinahanap ang inyong rehiyon…",
      locationNote: "Ginagamit lang ang inyong lokasyon para piliin ang rehiyon at hindi ito itinatago.",
      locationDenied: "Hindi pinayagan ang lokasyon. Piliin ang inyong lugar sa listahan.",
      locationUnavailable: "Hindi matukoy ang inyong lokasyon. Piliin ang inyong lugar sa listahan.",
      locationOffshore: "Wala sa loob ng isang rehiyon ng Pilipinas ang inyong lokasyon. Piliin ang inyong lugar sa listahan.",
      summaryOne: "{n} kamakailang pangyayari sa loob o malapit sa {area}", // NEEDS NATIVE REVIEW
      summaryMany: "{n} kamakailang pangyayari sa loob o malapit sa {area}", // NEEDS NATIVE REVIEW
      summaryWarning: "{n} na babala o mas mataas",
      summaryNone: "Walang kamakailang pangyayari mula sa mga pinagmulan ng DisasterPH sa loob o malapit sa {area} sa nakalipas na 10 araw.", // NEEDS NATIVE REVIEW
      summaryCaveat: "Hindi ito opisyal na abiso na ligtas na. Sundin ang PAGASA, PHIVOLCS, at ang inyong lokal na DRRMO.",
      summaryPlaceOne: "{n} kamakailang pangyayari malapit sa {area}",
      summaryPlaceMany: "{n} kamakailang pangyayari malapit sa {area}",
      summaryPlaceNone: "Walang kamakailang pangyayari mula sa mga pinagmulan ng DisasterPH malapit sa {area} sa nakalipas na 10 araw.",
      placeCaveat: "Ipinapakita nito ang mga pangyayari malapit sa lugar, hindi kung maayos ang mga tao roon.",
    },
    controls: {
      switchToNight: "Lumipat sa night mode",
      switchToDay: "Lumipat sa day mode",
      switchLanguage: "Lumipat sa English",
      openFullMap: "Buksan ang buong mapa",
      exitFullMap: "Lumabas sa buong mapa",
      focusMode: "Focus mode (F)",
      exitFocusMode: "Lumabas sa focus mode (Esc)",
      expandSidebar: "Palakihin ang sidebar",
      collapseSidebar: "Paliitin ang sidebar",
      closeSidebar: "Isara ang sidebar",
      closeFeed: "Isara ang feed",
      showFeed: "Ipakita ang feed",
      showFeedTitle: "Ipakita ang feed ng mga insidente",
      initializingMap: "Inihahanda ang mapa…",
    },
    common: {
      active: "Aktibo",
      critical: "Kritikal",
      sources: "Mga Pinagmulan",
      recent: "Kamakailan",
      warningPlus: "Babala+",
      sourcesHealthy: "Maayos na pinagmulan",
      showingOf: "ipinapakita ang {shown} sa {total}",
      showMore: "Ipakita ang {n} pa",
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
      emergencyContacts: "Mga Emergency Contact",
      technicalData: "Teknikal na Datos",
      source: {
        heading: "Pinagmulan",
        publishedBy: "Datos mula sa",
        publishers: {
          PHIVOLCS: "Impormasyon sa lindol ng PHIVOLCS",
          PHIVOLCS_VOLCANO: "Volcano bulletin ng PHIVOLCS",
          USGS: "USGS earthquake catalogue",
          PAGASA: "PAGASA",
          NASA_EONET: "NASA EONET",
          OTHER: "Ibang pinagmulan",
        },
        updated: "Huling update ng pinagmulan",
        record: "Tingnan ang source record ng pangyayaring ito",
        usgsNote:
          "Mula sa USGS catalogue dahil hindi maabot ang PHIVOLCS. Para sa opisyal na impormasyon sa lindol sa Pilipinas, tingnan ang PHIVOLCS.",
        referenceOnly:
          "Para sa sanggunian lamang. Hindi ito opisyal na abiso sa Pilipinas.",
        agencyLink: "Opisyal na impormasyon mula sa",
      },
      affectedAreas: "Mga lugar na binanggit sa bulletin", // NEEDS NATIVE REVIEW
      nearbyIncidents: "Mga kalapit na insidente",
      nearestHazard: "Pinakamalapit na panganib",
      strongestNearby: "Pinakamalakas sa paligid",
      lastNearbyUpdate: "Huling update sa paligid",
      more: "pa",
      eventNotFound: "Hindi Nahanap ang Abiso",
      expiredIncident: "Maaaring tapos na o hindi na aktibo ang abisong ito.",
      noDescription: "Walang detalyadong paliwanag para sa abisong ito.",
      viewFullDetail: "Tingnan ang buong detalye",
      mapPopup: {
        openInMaps: "Buksan sa Google Maps", // NEEDS NATIVE REVIEW
      },
      noneActive: "Walang aktibo", // NEEDS NATIVE REVIEW
      mapFilters: {
        rangeLabel: "Mga lindol sa nakalipas na", // NEEDS NATIVE REVIEW
        ranges: { "1h": "1h", "6h": "6h", "24h": "24h", "48h": "48h", "7d": "7d" },
        rangeNames: { "1h": "oras", "6h": "6 na oras", "24h": "24 na oras", "48h": "48 na oras", "7d": "7 araw" }, // NEEDS NATIVE REVIEW
        layers: "Mga layer", // NEEDS NATIVE REVIEW
        layersTitle: "Mga layer ng mapa", // NEEDS NATIVE REVIEW
        layerNames: { earthquake: "Mga lindol", volcano: "Mga bulkan", typhoon: "Mga bagyo", other: "Iba pa (NASA EONET)" }, // NEEDS NATIVE REVIEW
        includeSmall: "Isama ang mas mahinang lindol (M3.0 hanggang 3.4)", // NEEDS NATIVE REVIEW
        about: "Tungkol sa {layer}", // NEEDS NATIVE REVIEW
        info: { source: "Pinagmulan", updates: "Update", limits: "Limitasyon", ours: "Kinukuwenta ng DisasterPH" }, // NEEDS NATIVE REVIEW
        close: "Isara", // NEEDS NATIVE REVIEW
        filterNote: "Mga lindol: nakalipas na {range}, {mag}", // NEEDS NATIVE REVIEW
        magDefault: "M3.5 pataas", // NEEDS NATIVE REVIEW
        magAll: "M3.0 pataas", // NEEDS NATIVE REVIEW
      },
      statusStrip: {
        label: "Buong bansa, opisyal na datos", // NEEDS NATIVE REVIEW
        volcanoNamed: "{name} sa Alert Level {n}", // NEEDS NATIVE REVIEW
        volcanoLevelOne: "{n} sa Alert Level 1", // NEEDS NATIVE REVIEW
        volcanoUnknown: "Hindi makuha ang alert level ng bulkan", // NEEDS NATIVE REVIEW
        quakesMany: "{n} lindol na M4.0+ sa nakalipas na 24 oras", // NEEDS NATIVE REVIEW
        quakesOne: "1 lindol na M4.0+ sa nakalipas na 24 oras", // NEEDS NATIVE REVIEW
        quakesNone: "Walang lindol na M4.0+ sa nakalipas na 24 oras", // NEEDS NATIVE REVIEW
        quakesUnknown: "Hindi makuha ang datos ng lindol", // NEEDS NATIVE REVIEW
        cyclone: "Bagyong {name}: Signal No. {n}", // NEEDS NATIVE REVIEW
        cycloneNoSignal: "Bagyong {name}: walang nakataas na wind signal", // NEEDS NATIVE REVIEW
        noCyclone: "Walang aktibong bagyo", // NEEDS NATIVE REVIEW
        cycloneUnknown: "Hindi maabot ang PAGASA", // NEEDS NATIVE REVIEW
      },
      eventSheet: {
        one: "1 pangyayari, pinakabago muna", // NEEDS NATIVE REVIEW
        many: "{n} pangyayari, pinakabago muna", // NEEDS NATIVE REVIEW
        none: "Walang pangyayari para sa filter na ito", // NEEDS NATIVE REVIEW
        show: "Ipakita ang listahan", // NEEDS NATIVE REVIEW
        hide: "Itago ang listahan", // NEEDS NATIVE REVIEW
        all: "Tingnan ang lahat ng {n} sa listahan ng abiso", // NEEDS NATIVE REVIEW
      },
      sourcesLine: {
        checking: "Mga source: sinusuri…", // NEEDS NATIVE REVIEW
        count: "Mga source: {live} sa {total} ang live", // NEEDS NATIVE REVIEW
        updated: "na-update {age}", // NEEDS NATIVE REVIEW
        problem: "{name} {state}, huling update {age}", // NEEDS NATIVE REVIEW
        problemNever: "{name} {state}, wala pang datos", // NEEDS NATIVE REVIEW
        usgsBackup: "Ginagamit ang USGS bilang backup para sa lindol", // NEEDS NATIVE REVIEW
        offline: "Mga source: hindi masuri habang offline (huling suri {age})", // NEEDS NATIVE REVIEW
        offlineNever: "Mga source: hindi masuri habang offline", // NEEDS NATIVE REVIEW
        names: {
          PHIVOLCS: "Lindol ng PHIVOLCS", // NEEDS NATIVE REVIEW
          PHIVOLCS_VOLCANO: "Bulkan ng PHIVOLCS", // NEEDS NATIVE REVIEW
          PAGASA: "PAGASA",
          EONET: "NASA EONET",
          USGS: "USGS",
        },
        states: { delayed: "naantala", degraded: "may problema", unavailable: "hindi pa naaabot" }, // NEEDS NATIVE REVIEW
      },
      legend: {
        title: "Gabay sa mapa", // NEEDS NATIVE REVIEW
        earthquake: "Lindol: laki at numero = magnitude", // NEEDS NATIVE REVIEW
        cluster: "Magkakalapit na lindol: ilan, at ang pinakamalakas (pindutin para lumapit)", // NEEDS NATIVE REVIEW
        clusterMax: "max",
        volcano: "Bulkan: alert level ng PHIVOLCS (numero)", // NEEDS NATIVE REVIEW
        volcanoLevels: "Alert level 1 hanggang 5", // NEEDS NATIVE REVIEW
        typhoon: "Bagyo: pinakamataas na wind signal", // NEEDS NATIVE REVIEW
        ringTitle: "Kulay ng gilid ng lindol = antas", // NEEDS NATIVE REVIEW
        age: "Mas malabong lindol = mas luma (buo = nakaraang oras)", // NEEDS NATIVE REVIEW
        levelsTitle: "Sariling label ng DisasterPH ang Info, Bantayan, Babala, Kritikal:", // NEEDS NATIVE REVIEW
        levelDefs: {
          advisory: "mas mababa sa M4.0 · Alert Level 1", // NEEDS NATIVE REVIEW
          watch: "M4.0 hanggang 4.9 · Alert Level 2 · Signal No. 1", // NEEDS NATIVE REVIEW
          warning: "M5.0 hanggang 6.4 · Alert Level 3 · Signal No. 2", // NEEDS NATIVE REVIEW
          critical: "M6.5+ · Alert Level 4 hanggang 5 · Signal No. 3+", // NEEDS NATIVE REVIEW
        },
        official: "Opisyal: magnitude, alert level ng PHIVOLCS at wind signal ng PAGASA.", // NEEDS NATIVE REVIEW
        dangerZone: "Danger zone ng bulkan (radius mula sa PHIVOLCS)", // NEEDS NATIVE REVIEW
        track: "Dinaanan ng bagyo (NASA EONET); putol-putol = forecast", // NEEDS NATIVE REVIEW
        note: "Pindutin ang marker para sa detalye. Nakasulat din ang antas sa bawat popup at listahan.", // NEEDS NATIVE REVIEW
      },
      tsunami: {
        pointer: "Hindi nagpapakita ang DisasterPH ng tsunami warning. Pasok ang lakas at lalim ng lindol na ito sa saklaw kung saan maaaring maglabas ang PHIVOLCS ng tsunami advisory o warning.", // NEEDS NATIVE REVIEW
        link: "Tingnan ang Tsunami Information ng PHIVOLCS", // NEEDS NATIVE REVIEW
      },
      quake: { // NEEDS NATIVE REVIEW (whole quake block, added in PR #38)
        heading: "Earthquake bulletin ng PHIVOLCS",
        bulletinNo: "Earthquake Information Blg. {no}",
        issued: "Inilabas {time}",
        damage: "Inaasahang pinsala",
        aftershocks: "Inaasahang aftershock",
        yes: "Oo",
        no: "Hindi",
        unknown: "Hindi nakasaad",
        origin: "Pinagmulan",
        reported: "Naramdamang lakas (ulat ng mga tao)",
        instrumental: "Nasukat na lakas (instrumento ng PHIVOLCS)",
        noIntensities: "Walang nakalistang lugar sa bulletin na ito kung saan naramdaman ang lindol.",
        intensity: "Intensity {n}",
        scale: ["", "Halos hindi maramdaman", "Bahagyang naramdaman", "Mahina", "Katamtamang lakas", "Malakas", "Napakalakas", "Mapaminsala", "Lubhang mapaminsala", "Nakawawasak", "Lubos na nakawawasak"],
        scaleNote: "PHIVOLCS Earthquake Intensity Scale (PEIS), I hanggang X.",
        mapAlt: "Mapa ng epicenter mula sa PHIVOLCS: ang pulang tuldok ang pinagmulan ng lindol",
        mapCredit: "Mapa: PHIVOLCS",
        mapOpen: "Buksan ang buong mapa",
        unavailable: "Hindi mabasa ng DisasterPH ang bulletin ng PHIVOLCS para sa lindol na ito ngayon. Buksan ito sa site ng PHIVOLCS.",
        readBulletin: "Basahin ang buong bulletin",
      },
      volcano: {
        heading: "Volcano bulletin ng PHIVOLCS",
        bulletinDate: "Bulletin noong {date}",
        stale: "Ito ang pinakabagong bulletin na nabasa ng DisasterPH, mula {date}. Tingnan ang PHIVOLCS para sa mas bagong abiso.",
        mismatch: "Iba ang kasalukuyang alert level ng PHIVOLCS sa bulletin na ito. Tingnan ang PHIVOLCS para sa pinakabagong abiso.",
        notAllowed: "Hindi dapat payagan",
        hazards: "Mga posibleng panganib",
        monitoring: "Pagmamanman (nakaraang 24 oras)",
        params: {
          Seismicity: "Mga lindol ng bulkan",
          "Sulfur Dioxide Flux": "Sulfur dioxide",
          Plume: "Usok (plume)",
          "Ground Deformation": "Pagbabago ng lupa",
        },
        readBulletin: "Basahin ang buong bulletin (Filipino)",
        alertLevel: "Antas ng Alerto",
      },
      typhoon: {
        heading: "Tropical cyclone bulletin ng PAGASA",
        bulletinNo: "Bulletin #{no}",
        issued: "Inilabas {time}",
        stale: "Ito ang pinakabagong bulletin na nabasa ng DisasterPH, inilabas {time}. Maaaring may mas bagong bulletin na ang PAGASA.",
        position: "Lokasyon",
        movement: "Galaw",
        strength: "Lakas",
        signals: "Mga wind signal",
        signalNo: "Wind Signal No. {n}",
        noSignals: "Walang nakataas na wind signal sa bulletin na ito.",
        luzon: "Luzon",
        visayas: "Visayas",
        mindanao: "Mindanao",
        whatToDo: "Ano ang gagawin (PAGASA, Signal No. {n})",
        precautions: "Pag-iingat (PAGASA, Signal No. {n})",
        forecast: "Inaasahang lokasyon (PAGASA)",
        officialBulletin: "Opisyal na bulletin",
        pdf: "Bulletin (PDF)",
        trackMap: "Mapa ng daanan",
        signalMap: "Mapa ng wind signal",
      },
    },
    hazardEmpty: {
      typhoonNone:
        "Walang aktibong bagyo sa Philippine Area of Responsibility, ayon sa bulletin page ng PAGASA (sinuri noong {time}).",
      typhoonActive:
        "May aktibong tropical cyclone bulletin ang PAGASA, pero hindi ito mabasa ng DisasterPH. Basahin ang opisyal na bulletin.",
      typhoonUnknown:
        "Hindi available ngayon ang status ng bagyo mula sa PAGASA. Tingnan ang opisyal na bulletin.",
      floodNotCovered:
        "Hindi pa ipinapakita ng DisasterPH ang mga flood advisory ng PAGASA. Tingnan ang flood information ng PAGASA.",
      volcanoNone:
        "Nasa Alert Level 0 (normal) ang lahat ng bulkang binabantayan ng PHIVOLCS, ayon sa PHIVOLCS (sinuri noong {time}).",
      volcanoUnknown:
        "Hindi available ngayon ang alert level ng mga bulkan mula sa PHIVOLCS. Tingnan nang direkta ang PHIVOLCS.",
      landslideNotCovered:
        "Hindi pa sinusubaybayan ng DisasterPH ang mga landslide advisory. Sundin ang inyong lokal na DRRMO para sa babala sa pagguho ng lupa.",
      pagasaTcLink: "Tropical cyclone bulletin ng PAGASA",
      pagasaFloodLink: "Flood information ng PAGASA",
      phivolcsLink: "Mga bulletin ng PHIVOLCS",
    },
    map: {
      loading: "Nilo-load ang mapa…",
      unavailableTitle: "Hindi maipakita ang mapa sa device na ito",
      unavailableBody:
        "Hindi kayang ipakita ng browser na ito ang interactive na mapa. Makikita pa rin ang mga alerto at insidente sa feed.",
      retry: "Subukan muli",
      terrainOn: "3D na anyong-lupa",
      terrainOff: "Bumalik sa 2D",
      terrainFailed: "Hindi ma-load ang anyong-lupa. Ipinapakita ang 2D na mapa.",
      resetView: "Ibalik ang mapa",
      resetViewTitle: "Ipakita ang buong Pilipinas, patag at nakaharap sa hilaga",
      keyboardNote: "Mapa ng mga pangyayari. Para pumili gamit ang keyboard, gamitin ang listahan ng pangyayari.", // NEEDS NATIVE REVIEW
    },
    notification: {
      enabledTitle: "Aktibo ang mga alerto",
      enabledBody:
        "Makakatanggap ka ng abiso para sa kritikal at warning-level na sakuna sa iyong rehiyon habang nakabukas ang DisasterPH.",
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
        "Makatanggap ng abiso kapag may kritikal na sakunang tumama sa iyong rehiyon. Available ang mga alerto habang nakabukas ang DisasterPH sa iyong browser.",
      enable: "Buksan ang mga alerto",
      enabling: "Binubuksan…",
      disabling: "Pinapatay…",
      permissionHint:
        "Hihingi ng pahintulot ang browser mo. Maaari mo itong baguhin anumang oras.",
      bellEnabled: "Aktibo ang alert notifications",
      bellBlocked: "Naka-block ang notifications",
      bellPrompt: "Buksan ang disaster alerts",
      settingsTitle: "Mga Abiso",
      settingsEnable: "Buksan ang mga alerto sa rehiyon",
      settingsActive: "Aktibo ang mga alerto habang nakabukas ang DisasterPH",
      settingsBlockedBody:
        "Payagan ang notifications para sa site na ito sa iyong browser settings.",
      openTabNote:
        "Lumalabas lang ang mga alerto habang nakabukas ang DisasterPH. Panatilihing bukas ang isang tab para matanggap ang mga ito.",
    },
    places: {
      title: "Mga naka-save na lugar",
      openWithCount: "Mga naka-save na lugar ({n})",
      intro: "Idagdag ang mga lugar kung nasaan ang inyong pamilya at mga kaibigan. Ipinapakita ng DisasterPH ang mga pangyayari mula sa mga pinagmulan nito na malapit sa bawat lugar.",
      storedLocally: "Sa device na ito lang naka-save. Walang ipinapadala sa DisasterPH.",
      caveat: "Ipinapakita nito ang mga pangyayari malapit sa isang lugar. Hindi nito masasabi kung maayos ang mga tao roon. Kontakin sila nang direkta, at sundin ang PAGASA, PHIVOLCS, at ang lokal na DRRMO.",
      none: "Wala pang naka-save na lugar.",
      eventsOne: "{n} kamakailang pangyayari malapit sa lugar na ito",
      eventsMany: "{n} kamakailang pangyayari malapit sa lugar na ito",
      highest: "pinakamataas: {level}",
      noEvents: "Walang kamakailang pangyayari mula sa mga pinagmulan ng DisasterPH malapit sa lugar na ito. Hindi ito abiso na ligtas na.",
      showOnMap: "Ipakita sa mapa",
      removeLabel: "Alisin ang {name}",
      add: "Magdagdag ng lugar",
      nameLabel: "Pangalan",
      namePlaceholder: "hal. Bahay ni Lola",
      tagLabel: "Sino o ano",
      tags: { family: "Pamilya", home: "Bahay", work: "Trabaho", school: "Paaralan", other: "Iba pa" },
      locationLabel: "Bayan o lungsod",
      searchPlaceholder: "I-type ang bayan o lungsod",
      loadingTowns: "Kinukuha ang listahan ng mga bayan…",
      noTownMatch: "Walang tugmang bayan o lungsod. Suriin ang baybay.",
      useCurrent: "Gamitin ang kasalukuyan kong lokasyon",
      locating: "Hinahanap ang inyong lokasyon…",
      currentNote: "Ise-save sa device na ito ang inyong kasalukuyang lokasyon, naka-round sa mga 1 km.",
      currentLocation: "Kasalukuyang lokasyon (mga 1 km)",
      chosen: "Lokasyon: {place}",
      change: "Palitan",
      save: "I-save ang lugar",
      cancel: "Kanselahin",
      needName: "Maglagay ng pangalan.",
      needLocation: "Pumili ng bayan o lungsod, o gamitin ang kasalukuyang lokasyon.",
      limit: "Hanggang {n} lugar lang ang maaaring i-save.",
      backupTitle: "Backup",
      backupNote: "Maaaring burahin ng browser ang naka-save na data, lalo na ang Safari sa iPhone kapag hindi naidagdag ang DisasterPH sa home screen. Mag-download ng backup para hindi mawala ang inyong mga lugar.",
      download: "I-download ang backup",
      restore: "I-restore mula sa backup",
      restored: "{n} lugar ang naibalik.",
      restoreFailed: "Hindi ito backup ng mga lugar ng DisasterPH.",
      close: "Isara",
    },
    disclaimer: "Hindi serbisyo ng gobyerno ang DisasterPH. Ang mga opisyal na babala ay mula sa PAGASA, PHIVOLCS, NDRRMC, at sa inyong lokal na DRRMO. Sundin ang mga ito. Sa emergency, tumawag sa 911.",
    hotlines: {
      title: "Mga Emergency Hotline",
      emergencyTitle: "Emergency",
      emergencyBody: "Pulis, bumbero, medikal, at rescue. Libre, 24/7.",
      call: "Tumawag sa",
      agencyTitle: "Mga linya ng ahensya",
      agencyLabel: "Linya ng ahensya",
      agencyNote:
        "Para sa impormasyon at koordinasyon, hindi para sa emergency. Mula sa mga pampublikong listahan, huling sinuri noong {date}.",
      purpose: {
        ndrrmc: "Operations center para sa sakuna",
        redCross: "Hotline ng Red Cross",
        phivolcs: "Lindol at bulkan",
        pagasa: "Panahon at bagyo",
        bfp: "Tanggapan ng bumbero",
        doh: "Hotline para sa kalusugan",
        coastGuard: "Insidente sa dagat",
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
        emergency911: {
          label: "Tumawag sa 911",
          description: "Emergency: pulis, bumbero, medikal, rescue",
        },
        ndrrmc: {
          label: "Tawagan ang NDRRMC",
          description: "Operations center para sa sakuna (hindi para sa emergency)",
        },
        redCross: {
          label: "Red Cross PH",
          description: "Hotline ng Red Cross (143)",
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
      unavailable: {
        title: "Impormasyon sa evacuation center",
        body: "Wala pang beripikadong impormasyon ang DisasterPH tungkol sa mga evacuation center, kaya walang ipinapakitang status, kapasidad, o numero ng telepono rito.",
        followLocal:
          "Sa panahon ng emergency, sundin ang tagubilin ng inyong barangay at ng city o municipal disaster risk reduction and management office (DRRMO).",
        emergency: "Para sa emergency, tumawag sa",
        findTitle: "Saan makikita ang inyong evacuation center",
        findSteps: [
          "Magtanong sa inyong barangay hall o sa mga opisyal ng barangay. Alam nila ang itinalagang evacuation center para sa inyong lugar.",
          "Tumawag o mag-message sa DRRMO ng inyong lungsod o munisipyo (MDRRMO/CDRRMO). Karaniwang nasa opisyal na website o Facebook page ng inyong lungsod o munisipyo ang kanilang numero.",
          "Tingnan ang opisyal na page ng inyong LGU para sa mga anunsiyo sa panahon ng emergency. Sa mga opisyal na account lang umasa.",
        ],
        ndrrmc: "NDRRMC (pambansang ahensya sa sakuna)",
      },
      demoBanner:
        "Development preview: sample na datos lamang. Hindi ito tunay na rekord, status, o numero ng telepono ng silungan.",
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
