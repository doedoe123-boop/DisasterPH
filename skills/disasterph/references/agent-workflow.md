# Agent Workflow

## Recommended Roles

- `UI agent`: owns map-first layout, responsive behavior, markers, panels, and visual consistency
- `data agent`: owns normalized schema, transformers, ingestion, API contracts, dedupe, and stale-source logic
- `alerts agent`: owns alert evaluation, escalation, notification flow, and alert safety rules
- `docs agent`: owns product, architecture, roadmap, and implementation docs aligned with current code

## Handoff Rules

- State what reference files were used
- State any assumptions about source behavior or UI constraints
- Do not redefine core field names casually
- Do not hand off work that violates the map-first principle

## Definition Of Done

- The result preserves a map-dominant interface
- Mobile behavior protects map visibility
- Incident data remains normalized
- Source freshness and health behavior remain coherent
- Docs and code agree on naming, severity, and source treatment

## Avoiding Drift

- Re-check the map-first rule before changing layout hierarchy
- Re-check the normalized incident shape before changing backend logic
- Re-check source trust guidance before changing alert behavior
- Reject work that turns the experience into a generic dashboard or feed-first product
