# API Documentation

Base URL: `/api` (local: `http://localhost:5000/api`)

Every route except login, health and files needs `Authorization: Bearer <token>`.
Errors come back as `{ "message": "..." }`:

| Status | Meaning |
|---|---|
| 400 | validation failed, or action not allowed in the current status |
| 401 | missing, invalid or expired token |
| 403 | wrong role |
| 404 | not found, or not yours to see |
| 500 | server error (details only in server logs) |

## Auth

| Method | Endpoint | Role | Body | Response |
|---|---|---|---|---|
| POST | `/auth/login` | public | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | any | - | `{ user }` |

## Vouchers

| Method | Endpoint | Role | Body | Notes |
|---|---|---|---|---|
| GET | `/vouchers` | any | query below | employee: own vouchers. director / accounts: all except drafts |
| GET | `/vouchers/:id` | any | - | same visibility |
| POST | `/vouchers` | employee | multipart: `expense_date, department, title, category, description, amount, signature` | created as `draft` (201) |
| PUT | `/vouchers/:id` | employee | same as create | own drafts only |
| DELETE | `/vouchers/:id` | employee | - | own drafts only |
| POST | `/vouchers/:id/submit` | employee | - | draft → pending, needs employee signature |
| POST | `/vouchers/:id/approve` | director | multipart: `signature` (optional if one is saved) | pending → approved |
| POST | `/vouchers/:id/reject` | director | `{ reason }` | pending → rejected, reason 1-500 chars |
| GET | `/vouchers/:id/history` | any | - | audit events from MongoDB, oldest first: `{ enabled, events }`. Same visibility as the voucher. `enabled: false` when MongoDB isn't connected |

If no new signature file is sent, the user's last saved signature is used.

**List query params** (all optional)

| Param | Example | Match |
|---|---|---|
| `q` | `VCH-2026-0003`, `priya`, `hotel` | voucher no, employee name or title (partial) |
| `department` | `sales` | partial, case-insensitive |
| `category` | `Travel` | exact |
| `status` | `approved` | `draft / pending / approved / rejected` |
| `from`, `to` | `2026-09-01` | expense date range |
| `min`, `max` | `500` | amount range |
| `sort` | `amount` | `created, updated, date, amount, voucher_no, employee, department, status` |
| `order` | `asc` | `asc` / `desc` (default `desc`) |

```http
GET /api/vouchers?department=sales&status=approved&min=500&sort=amount&order=asc
```

## Dashboard

`GET /dashboard` returns `{ stats, recent }` for the logged-in role:

| Role | stats | recent |
|---|---|---|
| employee | `total, draft, pending, approved, rejected, total_claimed` | 5 latest own |
| director | `pending, approved_today, rejected_today, pending_amount` | 10 latest submitted / approved / rejected events from the MongoDB audit log (`activity: true`); falls back to the 10 latest vouchers without MongoDB |
| accounts | `total, pending, approved, rejected, approved_amount` | 5 latest approved |

## Files and health

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/files/:uuid` | signature image (png / jpg). Public, so `<img>` can load it; the random UUID is the protection |
| GET | `/health` | `{ "ok": true, "mongo": "connected" \| "disabled" }` |
