# Suggested 2-Week Build Plan

## Week 1

### Day 1

- Finalize product scope and UI direction
- Lock normalized incident schema
- Set up starter frontend shell

### Day 2

- Build command map and marker interactions
- Implement desktop sidebar and mobile bottom sheet

### Day 3

- Add mock data, stats, source health, and loading states
- Finalize design tokens and responsive polish

### Day 4

- Create Laravel API skeleton, routes, controllers, and models
- Scaffold transformers and ingestion jobs

### Day 5

- Add source fetch run tracking and dedupe logic
- Implement initial `/api/v1/incidents` responses

## Week 2

### Day 6

- Integrate one real source first, preferably PHIVOLCS earthquakes
- Validate normalized storage and stale-source states

### Day 7

- Add PAGASA advisory ingestion
- Map source metadata to severity and region conventions

### Day 8

- Add EONET reference ingestion
- Apply reference-only labeling and confidence handling

### Day 9

- Build alert evaluation and notification queue flow
- Add audit logs for fired alerts

### Day 10

- QA mobile and desktop behavior
- Improve empty states, error states, and source status messaging
- Prepare portfolio-ready polish and deployment docs
