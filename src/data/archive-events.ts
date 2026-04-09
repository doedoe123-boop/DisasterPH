import type { ArchiveEvent } from "@/types/archive";

export const ARCHIVE_EVENTS: ArchiveEvent[] = [
  {
    id: "abra-earthquake-2022",
    slug: "abra-earthquake-2022",
    title: "2022 Magnitude 7.0 Abra Earthquake",
    hazardType: "earthquake",
    severityLabel: "major",
    peakIntensity: "Magnitude 7.0 Mw — Tectonic",
    startDate: "2022-07-27",
    endDate: "2022-07-27",
    affectedRegions: [
      "Abra",
      "Ilocos Norte",
      "Ilocos Sur",
      "Mountain Province",
      "Benguet",
      "Metro Manila",
    ],
    deathToll: 11,
    displacedCount: 48000,
    damagePhpBillion: 2.1,
    magnitude: 7,
    summary: `A magnitude 7.0 earthquake struck the province of Abra in Luzon on July 27, 2022 at 8:43 AM. The quake was felt as far as Metro Manila and caused significant structural damage across the Cordillera Administrative Region.

Historic structures, including churches and government buildings in Vigan, Ilocos Sur — a UNESCO World Heritage Site — suffered damage. Landslides blocked several mountain roads. At least 11 people were killed and over 600 were injured.

Phivolcs recorded numerous aftershocks in the days following the main event.`,
    timelineEvents: [
      {
        date: "2022-07-27",
        title: "M7.0 mainshock at 8:43 AM",
        description:
          "PHIVOLCS confirms 7.0 magnitude at 17 km depth. Shaking felt across Luzon.",
      },
      {
        date: "2022-07-27",
        title: "NDRRMC activates response clusters",
        description:
          "Search and rescue teams deployed to Abra, Ilocos Sur, and Mountain Province.",
      },
      {
        date: "2022-07-27",
        title: "Heritage sites in Vigan damaged",
        description:
          "UNESCO-listed structures sustain structural cracks. Some declared unsafe.",
      },
      {
        date: "2022-07-28",
        title: "Over 200 aftershocks recorded",
        description:
          "PHIVOLCS advises continued vigilance as aftershock sequence continues.",
      },
      {
        date: "2022-08-03",
        title: "NDRRMC releases damage assessment",
        description:
          "Over 21,000 houses damaged. ₱2.1B in estimated infrastructure damage.",
      },
    ],
    officialSources: [
      {
        name: "PHIVOLCS Earthquake Bulletin",
        url: "https://earthquake.phivolcs.dost.gov.ph/",
      },
      {
        name: "NDRRMC Situation Report",
        url: "https://ndrrmc.gov.ph/",
      },
    ],
    lessonsLearned: [
      "Heritage structures require seismic retrofitting to survive moderate-to-strong earthquakes.",
      "Real-time aftershock advisories must be communicated clearly to prevent panic.",
      "Road clearance protocols for landslide-prone areas are critical for rescue access.",
      "Drop, cover, and hold on drills should be practiced by all communities in seismic zones.",
    ],
    latitude: 17.6132,
    longitude: 120.771,
    isFeatured: true,
  },
  {
    id: "taal-eruption-2020",
    slug: "taal-eruption-2020",
    title: "Taal Volcano Eruption 2020",
    hazardType: "volcano",
    severityLabel: "major",
    peakIntensity: "VEI-3 Eruption — 15km Eruption Column",
    startDate: "2020-01-12",
    endDate: "2020-03-15",
    affectedRegions: ["Batangas", "Cavite", "Laguna", "Metro Manila"],
    deathToll: 39,
    displacedCount: 376000,
    damagePhpBillion: 3.4,
    magnitude: null,
    summary: `Taal Volcano, located on an island in Lake Taal, erupted on January 12, 2020, sending a massive eruption column 15 km into the sky. The eruption produced volcanic lightning, heavy ashfall, and volcanic tsunamis in the lake.

PHIVOLCS raised Alert Level 4 (hazardous eruption imminent), triggering the evacuation of over 376,000 people from the surrounding municipalities. Ashfall affected areas as far as Metro Manila and Quezon Province.

The eruption caused significant damage to agriculture, fisheries, and infrastructure in Batangas. Volcanic smog (vog) affected air quality for weeks.`,
    timelineEvents: [
      {
        date: "2020-01-12",
        title: "Phreatomagmatic eruption begins",
        description:
          "Taal Volcano erupts at 2:30 PM. 15km eruption column observed. Alert Level 4 raised.",
      },
      {
        date: "2020-01-12",
        title: "Total evacuation ordered",
        description:
          "14km danger zone evacuation mandated. Over 450,000 people affected.",
      },
      {
        date: "2020-01-13",
        title: "Ashfall blankets Metro Manila",
        description:
          "Schools and offices suspended. NAIA flights cancelled. Visibility reduced.",
      },
      {
        date: "2020-01-26",
        title: "Alert Level lowered to 3",
        description:
          "Volcanic activity decreases but unrest continues. Partial return allowed.",
      },
      {
        date: "2020-03-15",
        title: "Alert Level downgraded to 1",
        description:
          "PHIVOLCS declares low-level unrest. Recovery operations begin.",
      },
    ],
    officialSources: [
      {
        name: "PHIVOLCS Taal Volcano Bulletin",
        url: "https://www.phivolcs.dost.gov.ph/",
      },
      {
        name: "NDRRMC SitRep on Taal Eruption",
        url: "https://ndrrmc.gov.ph/",
      },
    ],
    lessonsLearned: [
      "Volcanic eruptions near population centers require rapid, large-scale evacuation capability.",
      "Ashfall preparedness (masks, water storage, roof clearing) should be normalized in volcanic zones.",
      "Lake-based volcanoes pose unique tsunami risks that must be communicated to lakeside communities.",
      "Agricultural recovery plans should be pre-positioned for volcanic ashfall events.",
    ],
    latitude: 14.0113,
    longitude: 120.9979,
    isFeatured: true,
  },
  {
    id: "typhoon-haiyan-2013",
    slug: "typhoon-haiyan-2013",
    title: "Super Typhoon Haiyan (Yolanda)",
    hazardType: "typhoon",
    severityLabel: "catastrophic",
    peakIntensity: "Super Typhoon — 315 km/h sustained winds",
    startDate: "2013-11-03",
    endDate: "2013-11-11",
    affectedRegions: ["Eastern Visayas", "Leyte", "Samar", "Cebu", "Iloilo"],
    deathToll: 6300,
    displacedCount: 4000000,
    damagePhpBillion: 95.5,
    magnitude: null,
    summary: `Super Typhoon Haiyan, known locally as Yolanda, made landfall in the Philippines on November 8, 2013, as one of the most powerful tropical cyclones ever recorded. With sustained winds of 315 km/h and gusts reaching 380 km/h, Haiyan devastated the Eastern Visayas region.

The city of Tacloban was nearly destroyed by a storm surge reaching 5-6 meters. Over 6,300 people lost their lives, 4 million were displaced, and damages exceeded ₱95 billion. The international community mounted one of the largest humanitarian responses in history.

Haiyan fundamentally changed Philippine disaster preparedness policy and led to significant reforms in early warning systems and evacuation protocols.`,
    timelineEvents: [
      {
        date: "2013-11-03",
        title: "Tropical depression forms in Pacific",
        description: "PAGASA begins tracking. Rapid intensification forecast.",
      },
      {
        date: "2013-11-06",
        title: "PAGASA raises Signal No. 4",
        description:
          "Highest warning level issued for Eastern Visayas. Mandatory evacuation ordered.",
      },
      {
        date: "2013-11-08",
        title: "Haiyan makes landfall in Guiuan, Samar",
        description:
          "Category 5 equivalent. 315 km/h sustained winds. Storm surge devastates Tacloban.",
      },
      {
        date: "2013-11-09",
        title: "Communication blackout across Visayas",
        description:
          "Full extent of damage unknown. Military airlift operations begin.",
      },
      {
        date: "2013-11-11",
        title: "International relief operations launched",
        description:
          "UN declares Level 3 emergency. Countries worldwide pledge aid.",
      },
    ],
    officialSources: [
      {
        name: "PAGASA Tropical Cyclone Bulletin",
        url: "https://www.pagasa.dost.gov.ph/",
      },
      {
        name: "NDRRMC Final Report on Yolanda",
        url: "https://ndrrmc.gov.ph/",
      },
      {
        name: "UN OCHA Situation Reports",
        url: "https://reliefweb.int/",
      },
    ],
    lessonsLearned: [
      "Storm surge is the deadliest typhoon hazard — clear evacuation of coastal areas is non-negotiable.",
      "Pre-positioned relief supplies in disaster-prone areas drastically reduce response times.",
      "Communication infrastructure must be hardened against extreme weather events.",
      "Build-back-better principles should guide all post-disaster reconstruction.",
      "Community-based disaster risk reduction is essential for typhoon-prone regions.",
    ],
    latitude: 11.0,
    longitude: 125.0,
    isFeatured: true,
  },
  {
    id: "marawi-siege-2017",
    slug: "marawi-siege-2017",
    title: "2017 Marawi Siege & Displacement Crisis",
    hazardType: "other",
    severityLabel: "catastrophic",
    peakIntensity: "Armed Conflict — 5-Month Urban Siege",
    startDate: "2017-05-23",
    endDate: "2017-10-23",
    affectedRegions: ["Lanao del Sur", "Marawi City", "BARMM"],
    deathToll: 1132,
    displacedCount: 360000,
    damagePhpBillion: 50.0,
    magnitude: null,
    summary: `The Marawi Siege began on May 23, 2017 when armed militants affiliated with ISIS occupied parts of Marawi City. The Philippine military launched Oplan Ranao to retake the city, resulting in a 5-month urban battle that left much of the city center destroyed.

Over 1,100 people died (including militants, soldiers, and civilians), and 360,000 residents were displaced. The siege ended on October 23, 2017 when the last militant leaders were killed.

Reconstruction, known as Task Force Bangon Marawi, continues to this day with over ₱50 billion allocated for rebuilding the city.`,
    timelineEvents: [
      {
        date: "2017-05-23",
        title: "Militants seize parts of Marawi",
        description:
          "Maute Group and Abu Sayyaf fighters take positions in the city center.",
      },
      {
        date: "2017-05-23",
        title: "Martial law declared in Mindanao",
        description:
          "President declares martial law across the entire island of Mindanao.",
      },
      {
        date: "2017-06-02",
        title: "Massive civilian evacuation",
        description:
          "Over 200,000 residents flee Marawi. Evacuation centers overwhelmed.",
      },
      {
        date: "2017-10-23",
        title: "Liberation of Marawi declared",
        description:
          "President declares Marawi liberated. Last militant leaders confirmed killed.",
      },
    ],
    officialSources: [
      {
        name: "NDRRMC Situation Reports",
        url: "https://ndrrmc.gov.ph/",
      },
    ],
    lessonsLearned: [
      "Urban conflict zones require specialized evacuation and humanitarian corridors.",
      "Displacement camps must be equipped for long-term stays, not just emergency periods.",
      "Post-conflict reconstruction must include community-led planning to rebuild trust.",
    ],
    latitude: 7.9986,
    longitude: 124.2894,
    isFeatured: false,
  },
  {
    id: "typhoon-ondoy-2009",
    slug: "typhoon-ondoy-2009",
    title: "Typhoon Ondoy (Ketsana) 2009",
    hazardType: "flood",
    severityLabel: "major",
    peakIntensity: "Tropical Storm — Record 455mm rainfall in 6 hours",
    startDate: "2009-09-26",
    endDate: "2009-09-28",
    affectedRegions: ["Metro Manila", "Rizal", "Laguna", "Bulacan", "Pampanga"],
    deathToll: 464,
    displacedCount: 567000,
    damagePhpBillion: 11.0,
    magnitude: null,
    summary: `Tropical Storm Ondoy (international name Ketsana) brought unprecedented flooding to Metro Manila and surrounding provinces on September 26, 2009. The storm dumped 455mm of rain in just 6 hours — exceeding a month's worth of rainfall.

Floodwaters reached rooftop levels in Marikina, Cainta, and Pasig. Over 460 people died and 567,000 were displaced. The event exposed the vulnerability of Metro Manila's drainage systems and led to major flood control investments.`,
    timelineEvents: [
      {
        date: "2009-09-26",
        title: "Record rainfall hits Metro Manila",
        description:
          "455mm in 6 hours. Marikina River overflows. Citywide flooding begins.",
      },
      {
        date: "2009-09-26",
        title: "Rescue operations overwhelmed",
        description:
          "Military and civilian rescue teams deployed. Social media used for the first time in PH disaster response.",
      },
      {
        date: "2009-09-28",
        title: "Floodwaters begin to recede",
        description:
          "Full extent of damage becomes visible. Mass cleanup begins.",
      },
    ],
    officialSources: [
      {
        name: "PAGASA Weather Bulletin",
        url: "https://www.pagasa.dost.gov.ph/",
      },
      {
        name: "NDRRMC Final Report",
        url: "https://ndrrmc.gov.ph/",
      },
    ],
    lessonsLearned: [
      "Urban flood infrastructure must be designed for extreme rainfall events, not average conditions.",
      "Informal settlements along waterways face disproportionate flood risk.",
      "Social media can be a powerful tool for real-time disaster reporting and coordination.",
      "Flood control investments must be maintained, not just constructed.",
    ],
    latitude: 14.5995,
    longitude: 121.0244,
    isFeatured: false,
  },
  {
    id: "mt-pinatubo-1991",
    slug: "mt-pinatubo-1991",
    title: "Mount Pinatubo Eruption 1991",
    hazardType: "volcano",
    severityLabel: "catastrophic",
    peakIntensity: "VEI-6 Plinian Eruption — 2nd largest of 20th century",
    startDate: "1991-06-15",
    endDate: "1991-09-15",
    affectedRegions: [
      "Zambales",
      "Pampanga",
      "Tarlac",
      "Bataan",
      "Central Luzon",
    ],
    deathToll: 847,
    displacedCount: 200000,
    damagePhpBillion: null,
    magnitude: null,
    summary: `Mount Pinatubo's cataclysmic eruption on June 15, 1991 was the second-largest volcanic eruption of the 20th century (after Novarupta in 1912). The eruption ejected roughly 10 cubic kilometers of material, creating a 2.5-km-wide caldera.

The eruption occurred coincidentally with Typhoon Yunya, causing massive lahars from rain-soaked volcanic debris. The resulting lahars devastated towns in Pampanga and Zambales for years afterward. The eruption cooled global temperatures by 0.5°C for two years.

The eruption led to the closure of Clark Air Base and the evacuation of the Aeta indigenous communities from their ancestral lands.`,
    timelineEvents: [
      {
        date: "1991-04-02",
        title: "First phreatic explosions observed",
        description:
          "PHIVOLCS deploys monitoring equipment. Initial evacuations begin.",
      },
      {
        date: "1991-06-12",
        title: "Eruption escalates rapidly",
        description:
          "PHIVOLCS raises alert to highest level. Mass evacuation of 40,000+ people.",
      },
      {
        date: "1991-06-15",
        title: "Climactic eruption",
        description:
          "Plinian eruption column reaches 35 km. Pyroclastic flows devastate surrounding area. Typhoon Yunya makes landfall simultaneously.",
      },
      {
        date: "1991-06-16",
        title: "Ashfall covers Central Luzon",
        description:
          "Ashfall and lahar flows bury towns. Clark Air Base heavily damaged.",
      },
    ],
    officialSources: [
      {
        name: "PHIVOLCS Pinatubo Monitoring",
        url: "https://www.phivolcs.dost.gov.ph/",
      },
      {
        name: "USGS Volcano Hazards Program",
        url: "https://www.usgs.gov/programs/VHP",
      },
    ],
    lessonsLearned: [
      "Scientific monitoring and early warning systems save lives — PHIVOLCS/USGS partnership was exemplary.",
      "Lahar hazards persist for years after eruption and require long-term mitigation.",
      "Indigenous communities must be included in evacuation and resettlement planning.",
      "International scientific cooperation is critical for monitoring large volcanic systems.",
    ],
    latitude: 15.1429,
    longitude: 120.35,
    isFeatured: false,
  },
];

export function getArchiveEvent(slug: string): ArchiveEvent | undefined {
  return ARCHIVE_EVENTS.find((e) => e.slug === slug);
}

export function getArchiveEvents(): ArchiveEvent[] {
  return ARCHIVE_EVENTS;
}
