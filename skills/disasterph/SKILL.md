---
name: disasterph
description: reusable instructions for working on disasterph features, including map-first ui, normalized incident data, ingestion architecture, alert logic, and multi-agent coordination around shared product conventions.
---

# DisasterPH Skill

Use this skill when the task touches DisasterPH product behavior, UI, architecture, data normalization, API design, alerting, or documentation. Use it for both greenfield work and iterative maintenance.

## Core Rule

Keep DisasterPH map-first at all times.

- The Philippines map is the primary interface.
- Text, panels, and metrics support map interpretation.
- If a proposed solution makes the first screen table-first, form-first, or text-heavy, reject it and redesign.

## Read These References

- Product framing: `references/product.md`
- UI constraints and anti-patterns: `references/ui-guide.md`
- Event normalization and stale-data rules: `references/data-model.md`
- System responsibilities and API conventions: `references/architecture.md`
- Multi-agent coordination: `references/agent-workflow.md`
- Delivery sequencing: `references/roadmap.md`

Read only the references needed for the current task, but always consult `references/ui-guide.md` before changing the interface and `references/data-model.md` before changing event or source logic.

## Product Principles

- Preserve a live command-center feel.
- Favor quick scanning over dense exposition.
- Keep the map dominant on desktop and mobile.
- Treat incident data as normalized across sources.
- Distinguish operational sources from reference sources.
- Surface source freshness and health explicitly.
- Maintain mobile-first behavior; the mobile experience is not a reduced desktop afterthought.

## UI Instructions

- Desktop: full-screen Philippines map with a right-side operational panel.
- Mobile: map remains primary; details move into a bottom sheet.
- Use compact cards, chips, badges, and overlays.
- Use serious, tactical styling; avoid playful or generic SaaS dashboard patterns.
- Use motion only where it clarifies state: marker pulses, panel transitions, loading shimmer.

## Data Instructions

- Keep the normalized event model stable unless the task explicitly requires a schema change.
- Preserve these core fields: `id`, `source`, `external_id`, `event_type`, `title`, `description`, `latitude`, `longitude`, `severity`, `region`, `started_at`, `updated_at`, `metadata`.
- Use per-source transformers to map raw upstream payloads into the normalized shape.
- Preserve dedupe behavior and stale-source visibility when adding ingestion or alert logic.

## Source Handling

- PAGASA and PHIVOLCS should be treated as operationally authoritative in their domains.
- NASA EONET should be treated as situational awareness metadata, not a precise operational dispatch source.
- Never imply stronger certainty than the upstream source supports.

## Agent Coordination

- Use shared conventions from the references before splitting work.
- UI agents own map-first presentation and responsive behavior.
- Data agents own normalization, transformers, API shape, and stale-source handling.
- Alerts agents own dedupe, thresholds, escalation rules, and notification safety.
- Docs agents keep written outputs aligned with the same product and data model.
- On handoff, state what was changed, what assumptions were made, and which references governed the work.

## Consistency Checks

Before finishing, verify:

- the map still dominates the experience
- mobile uses a bottom sheet or equivalent map-preserving pattern
- incident and source data still follow the normalized model
- source health and last-updated logic remain visible where relevant
- new docs and code agree on terminology and severity levels

## Output Style For Agents

- Be direct and opinionated.
- Prefer reusable modules and stable interfaces.
- Avoid overengineering.
- Keep documentation concise, specific, and aligned with the references.
