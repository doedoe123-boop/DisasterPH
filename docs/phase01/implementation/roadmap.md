# 🗺️ Disaster PH – Product Roadmap

---

## Phase 1: Public MVP (Command Center UI)

**Goal:**
Deliver a real-time, highly readable disaster monitoring dashboard for the public.

### Features

* Map-first live monitoring dashboard
* Pulse feed (structured disaster alerts)
* Shelter awareness (capacity + status only)
* Incident reporting (user-submitted)
* Emergency sticky alert system

### Data

* Mock / seeded disaster data
* No real ingestion yet
* No sensitive data exposed

### UX Focus

* High readability (large typography, strong hierarchy)
* Command-center layout
* Mobile-first responsiveness
* Framer Motion for real-time feel

### Security

* No personal data
* No guest lists
* No search for individuals

---

## Phase 2: Operations & Data Layer (Admin System)

**Goal:**
Enable real operational workflows and secure data management.

### Backend

* Laravel ingestion scaffolding
* Connect to:

  * EONET
  * PAGASA
  * PHIVOLCS
* Scheduler + queue system
* Incident deduplication
* Severity normalization

### Admin Dashboard

* Manage disaster events
* Manage shelters
* View and process incident reports
* Manage notice boards

### Security Layer

* Role-based access (Admin, LGU, Responder)
* Audit logs (who accessed what)
* Restricted data visibility

### New System: Request-Based Lookup

* Public users submit request (missing person)
* Stored as request ticket
* Admin verifies and responds
* NO direct public search

---

## Phase 3: Alerting & Communication

**Goal:**
Turn the system into a real-time notification engine.

### Features

* Threshold-based alert engine
* SMS notifications
* Email alerts
* Webhook integrations

### User Controls

* Region-based subscriptions
* Hazard-type subscriptions
* Quiet hours
* Escalation rules

### UX

* Clear alert states (critical, warning, watch)
* Notification center (future)

---

## Phase 4: Intelligence & Analytics

**Goal:**
Add insights and predictive capabilities.

### Features

* Historical disaster timelines
* Regional heatmaps
* Trend detection
* Anomaly detection
* Incident clustering

### Data Intelligence

* Source confidence scoring
* Cross-source correlation
* Risk pattern identification

---

## Core Principles Across All Phases

### 1. Security First

* No sensitive data exposed publicly
* All personal data behind admin layer
* Audit everything

### 2. Readability Over Complexity

* Must be usable under stress
* Information must be scannable

### 3. Real-Time Feel

* Motion + updates must feel alive
* No static UI experience

### 4. Mobile Usability

* Fully functional on mobile
* Touch-first interactions

---

## Key Architectural Decision

Disaster PH is split into:

### Public System

* Monitoring
* Alerts
* Shelter status
* Reporting

### Admin System

* Data control
* Verification
* Sensitive information
* Response workflows