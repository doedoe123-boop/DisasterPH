# Values DisasterPH computes itself

Everything a visitor sees is either **copied from an agency** (PHIVOLCS, PAGASA,
NASA EONET, USGS) or **computed by DisasterPH**. This list covers the second
kind: what we compute, from what, where in the code, and what it is based on.
Review it whenever a rule changes. Last reviewed: 2026-11-26 (map Phase 6).

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
| Which bulletins are read in the background | M4.0+ PHIVOLCS earthquakes, newest first, at most 12 new per 3-minute refresh, 3 at a time, waiting at most 2.5 s (slower ones are merged on the next refresh); cached by URL, failures retried after 5 minutes | `src/lib/ingest/phivolcs-eq-bulletin.ts` `enrichQuakesWithBulletins` | Ours (scheduling); content official |
| Nearest town for "Use my current location" | Nearest of 1,642 town points within 30 km | `src/components/disasterph/saved-places-panel.tsx` | Ours, town points from faeldon/philippines-json-maps |

## Saved places and "your area"

| Value | How | Code | Basis |
|---|---|---|---|
| Event "near" a place | Within a radius per hazard type (earthquake 160 km, typhoon 320, flood 110, volcano 140, landslide 85, wildfire 90), cut to 70% for Watch and 40% for Info; or same region (not for Info); or the place's region is under the typhoon's wind signal | `src/lib/risk-summary.ts` `hazardRadiusKm`, `effectiveRadiusForIncident`, `incidentMatchesPlace` | Ours. Radii are not agency figures. The wording says "near", never "affected" or "safe" |
| "Highest" severity near a place | Highest of the matched events' severity labels | `risk-summary.ts` | Ours |
| Area summary counts ("47 recent events in or near …", "3 at warning level or higher") | Count of matched events in the last 10 days | `src/components/disasterph/area-bar.tsx`, `disasterph-command.tsx` | Ours |
| Event order when places are saved | severity × 10 + nearness (linear to 0 at 200 km) | `src/lib/incidents.ts` `priorityScore` | Ours |
| Stored coordinates | Rounded to 2 decimals (about 1 km) | `src/lib/saved-places.ts` `roundCoord` | Ours (privacy) |
| Saved place inside / near the edge / outside a volcano danger zone (event card) | Straight-line (haversine) distance from the volcano's point to the saved place, compared with the PHIVOLCS Permanent Danger Zone radius. Within 1.5 km of the edge either way is "near the edge" (saved points are rounded to about 1 km); no verdict when the bulletin gives no radius, only the distance. Places over 50 km away are not listed; at most 5, nearest first. Computed in the browser; places never leave it | `src/lib/danger-zone.ts` `placeChecks`, `EDGE_MARGIN_KM`, `VOLCANO_PLACE_KM` | Official radius; distance, edge margin and cut-off ours |
| Saved place distance from an earthquake (event card) | Haversine distance from the PHIVOLCS epicentre, rounded to whole km (minimum 1); only places within 100 km | `src/lib/danger-zone.ts` `QUAKE_PLACE_KM` | Official epicentre; distance and cut-off ours. No felt or not-felt verdict |
| Saved place under a cyclone's wind signal (event card) | The place's region appears in the PAGASA signal regions for that cyclone | `src/lib/danger-zone.ts` (uses `regionForMatching`) | Official signal regions; region lookup ours |
| "This is not a safety confirmation." | Fixed text ending every saved-place section; inside or near the edge also quotes the bulletin's own Permanent Danger Zone line and says to contact the people there and follow the local DRRMO | `src/components/disasterph/event-card.tsx` `SavedPlaceLines` | Quote official; the rest ours (product wording) |
| "All my saved places" (area, and the map's "My places") | Events that match any saved place by the same rule as one saved place (radius, region or wind signal above) | `src/lib/area.ts` `incidentInArea` | Ours (same rule as saved-place alerts) |
| Region from "Use my location" | The device's position reduced to its region in the browser; flagged so it is never written into a shareable link | `src/components/disasterph/area-bar.tsx`, `src/lib/area.ts` (`fromLocation`) | Ours (privacy) |
| "Show my location" dot and circle | The browser's position and its reported accuracy radius, drawn between 50 m and 50 km; kept in page memory only (not stored, not sent, not in the URL) | `src/lib/map-user-layers.ts` | Device-reported; drawing ours |

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
| Volcano danger-zone circle | Radius from the PHIVOLCS bulletin's Permanent Danger Zone (accepted only if more than 0 and at most 30 km); no circle if the bulletin gives none (e.g. Taal). Drawn as a 64-point great-circle ring on the same sphere as the inside/outside distance. When chosen: stronger fill and outline, the label "{n} km Permanent Danger Zone (PHIVOLCS)" just inside its top, and the camera fits the whole circle in the clear part of the map (popover beside it on wide screens) | `src/lib/danger-zone.ts` `pdzRadiusKm`, `zoneRing`; `src/components/disasterph/mapbox-map.tsx` `syncHazardZones`; `src/lib/map-camera.ts` `zonePadding` | Official radius, our circle drawing |
| Storm track line | NASA EONET positions; dashed where EONET marks them as forecast | `mapbox-map.tsx` `syncTyphoonTracks` | Official (NASA EONET) |
| Earthquake marker | Circle sized by magnitude, magnitude written on it, ring colour = our severity label | `src/lib/map-event-layers.ts` | Official magnitude; ring colour ours |
| Earthquake clusters | Nearby quakes grouped (MapLibre clustering, radius 38 px, none from zoom 9); label = count and largest magnitude | `src/lib/map-event-layers.ts` | Ours (display); magnitudes official |
| Volcano marker | Triangle with the PHIVOLCS alert level number; colour per level 1-5 | `src/lib/map-event-layers.ts` | Official level; colours ours |
| Tropical cyclone marker | Circle with the highest PAGASA wind signal number ("TC" if none) | `src/lib/map-event-layers.ts` | Official signal |
| Earthquake fading | Opacity by age: solid in the last hour, fainter after 1, 6, 24 and 48 hours | `src/lib/map-event-layers.ts` `AGE_OPACITY` | Ours (display) |
| Earthquake time and magnitude filters | Last 1h/6h/24h/48h/7d (default 24h), M3.5+ by default or M3.0+; earthquakes only, applied to the map, list and counts; measured from when the data was generated | `src/lib/quake-filters.ts` | Ours (display choice) |
| Status strip ("Mayon at Alert Level 3 · 1 earthquake M4.0+ in the last 24 h · No active tropical cyclone") | Volcano levels as PHIVOLCS gives them (named from Level 2, Level 1 counted); count of M4.0+ quakes that started in the last 24 h; PAGASA cyclones with their highest signal; a part is replaced by "unavailable" when its source was never read. No combined score | `src/lib/status-strip.ts` | Official values; the count and wording are ours |
| Base-map labels hidden near markers | A place name that would overlap a marker is not drawn | `src/lib/map-event-layers.ts` (blocker layers) | Ours (display) |
| ~~Earthquake "felt area" circle~~ | Removed in map Phase 1: 25 to 200 km guessed from magnitude | — | Was ours, looked official |
| ~~Typhoon wind circle~~ | Removed in map Phase 1: wind speed × 0.8 km | — | Was ours, looked official |
| List order | Newest first by default (event time), or highest level first (our severity label, then newest). The list only: the map does not depend on it | `src/lib/list-sort.ts` | Ours (display choice) |
| Chosen event | Counts only while the event is in the current view (area, tab, earthquake filters); otherwise no card and no `event` in the URL | `src/components/disasterph/disasterph-command.tsx` | Ours (display) |
| Shareable view URL | Allowed parameters only (view, show, layers, range, mag, event), each checked against a fixed list; defaults left out; never saved places, coordinates or a location-derived region | `src/lib/view-url.ts` | Ours |
| Link preview text (Messenger, Viber…) | Region links: the area summary counts above plus "Official data from PHIVOLCS and PAGASA, checked {time}", with the not-an-all-clear caveat when there are none; event links: the event title, its publisher and its time as on the card; otherwise the status strip | `src/lib/share-preview.ts` | Official values; counts and wording ours |
| Base map | OpenFreeMap: Positron (light theme, plain grey since map Phase 6) or Dark; free, no key | `src/lib/mapbox.ts` | Third-party map (OpenStreetMap data) |
| Outline map (fallback base) | Shown when the base map cannot load: its style fails, its tile source fails, or base tiles keep failing (3 while offline; 6 online with none loaded). A plain outline of the 18 regions (PSGC regions via faeldon/philippines-json-maps, MIT, ~1 km simplification, rounded to ~100 m), kept by the service worker. Switches back by itself when the device comes back online, or on "Try again" | `src/lib/map-fallback.ts`, `scripts/build-ph-outline.mjs`, `public/map/ph-outline.json` | Official boundaries (simplified); thresholds ours |
| Offline banner | "Offline: showing last saved data from {time}." The time is when the shown data was generated by the server, not when it was saved on the device | `src/components/disasterph/disasterph-command.tsx` | Ours (wording from the map handoff addendum) |

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
| Intensity names ("Strong") | **Not shown since map Phase 3a.** They were written from memory, not copied from PHIVOLCS, so they were wrongly listed here as official. Pages and cards now show only what the bulletin says ("Intensity V" and the places). Restore only after checking the PHIVOLCS Earthquake Intensity Scale page (its site blocks automated access; needs a copy saved from a browser) | `src/lib/i18n.ts` `quake.scale` (unused) | Unverified |
| Event card (phone sheet, desktop popover) | Shows only agency text where it says "PHIVOLCS"/"PAGASA": volcano status name, hazards and "should not be allowed" from the bulletin; earthquake reported intensity, damage and aftershock expectations from the bulletin; PAGASA's what-to-do. Rows without data are left out | `src/components/disasterph/event-card.tsx` | Official text, quoted |
| Tsunami pointer ("DisasterPH doesn't show tsunami warnings …") | Shown when magnitude and depth fall in a PHIVOLCS local-tsunami advisory/warning band: 6.5–7.0 and depth ≤ 50 km; 7.0–7.5 and ≤ 60; 7.5–8.0 and ≤ 70; 8.0+ and ≤ 100 | `src/lib/tsunami-check.ts` | Official bands (PHIVOLCS criteria table, Tsunami Ready Philippines workshop, 11 Dec 2025). It is a pointer to PHIVOLCS, never a tsunami status |
| Volcano "should not be allowed", hazards, monitoring | Copied from the bulletin | `phivolcs-volcano.ts` | Official |
| Typhoon precautions | Copied from the bulletin | `pagasa.ts` | Official |
| Damage / aftershocks expected | Copied from the earthquake bulletin | `phivolcs-eq-bulletin.ts` | Official |
| Saved-place caveat, disclaimer | Fixed text | `src/lib/i18n.ts` | Ours (product wording) |

## Not computed anywhere (checked)

- **Tsunami status.** No source DisasterPH reads states one. The USGS `tsunami` flag is stored but never shown (it is not a warning).
- **"Safe", "not affected", "all clear".** No string says this. Saved-place text says "near" and carries the caveat that it cannot tell whether people are okay.
