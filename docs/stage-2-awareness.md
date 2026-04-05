# Stage 2: Awareness

## Objective

Improve how users understand hazards spatially and locally, especially around saved places and active high-risk areas.

## Why This Stage Matters

Many users do not just need alerts. They need fast interpretation: where the threat is, how it is moving, and whether their family locations are inside the area of concern.

## Scope

### Improved Map Visualization

- Better earthquake epicenter plotting with magnitude-aware radius or emphasis
- Typhoon track and projected impact path visualization
- More intuitive flood and landslide emphasis in vulnerable zones
- Better volcano context for alert zones and nearby communities

### Better Hazard Display

- Earthquake:
  - epicenter clarity
  - depth and magnitude surfaced in compact form
- Typhoon:
  - track line
  - cone or path confidence kept simple and legible
- Flood:
  - affected region emphasis without pretending to show precise flood depth when unavailable
- Volcano:
  - alert zones and exclusion summaries
- Landslide:
  - rain-triggered slope risk areas where supported by data

### Saved Places Improvements

- Let users define home, work, school, and family places
- Show a compact risk summary per saved place
- Highlight the nearest or most relevant incidents to each saved place
- Make place status readable in one glance

### Stronger Risk Summaries

- Show concise place-based summaries such as:
  - nearest serious incident
  - strongest active hazard near a saved place
  - source freshness for that summary
- Avoid verbose analysis blocks

### Better Place-Based Monitoring

- Match incidents to saved places using region and distance rules
- Start simple with:
  - same region
  - proximity radius
  - hazard-specific thresholds
- Avoid fake precision if official geometry is incomplete

## Dependencies

- Stage 1 severity model
- Reliable place storage model
- Geographic matching utilities
- Basemap and marker system that can support extra layers

## Technical Considerations

- Typhoon and flood shapes may be uncertain or incomplete depending on source data
- Keep visualization honest: show confidence limits instead of pretending exactness
- Avoid heavy geospatial processing in the client if it hurts mobile performance

## Tradeoffs

- Better awareness layers help users more than broad analytics at this stage
- Simple, legible paths are better than highly detailed but slow or ambiguous overlays
- Saved-place monitoring should prioritize clarity over sophisticated personalization

## Recommended Acceptance Criteria

- Users can understand the difference between a nearby earthquake, an approaching typhoon, and a regional flood state quickly
- Saved places surface meaningful local risk summaries
- Additional map layers do not overwhelm the map-first experience
