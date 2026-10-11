# ACM Resolve — Quality Assurance (QA) Checklist

This checklist verifies all backend modules across Part A (Conflict Engine, Events & Reviews) and Part B (Data, Expenses, Receipts, Budget, Archive, Reports).

---

## Part A: Conflict Engine & Events API

- [ ] **A1: Conflict Detection Rules**
  - [ ] **Exact Overlap**: Propose event in `LT-2` during an active event window. Verify `VENUE_OVERLAP` is flagged with exact overlap minutes and `CRITICAL` severity.
  - [ ] **Partial Overlap**: Schedule event starting 30 minutes before an existing event ends. Verify `overlapMinutes` matches the intersection window.
  - [ ] **Touching Boundaries**: Schedule event immediately following an existing event (e.g. 10:00–11:00 and 11:00–12:00). Set buffer to 0. Verify zero `VENUE_OVERLAP` detected.
  - [ ] **Buffer Violations**: Schedule event with a 10-minute gap when required buffer is 15 minutes. Verify `BUFFER_VIOLATION` is flagged.
  - [ ] **Organizer Double-Booking**: Schedule two events at different venues with the same organizer at the same time. Verify `ORGANIZER_DOUBLE_BOOKING` is triggered.
  - [ ] **Resource Clash**: Request a 4K projector for two overlapping events. Verify `RESOURCE_CLASH` is detected.
  - [ ] **Cohort Overlap**: Schedule overlapping events targeting upper-division CSE students. Verify `STUDENT_GROUP_OVERLAP` is flagged.

- [ ] **A2: Severity Scoring & Weights**
  - [ ] Verify score output ranges between 0 and 100.
  - [ ] Check severity classification brackets: LOW (<30), MEDIUM (30–59), HIGH (60–84), CRITICAL (85+).
  - [ ] Verify duration scaling: 120-minute overlaps score higher than 15-minute overlaps.

- [ ] **A3: Free Slot Suggestions**
  - [ ] Call `POST /api/events/check-conflicts` for a conflicting time slot.
  - [ ] Confirm top 5 recommended slots are returned within 08:00–20:00.
  - [ ] Confirm weekend slots (Saturday/Sunday) are omitted when `skipWeekends` is enabled.
  - [ ] Confirm slots are ranked by proximity to the requested time.

- [ ] **A4: Events & Review Endpoints**
  - [ ] `POST /api/events`: Create event without conflict -> returns 201 Created.
  - [ ] `POST /api/events`: Create event with `CRITICAL` conflict -> returns 409 Conflict with suggested slots.
  - [ ] `POST /api/events`: Create event with `overrideConflict: true` -> succeeds and records reason.
  - [ ] `POST /api/events/[id]/review`: Attempt with `STUDENT` role -> 403 Forbidden.
  - [ ] `POST /api/events/[id]/review`: Attempt with `HOD` or `ADMIN` role -> 200 OK (status updated to `APPROVED` / `REJECTED`).

---

## Part B: Data, Expenses, Budget & Reports

- [ ] **B1: Database Schema Integrity**
  - [ ] Run `npx prisma migrate dev` or `npx prisma db push`.
  - [ ] Confirm tables, indexes (`[venueId, startTime, endTime]`), and enums exist in PostgreSQL.

- [ ] **B2: Seed Execution**
  - [ ] Run `npx ts-node prisma/seed-extra.ts`.
  - [ ] Verify upsert idempotency by running the command twice without duplicate key errors.
  - [ ] Confirm 1 admin, 2 HODs, 5 organizers, 20 students, 5 venues, 10 resources, 30 events, and 60 expenses exist.

- [ ] **B3: Expense & Budget Enforcement**
  - [ ] `POST /api/expenses`: Add expense within event budget -> 201 Created.
  - [ ] `POST /api/expenses`: Add expense exceeding remaining budget as regular user -> 400 Bad Request with detailed overage warning.
  - [ ] `POST /api/expenses`: Add expense exceeding remaining budget as `ADMIN` -> succeeds with override.
  - [ ] `GET /api/budget/summary`: Confirm `totalAllocated`, `totalSpent`, `remaining`, and `percentageUsed` match aggregate calculations.
  - [ ] `GET /api/budget/by-category`: Confirm items are grouped by category ready for Recharts.
  - [ ] `GET /api/budget/monthly-trend`: Confirm monthly series is populated.

- [ ] **B4: Receipt Upload & Download Signing**
  - [ ] `POST /api/receipts/sign-upload`: Submit 2 MB PDF -> 201 Created with upload parameters.
  - [ ] `POST /api/receipts/sign-upload`: Submit 8 MB file -> 400 Bad Request (exceeds 5 MB limit).
  - [ ] `POST /api/receipts/sign-upload`: Submit `.exe` or `.zip` file -> 400 Bad Request (invalid MIME type).
  - [ ] `GET /api/receipts/[id]/url`: Retrieve short-lived signed download URL.

- [ ] **B5: Archive Search**
  - [ ] `GET /api/archive/search?q=workshop&page=1&limit=10`: Verify matching historical events and expenses returned.
  - [ ] Verify pagination metadata (`totalPages`, `totalEvents`, `totalExpenses`).

- [ ] **B6: Reports & CSV Export**
  - [ ] `GET /api/reports/event/[id]`: Verify JSON report has financials, conflicts, and reviews.
  - [ ] `GET /api/reports/budget.csv`: Verify CSV download streams with RFC 4180 escaped fields.
  - [ ] `GET /api/reports/conflicts.csv`: Verify conflict audit CSV download.
  - [ ] Non-admin attempt to download CSV -> 403 Forbidden.
