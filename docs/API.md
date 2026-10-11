# ACM Resolve — API Reference Documentation

All API responses follow the consistent JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
Or on error:
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Human-readable description",
    "details": { ... }
  }
}
```

---

## 1. Events & Reviews

### `GET /api/events`
- **Description**: List campus events with multi-criteria filtering.
- **Authentication**: Optional (public approved events) / Authenticated for drafts.
- **Query Parameters**:
  - `from` (ISO date): Events starting on or after.
  - `to` (ISO date): Events ending on or before.
  - `venueId` (string): Filter by venue ID.
  - `status` (`DRAFT` | `PENDING` | `APPROVED` | `CHANGES_REQUESTED` | `REJECTED`).
  - `organizerId` (string): Filter by organizer.
  - `search` (string): Keyword search in title/description.
- **Response**: `200 OK` with array of Event objects.

### `POST /api/events`
- **Description**: Submit a new event. Automatically runs the pure conflict detection engine, calculates severity, logs conflicts, and sends email notifications.
- **Authentication**: Required (`ADMIN`, `HOD`, `ORGANIZER`, `STUDENT`).
- **Request Body**:
  ```json
  {
    "title": "Distributed Systems in Go",
    "description": "Hands-on engineering workshop",
    "eventType": "Workshop",
    "startTime": "2026-10-15T17:00:00Z",
    "endTime": "2026-10-15T19:00:00Z",
    "venueId": "ven-lt2",
    "expectedAttendance": 150,
    "attendeesGroup": ["CSE", "Technical"],
    "resources": [{ "resourceId": "res-proj-4k", "quantity": 1 }],
    "budgetAllocated": 25000,
    "overrideConflict": false
  }
  ```
- **Responses**:
  - `201 Created`: Event saved with conflict severity rating.
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Event has `CRITICAL` conflicts and `overrideConflict` was false. Returns detected conflicts and top 5 suggested free slots.

### `GET /api/events/[id]`
- **Description**: Retrieve comprehensive event details including venue, organizer, resources, budget, expenses, conflict history, and review audits.
- **Response**: `200 OK` or `404 Not Found`.

### `PATCH /api/events/[id]`
- **Description**: Update an event. Re-evaluates live conflicts and updates audit log.
- **Authentication**: Organizer of the event or `ADMIN`/`HOD`.
- **Response**: `200 OK` with updated event and re-calculated conflicts.

### `DELETE /api/events/[id]`
- **Description**: Remove an event.
- **Authentication**: Organizer of the event or `ADMIN`/`HOD`.
- **Response**: `200 OK` `{ "deleted": true, "id": "..." }`.

### `POST /api/events/check-conflicts`
- **Description**: Dry-run conflict check without modifying database state.
- **Authentication**: Public / Any role.
- **Request Body**:
  ```json
  {
    "venueId": "ven-lt2",
    "startTime": "2026-10-15T17:00:00Z",
    "endTime": "2026-10-15T19:00:00Z",
    "attendeesGroup": ["CSE"],
    "resources": [{ "resourceId": "res-proj-4k", "quantity": 1 }]
  }
  ```
- **Response**: `200 OK` with `{ conflicts, overallScore, overallSeverity, suggestedSlots }`.

### `POST /api/events/[id]/review`
- **Description**: Submit an administrative review decision.
- **Authentication**: Restricted to `ADMIN` and `HOD` roles.
- **Request Body**:
  ```json
  {
    "decision": "APPROVED", // "APPROVED" | "REJECTED" | "CHANGES_REQUESTED"
    "comment": "All logistical arrangements approved.",
    "changesRequested": [],
    "overrideConflict": true
  }
  ```
- **Response**: `200 OK` with review record and updated event status.

---

## 2. Expenses & Budget

### `POST /api/expenses`
- **Description**: Create an expense item for an event.
- **Validation**: Enforces event budget caps. If projected spending exceeds event's allocated budget, non-admin submissions are blocked with a clear warning.
- **Authentication**: Authenticated user.
- **Request Body**:
  ```json
  {
    "eventId": "evt-seed-1",
    "title": "Speaker Honorarium",
    "amount": 7500,
    "category": "MISCELLANEOUS",
    "receiptId": "rec-123"
  }
  ```
- **Responses**:
  - `201 Created`: Expense created.
  - `400 Bad Request`: Exceeds allocated budget (returns allocated, spent, attempted, remaining, overage details).

### `GET /api/expenses`
- **Query Parameters**: `eventId`, `category`, `status`.
- **Response**: `200 OK` with matching expenses.

### `PATCH /api/expenses/[id]`
- **Description**: Update expense amount, title, or category.
- **Response**: `200 OK`.

### `DELETE /api/expenses/[id]`
- **Description**: Delete expense item.
- **Response**: `200 OK`.

### `GET /api/budget/summary`
- **Description**: High-performance aggregate budget metrics (Prisma `aggregate`): allocated, spent, remaining, percentage used.
- **Query Parameters**: `eventId`, `from`, `to`.
- **Response**: `200 OK`.

### `GET /api/budget/by-category`
- **Description**: Aggregated expenses grouped by category (`Prisma.groupBy`). Formatted directly for Recharts components.
- **Response**: `200 OK`.

### `GET /api/budget/monthly-trend`
- **Description**: Monthly trend series for Recharts line/area charts.
- **Query Parameters**: `months` (default 6).
- **Response**: `200 OK`.

---

## 3. Receipts & Storage

### `POST /api/receipts/sign-upload`
- **Description**: Generate signed upload parameters for Cloudinary or AWS S3.
- **Validation**: Zod verified file formats (`image/jpeg`, `image/png`, `application/pdf`) and size (max 5 MB). Secret keys are never exposed.
- **Response**: `201 Created` with signed upload URL and form fields.

### `GET /api/receipts/[id]/url`
- **Description**: Generate short-lived signed download URL for receipt document.
- **Response**: `200 OK`.

---

## 4. Archive Search

### `GET /api/archive/search`
- **Description**: Search historical past events and expenses with pagination.
- **Query Parameters**: `q` (keyword), `from`, `to`, `venue`, `category`, `page`, `limit`.
- **Response**: `200 OK` with paginated event and expense records.

---

## 5. Reports & CSV Export

### `GET /api/reports/event/[id]`
- **Description**: Full summary report JSON for an event.
- **Response**: `200 OK`.

### `GET /api/reports/budget.csv`
- **Description**: Streamed RFC 4180 CSV export of budgets and expenses.
- **Authentication**: `ADMIN` or `HOD` role only.
- **Response**: `200 OK` with `Content-Type: text/csv`.

### `GET /api/reports/conflicts.csv`
- **Description**: Streamed RFC 4180 CSV export of conflict audit logs.
- **Authentication**: `ADMIN` or `HOD` role only.
- **Response**: `200 OK` with `Content-Type: text/csv`.
