# UI Guide

## Design Direction

- Dark, tactical, modern, serious
- The map should feel like a live national monitoring surface
- Visual weight belongs to geography, markers, and status signals

## Required Layout

- Full-screen Philippines map
- Desktop right sidebar for feed, selected incident details, quick stats, and source health
- Mobile bottom sheet instead of a narrow sidebar
- Floating or pinned filter chips that do not overpower the map

## Incident Visualization

- Use pulsing markers to indicate active incidents
- Use severity color and glow to signal urgency
- Keep labels compact and contextual
- Preserve a clear selected state without obscuring nearby markers

## Panels And Cards

- Use compact cards, not verbose content blocks
- Prioritize title, severity, source, region, and freshness
- Details should support action and scanning, not become long essays

## Severity Badges

- `advisory`: low-emphasis informational state
- `watch`: elevated risk
- `warning`: actionable high attention
- `critical`: highest operational urgency

## Animation Rules

- Marker pulses should be subtle and continuous
- Panel transitions should clarify state changes
- Loading shimmer is acceptable for initial fetch states
- Avoid decorative animation that competes with situational awareness

## Anti-Patterns

- No generic admin dashboard styling
- No table-first first screen
- No text-heavy hero area
- No oversized KPI blocks that reduce map space
- No playful visual language or casual tone
