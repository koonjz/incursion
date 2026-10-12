# Multi-Milestone Engineering Roadmap (M2 – M5)

**Project:** ACM Resolve — Campus Resource & Event Management Platform  
**Target Delivery Window:** Fall Semester 2026  

---

## Milestone Overview

```
[M1: Foundation & Auth] ──> [M2: Events & Booking] ──> [M3: Conflict Engine] ──> [M4: Finance & Receipts] ──> [M5: Review & Audit]
     (Completed)
```

---

## Milestone 2: Event Submissions & Venue Booking System

- **Owner:** Events Module Lead
- **Duration:** Weeks 3–4
- **Core Dependencies:** M1 Auth (`withRole`), M1 Active Semester API, Venue Models.
- **Key Deliverables:**
  1. Multi-step event creation wizard (`/events/new`).
  2. Venue capacity checks against `expectedAttendance`.
  3. Student organizer draft saving and editing (`/events/my-submissions`).
  4. Integration with FullCalendar month/week views.
- **Identified Risks:**
  - High attendance events exceeding venue physical constraints.
  - Timezone synchronization across client browsers and database timestamps.

---

## Milestone 3: Real-Time Conflict Detection & Resolution Engine

- **Owner:** Conflict Algorithms Lead
- **Duration:** Weeks 5–6
- **Core Dependencies:** M2 Event Submissions, Venue Booking Ledger.
- **Key Deliverables:**
  1. Multi-factor conflict scoring (Time overlap, Venue collision, Audience overlap).
  2. Side-by-side comparison workspace with severity classification (`CRITICAL`, `HIGH`, `MEDIUM`).
  3. Automated alternative time slot recommendation engine (`suggestSlots.ts`).
  4. Conflict override approvals restricted to `ADMIN` and `HOD`.
- **Identified Risks:**
  - Performance degradation when calculating overlaps across large date ranges.
  - False positives on adjacent back-to-back room bookings without buffer times.

---

## Milestone 4: Budget Governance, Expenses & Cloud Receipts

- **Owner:** Finance & Integrations Lead
- **Duration:** Weeks 7–8
- **Core Dependencies:** M1 Department Budget Models, Cloudinary/S3 Provider.
- **Key Deliverables:**
  1. Expense submission modal linked to approved events.
  2. Pre-signed upload URLs for Cloudinary/S3 receipt images and PDF vouchers.
  3. Real-time balance deduction and hard overspend limits.
  4. CSV export of departmental budget reconciliations (`/api/reports/budget.csv`).
- **Identified Risks:**
  - Storage credential leaks (mitigated by pre-signed short-lived upload signatures).
  - Race conditions when concurrent expenses deduct from the same remaining balance.

---

## Milestone 5: Administrative Verification & System Auditing

- **Owner:** Platform & Quality Lead
- **Duration:** Weeks 9–10
- **Core Dependencies:** M2 Events, M3 Conflicts, M4 Budgets.
- **Key Deliverables:**
  1. Verification Queue for campus administrative deans (`/verification`).
  2. Event approval, revision request, or rejection with reviewer comments.
  3. Automated email notifications via Resend/SMTP to event organizers.
  4. Searchable system audit log viewer.
- **Identified Risks:**
  - Email deliverability and bounce handling on campus mail servers.
