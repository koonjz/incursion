# Expenses & Budget Backend Integration Guide

This guide describes the backend APIs and services implemented for the **Expenses & Budget Management** module pulled from branch `kanishtha-1`.

---

## 1. Endpoints Overview

| Method | Path | Description | Access / Roles |
|---|---|---|---|
| `GET` | `/api/expenses/claims` | List all expense claims with search, category & status filtering, pagination | Authenticated / Reviewer |
| `POST` | `/api/expenses/claims` | Create new expense claim with category & receipt attachment | ACM Core / Executive |
| `GET` | `/api/expenses/claims/:id` | Fetch single claim by ID with receipt details | Authenticated |
| `PATCH` | `/api/expenses/claims/:id` | Update claim status (`approved`, `rejected`, `pending`) | ACM Core / Admin |
| `DELETE` | `/api/expenses/claims/:id` | Delete an expense claim | ACM Core / Admin |
| `GET` | `/api/expenses/metrics` | Semester financial governance metrics (grant, disbursed, ledger, utilization %) | All roles |
| `GET` | `/api/expenses/category-caps` | Sub-caps tracking across 6 institutional categories | All roles |
| `GET` | `/api/expenses/event-variance` | Event-level planned vs actual variance analysis (focus: Hackathon) | All roles |
| `GET` | `/api/expenses/export` | Direct CSV file download of claims ledger | ACM Core / Executive |

---

## 2. Category & Audit Status Mapping

The frontend types (`lib/types/expenses.ts`) map cleanly to the database schema:

| Frontend UI Category | Prisma `ExpenseCategory` | Default Cap (INR) |
|---|---|---|
| Food & Catering | `CATERING` | ₹25,000 |
| Equipment & Hardware | `EQUIPMENT` | ₹25,000 |
| Marketing & Swag | `MARKETING` | ₹15,000 |
| Transportation | `TRAVEL` | ₹10,000 |
| Venue & Audio | `VENUE` | ₹15,000 |
| Printing & Certificates | `MISCELLANEOUS` | ₹10,000 |

---

## 3. Client Helper Functions

Import from `@/lib/api/expensesClient`:
- `fetchClaims(filters)`: Retrieves live claims from `/api/expenses/claims`
- `createExpenseClaim(claimData)`: Posts new claim to backend
- `fetchExpenseMetrics()`: Fetches live metrics
- `fetchCategoryCaps()`: Fetches category caps
- `fetchEventVariance(eventQuery)`: Fetches variance data

---

## 4. Verification

Run the test suite:
```bash
npm run test tests/backend/claims.test.ts
```
