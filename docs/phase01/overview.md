# Disaster PH – Phase 1 Workflow Documentation

## Overview

Phase 1 focuses on the **public-facing disaster monitoring system**. The goal is to deliver a **real-time, high-readability dashboard** without exposing sensitive information.

This phase prioritizes:

* Live disaster visibility
* Alert clarity
* Shelter awareness (non-sensitive)
* Incident reporting

---

## Core Principles

### 1. Readability First

* Information must be scannable at a glance
* Critical alerts must stand out immediately

### 2. No Sensitive Data Exposure

* No personal data (names, evacuees, etc.)
* Shelter data is limited to capacity, status, and location

### 3. Real-Time Feel

* UI should feel live and responsive
* Motion supports awareness, not decoration

### 4. Mobile-Ready

* Must work seamlessly on mobile devices
* Touch-friendly interactions

---

## Main Features (Phase 1)

### 1. Live Monitoring Dashboard

#### Purpose

Provide a real-time overview of disasters across the Philippines.

#### Components

* Map view (primary visual)
* Active signals list (sidebar or stacked on mobile)
* Summary chips (counts by type)

#### User Flow

1. User opens dashboard
2. Sees active disasters on map
3. Reviews recent signals
4. Clicks an event for more details

---

### 2. Pulse Feed (Alert Feed)

#### Purpose

Display structured disaster alerts in a readable format.

#### Components

* Event cards (earthquake, typhoon, flood, etc.)
* Filters (type + severity)
* Search (non-sensitive fields only)

#### User Flow

1. User opens Pulse
2. Filters by disaster type or severity
3. Scrolls through alerts
4. Taps an alert to view details

#### Notes

* Must clearly differentiate: Critical / Warning / Watch / Advisory / Info
* Cards must prioritize readability and hierarchy

---

### 3. Sanctuary (Shelter Awareness)

#### Purpose

Provide visibility of evacuation shelters without exposing sensitive data.

#### Components

* Shelter list
* Capacity indicators
* Status (Open, Full, Standby, Closed)

#### User Flow

1. User views shelter list
2. Selects a shelter
3. Sees details (capacity, contact, amenities)

#### Restrictions

* No guest list visibility
* No name search

#### Placeholder (Phase 2 Notice)

Display message:
"For security and privacy reasons, shelter guest information is not publicly accessible."

---

### 4. Incident Reporting

#### Purpose

Allow users to report real-world incidents.

#### Inputs

* Incident type (Flood, Fire, Road Block, etc.)
* Location
* Description
* Optional photo

#### User Flow

1. User opens report panel
2. Fills in details
3. Submits report
4. System stores report for admin review (Phase 2)

---

### 5. Emergency Sticky Bar

#### Purpose

Display urgent system-wide alerts.

#### Behavior

* Fixed overlay (does not affect layout)
* Slides in from bottom
* Always visible above content (high z-index)

---

## Data Scope (Phase 1)

### Public Data Only

Allowed:

* Disaster events
* Shelter capacity/status
* Incident reports (submitted by users)

Restricted:

* Personal identities
* Evacuee records
* Internal response data

---

## UX Requirements

### Typography

* Large, readable titles
* Clear hierarchy
* No small, low-contrast text

### Motion

* Subtle and purposeful
* Used for:

  * card entry
  * hover states
  * panel transitions

### Interaction

* Clear tap/click feedback
* No layout shifts

---

## Mobile Behavior

### Layout Changes

* Stack all content vertically
* Convert grids → lists
* Use bottom navigation

### Key Adjustments

* Larger tap targets
* Scrollable filter chips
* Simplified map + feed structure

---

## Out of Scope (Phase 1)

These are reserved for Phase 2:

* Guest list management
* Person lookup
* Admin dashboard
* Data editing tools
* Role-based access

---

## Phase 1 Success Criteria

The system is considered complete when:

* Users can easily view disasters in real-time
* Alerts are clearly readable and prioritized
* Shelter information is accessible but secure
* Incident reporting works reliably
* UI works smoothly on both desktop and mobile

---

## Next Step (Phase 2 Preview)

Phase 2 will introduce:

* Admin dashboard (already scaffolded)
* Secure data handling
* Request-based person lookup system
* Role-based access

---

## Notes

This document should guide all UI and development decisions for Phase 1.
Do not introduce features that violate security or clarity principles.
