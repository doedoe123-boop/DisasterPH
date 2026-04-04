# Frontend Implementation Plan

## UI Component Tree

```text
app/page.tsx
└── DisasterPHDashboard
    ├── AppHeader
    ├── CommandMap
    │   └── IncidentMarker[]
    ├── AlertFeed
    │   └── IncidentFeedCard[]
    ├── IncidentDetails
    ├── QuickStats
    ├── SourceHealth
    └── MobileBottomSheet
```

## Page Structure

- Top bar with branding, live status, and floating filter chips
- Primary map canvas occupying the majority of the viewport
- Desktop right rail for feed, incident detail, stats, and source health
- Mobile bottom sheet for all supplemental panels

## Responsive Behavior

- `<1024px`: map-first layout with persistent bottom-sheet launcher
- `>=1024px`: two-column command-center layout with fixed right panel
- Filters remain horizontally scrollable on narrow screens

## Design Tokens

- Background: deep navy and tactical charcoal
- Accent: cyan for live state, amber/orange/red for severity
- Text: high-contrast white and muted steel-blue
- Radius: 20px to 28px for glassy panel surfaces
- Borders: low-contrast luminous outlines

## Animation Guidelines

- Pulse markers should communicate activity, not novelty
- Panel transitions should be short and smooth
- Loading shimmer appears only during initial sync or skeleton states
- Avoid decorative motion on core text blocks

## Map Interaction Guidelines

- Tapping a marker selects the incident and opens context
- Selected state should remain visible on both mobile and desktop
- Filters should never reset the viewport unexpectedly
- Future Leaflet integration should preserve marker and selection contracts
