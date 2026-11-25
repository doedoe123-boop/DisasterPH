# Values DisasterPH computes itself

Everything a visitor sees is either **copied from an agency** (PHIVOLCS, PAGASA,
NASA EONET, USGS) or **computed by DisasterPH**. This list covers the second
kind: what we compute, from what, where in the code, and what it is based on.
Review it whenever a rule changes. Last reviewed: 2026-11-25 (map Phase 2a).

Legend for "Basis":
- **Official**: follows a published agency rule or table (source linked).
- **Ours**: a DisasterPH design choice. Not an agency rule; must never be
  presented as one.

## Severity (the Info / Watch / Warning / Critical label, marker size and ring)

Every event gets one of four severity labels. They are **ours**: no agency
uses these four words. They exist to sort and colour events consistently.

| Source | Rule | Code | Basis |
|---|---|---|---|
| PHIVOLCS earthquakes | M >= 6.5 Critical, >= 5.0 Warning, >= 4.0 Watch, else Info | `src/lib/ingest/phivolcs.ts` `magToSeverity` | Ours (magnitude bands) |
| USGS earthquakes (fallback) | Same as PHIVOLCS | `src/lib/ingest/usgs.ts` `magToSeverity` | Ours |
| EONET earthquakes | Same bands | `src/lib/ingest/eonet.ts` `deriveSeverity` | Ours |
| EONET storms | wind >= 100 kt Critical, >= 64 Warning, >= 34 Watch | `src/lib/ingest/eonet.ts` `deriveSeverity` | Ours (34/64 kt match common storm-strength cut-offs) |
| EONET other | Watch | same | Ours |
| PHIVOLCS volcanoes | Alert Level >= 4 Critical, 3 Warning, 2 Watch, 1 Info | `src/lib/ingest/phivolcs-volcano.ts` `volcanoSeverity` | Ours, mapped from the official Alert Level (which is shown alongside) |
| PAGASA tropical cyclones | Highest wind signal >= 3 Critical, 2 Warning, 1 Watch, none Info | `src/lib/ingest/pagasa.ts` `tcSeverity` | Ours, mapped from the official Wind Signal (shown alongside) |

## Place and region

| Value | How | Code | Basis |
|---|---|---|---|
| Region of an event ("Western Visayas") | Point-in-polygon on simplified region outlines (about 1 km accuracy) | `src/lib/geo/ph-regions.ts` `locateRegion`, `src/lib/ingest/regions.ts` | Ours, outlines from faeldon/philippines-json-maps (MIT) |
| "Offshore" / nearest region | Outside every outline: nearest region boundary within 100 km (`NEAR_KM`) | same | Ours. The outlines are simplified, so points just off the coast may count as inland and vice versa |
| Earthquake location text ("012 km S 49° E of Valderrama (Antique)") | Copied verbatim into the description and `metadata.source_place` | `phivolcs.ts` | Official (PHIVOLCS) |
| Earthquake title ("M5.1 · Valderrama, Antique (12 km SE)") | Place and province copied from the agency text; quadrant bearing (S 49° E) rounded to 8 compass points (SE); raw text used when the pattern doesn't match | `src/lib/quake-place.ts` | Official place, our rounding of the bearing |
| Volcano province | Copied from the bulletin | `phivolcs-volcano.ts` | Official |
| Provinces under a wind signal | Copied from the PAGASA bulletin; matched to our province list | `pagasa.ts` `findProvinces` | Official text, our matching |
| "Areas named in the bulletin" (event page) | Wind-signal provinces or the volcano province only | `src/app/pulse/[id]/page.tsx` `bulletinAreas` | Official |
| Felt intensities by place | Copied from the PHIVOLCS bulletin; ALL-CAPS province names turned to title case | `src/lib/ingest/phivolcs-eq-bulletin.ts` | Official |
| Nearest town for "Use my current location" | Nearest of 1,642 town points within 30 km | `src/components/disasterph/saved-places-panel.tsx` | Ours, town points from faeldon/philippines-json-maps |

## Saved places and "your area"

| Value | How | Code | Basis |
|---|---|---|---|
| Event "near" a place | Within a radius per hazard type (earthquake 160 km, typhoon 320, flood 110, volcano 140, landslide 85, wildfire 90), cut to 70% for Watch and 40% for Info; or same region (not for Info); or the place's region is under the typhoon's wind signal | `src/lib/risk-summary.ts` `hazardRadiusKm`, `effectiveRadiusForIncident`, `incidentMatchesPlace` | Ours. Radii are not agency figures. The wording says "near", never "affected" or "safe" |
| "Highest" severity near a place | Highest of the matched events' severity labels | `risk-summary.ts` | Ours |
| Area summary counts ("47 recent events in or near …", "3 at warning level or higher") | Count of matched events in the last 10 days | `src/components/disasterph/area-bar.tsx`, `disasterph-command.tsx` | Ours |
| Event order when places are saved | severity × 10 + nearness (linear to 0 at 200 km) | `src/lib/incidents.ts` `priorityScore` | Ours |
| Stored coordinates | Rounded to 2 decimals (about 1 km) | `src/lib/saved-places.ts` `roundCoord` | Ours (privacy) |

## Time and freshness

| Value | How | Code | Basis |
|---|---|---|---|
| Shown times | Converted to Philippine time, always with the date ("Nov 25, 2026, 7:29 AM PHT") | `src/lib/event-time.ts`, `src/lib/incidents.ts` | Ours (formatting) |
| Volcano bulletin date | Shown as a date only ("Bulletin of Nov 25, 2026"); stored time is midnight PHT and never shown | `src/lib/event-time.ts` `dateOnlyBulletin` | Official date; the midnight time is ours and hidden |
| Ages ("5h ago") | Now minus the source's time | `src/lib/incidents.ts` `formatRelativeTime` | Ours |
| Volcano bulletin "stale" flag | Bulletin older than 2 days | `phivolcs-volcano.ts` `BULLETIN_STALE_MS` | Ours (bulletins are daily) |
| Typhoon bulletin "stale" flag | Bulletin older than 9 hours | `pagasa.ts` `TC_BULLETIN_STALE_MS` | Ours (PAGASA issues every 3 to 6 hours) |
| Sources line ("Sources: 4 of 4 live · updated 2m ago") | Counts the 4 primary sources whose status is healthy; "updated" is the oldest last success among them; any other source is named with its state and last success. Offline: "can't be checked while offline (last checked …)" | `src/components/disasterph/sources-line.tsx` | Ours, from the health below |
| Source health (Healthy / Delayed / Degraded) | Last success under 5 min old = healthy, over 15 min = delayed, over 30 min = degraded; a failed fetch = degraded (3 in a row = offline, shown as degraded); content that couldn't be read reliably = degraded | `src/lib/ingest/store.ts` `recordFetch`, `getSourceHealth` | Ours |
| Which events are listed | Earthquakes M3.0+ from the last 7 days; feed and counts use the last 10 days | `phivolcs.ts` `EQ_MIN_MAGNITUDE`, `EQ_WINDOW_DAYS`; `disasterph-command.tsx` | Ours |
| New-event alerts | Only events started within 6 hours alert as "new"; escalations always alert | `src/lib/alerts.ts` `NEW_ALERT_MAX_AGE_MS` | Ours |
| Same quake from PHIVOLCS and USGS | Within 2 minutes and 100 km = same event; the USGS copy is hidden | `src/lib/ingest/scheduler.ts` `sameQuake` | Ours |

## Map drawing

| Value | How | Code | Basis |
|---|---|---|---|
| Volcano danger-zone circle | Radius from the PHIVOLCS bulletin's Permanent Danger Zone; no circle if the bulletin gives none (e.g. Taal) | `src/components/disasterph/mapbox-map.tsx` `volcanoExclusionRadiusKm` | Official radius, our circle drawing |
| Storm track line | NASA EONET positions; dashed where EONET marks them as forecast | `mapbox-map.tsx` `syncTyphoonTracks` | Official (NASA EONET) |
| Earthquake marker | Circle sized by magnitude, magnitude written on it, ring colour = our severity label | `src/lib/map-event-layers.ts` | Official magnitude; ring colour ours |
| Earthquake clusters | Nearby quakes grouped (MapLibre clustering, radius 38 px, none from zoom 9); label = count and largest magnitude | `src/lib/map-event-layers.ts` | Ours (display); magnitudes official |
| Volcano marker | Triangle with the PHIVOLCS alert level number; colour per level 1-5 | `src/lib/map-event-layers.ts` | Official level; colours ours |
| Tropical cyclone marker | Circle with the highest PAGASA wind signal number ("TC" if none) | `src/lib/map-event-layers.ts` | Official signal |
| Base-map labels hidden near markers | A place name that would overlap a marker is not drawn | `src/lib/map-event-layers.ts` (blocker layers) | Ours (display) |
| ~~Earthquake "felt area" circle~~ | Removed in map Phase 1: 25 to 200 km guessed from magnitude | — | Was ours, looked official |
| ~~Typhoon wind circle~~ | Removed in map Phase 1: wind speed × 0.8 km | — | Was ours, looked official |

## Tabs and labels

| Value | How | Code | Basis |
|---|---|---|---|
| Flood and Landslide tabs | Hidden unless a source reports one (these hazards aren't monitored; only NASA EONET reports them, rarely) | `disasterph-command.tsx`, `src/app/pulse/page.tsx` | Ours |
| Typhoon tab "None active" | Shown when no tropical cyclone is listed anywhere (PAGASA is read every 3 min) | `disasterph-command.tsx` | Ours, from PAGASA data |
| Base-map labels | English name, else Latin-script, else local name; place labels outside a box around the Philippines hidden | `src/lib/map-labels.ts` | Ours (display), names from OpenStreetMap via OpenFreeMap |

## Text shown as guidance

| Value | How | Code | Basis |
|---|---|---|---|
| "What this means" line | One sentence per hazard type and severity | `src/lib/plain-alert.ts` | **Ours, paraphrased.** To be replaced in map Phase 3a by official PHIVOLCS/PAGASA wording with a source link next to each entry |
| "What to do now" tips | Tips per hazard type, filtered by severity | `src/lib/prep-guidance.ts` | **Ours, no source cited.** To be checked against NDRRMC/PHIVOLCS/PAGASA material in Phase 3a |
| Intensity words ("V · Strong") | PHIVOLCS Earthquake Intensity Scale names | `src/lib/i18n.ts` `quake.scale` | Official (English); Filipino is ours, needs native review |
| Tsunami pointer ("DisasterPH doesn't show tsunami warnings …") | Shown when magnitude and depth fall in a PHIVOLCS local-tsunami advisory/warning band: 6.5–7.0 and depth ≤ 50 km; 7.0–7.5 and ≤ 60; 7.5–8.0 and ≤ 70; 8.0+ and ≤ 100 | `src/lib/tsunami-check.ts` | Official bands (PHIVOLCS criteria table, Tsunami Ready Philippines workshop, 11 Dec 2025). It is a pointer to PHIVOLCS, never a tsunami status |
| Volcano "should not be allowed", hazards, monitoring | Copied from the bulletin | `phivolcs-volcano.ts` | Official |
| Typhoon precautions | Copied from the bulletin | `pagasa.ts` | Official |
| Damage / aftershocks expected | Copied from the earthquake bulletin | `phivolcs-eq-bulletin.ts` | Official |
| Saved-place caveat, disclaimer | Fixed text | `src/lib/i18n.ts` | Ours (product wording) |

## Not computed anywhere (checked)

- **Tsunami status.** No source DisasterPH reads states one. The USGS `tsunami` flag is stored but never shown (it is not a warning).
- **"Safe", "not affected", "all clear".** No string says this. Saved-place text says "near" and carries the caveat that it cannot tell whether people are okay.
