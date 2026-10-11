# Expense Voucher Management System

Web app to create, approve and track employee expense vouchers, replacing the manual paper process.
Roles: **Employee**, **Director**, **Accounts Team**.

Tech used: React 19 (Vite) + Node.js / Express 5 + PostgreSQL, JWT auth, bcrypt for passwords, Multer for signature uploads, express-validator for validation. Plain CSS (no UI library).

## Features

- Login with JWT, role based pages and APIs (Employee / Director / Accounts)
- Employee: create voucher (saved as Draft), edit / delete draft, upload signature, submit for approval, track status, see rejection reason
- Director: pending approvals list, approve with signature, reject with reason, view all vouchers
- Accounts: view all vouchers, signatures and approval status, print voucher
- Search, filter (voucher no, employee, department, category, status, date range, amount range) and sort (click on table headers)
- Dashboard for every role
- Auto generated voucher number `VCH-<year>-<0001>`

## Folder structure

```
client/                 React frontend (Vite)
  src/api/              axios instance (adds JWT, handles 401)
  src/context/          AuthContext (logged in user)
  src/hooks/            useVoucherList (search/filter/sort), useDashboard
  src/components/       Navbar, ProtectedRoute, VoucherForm, VoucherTable,
                        VoucherFilters, DirectorAction, StatCard, StatusBadge
  src/pages/            Login, VoucherDetails + employee/ director/ accounts/
server/                 Express backend
  src/config/db.js      pg connection pool
  src/middleware/       auth (verifyToken, allowRoles), upload (multer), errorHandler
  src/routes/           auth, vouchers, dashboard (+ validation rules)
  src/controllers/      logic + SQL queries
  db/                   schema.sql, create / init / seed scripts
  uploads/              uploaded signature images
```

## Setup

### Requirements
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd server
npm install
cp .env.example .env      # then edit DATABASE_URL, JWT_SECRET
npm run db:setup          # creates database + tables + demo users
                          # (or run db:create, db:init, db:seed one by one)
npm run dev               # http://localhost:5000
```

> `npm run db:init` drops and re-creates the tables, so it also clears all data.

### Frontend
```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

Vite dev server proxies `/api` and `/uploads` to `localhost:5000`, so no CORS setup is needed in development.

### Environment variables (`server/.env`)

| Variable | Example | Use |
|----------|---------|-----|
| PORT | 5000 | API port |
| DATABASE_URL | postgres://postgres:password@localhost:5432/evms | Postgres connection |
| JWT_SECRET | any long random string | signing tokens |
| JWT_EXPIRES_IN | 1d | token expiry |
| CLIENT_URL | http://localhost:5173 | allowed CORS origin |

### Demo logins (password: `password123`)
| Role | Email |
|------|-------|
| Employee | employee@test.com |
| Employee | employee2@test.com |
| Director | director@test.com |
| Accounts | accounts@test.com |

## Database schema

File: [`server/db/schema.sql`](server/db/schema.sql). Two tables and one sequence.

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) UNIQUE | used for login |
| password_hash | VARCHAR(255) | bcrypt hash, never sent to frontend |
| role | VARCHAR(20) | CHECK in `employee`, `director`, `accounts` |
| employee_code | VARCHAR(30) | Employee ID (optional) |
| department | VARCHAR(100) | pre-filled in voucher form |
| signature_path | VARCHAR(255) | last uploaded signature, reused for next voucher / approval |
| created_at | TIMESTAMP | |

### `vouchers`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| voucher_no | VARCHAR(30) UNIQUE | `VCH-2026-0001`, from `voucher_no_seq` |
| voucher_date | DATE | default today |
| expense_date | DATE NOT NULL | cannot be in future |
| department | VARCHAR(100) NOT NULL | |
| title | VARCHAR(150) NOT NULL | expense title |
| category | VARCHAR(50) | Travel, Food, Accommodation, Office Supplies, Fuel, Communication, Other |
| description | TEXT | |
| amount | NUMERIC(12,2) NOT NULL | CHECK `amount > 0` |
| employee_id | INT FK -> users.id | owner of the voucher |
| employee_signature | VARCHAR(255) | image path, required before submit |
| status | VARCHAR(20) | CHECK in `draft`, `pending`, `approved`, `rejected` (default `draft`) |
| director_id | INT FK -> users.id | director who approved / rejected |
| director_signature | VARCHAR(255) | image path, required to approve |
| submitted_at | TIMESTAMP | |
| approved_at | TIMESTAMP | approval date |
| rejected_at | TIMESTAMP | |
| rejection_reason | TEXT | required to reject |
| created_at, updated_at | TIMESTAMP | audit info |

Indexes on `vouchers.employee_id` and `vouchers.status`.

`voucher_no_seq` is a Postgres sequence. Using a sequence (instead of counting rows) means two vouchers saved at the same time never get the same number, and a number is never reused after a draft is deleted.

### Status flow

```
draft --(employee submits, signature needed)--> pending --(director approves, signature needed)--> approved
                                                   \--(director rejects, reason needed)-------> rejected
```

## API documentation

Base URL: `http://localhost:5000/api`. All routes except login need header `Authorization: Bearer <token>`.
Errors are returned as `{ "message": "..." }` with status 400 (validation), 401 (no/invalid token), 403 (wrong role), 404 (not found or not allowed to see), 500 (server error).

### Auth
| Method | URL | Role | Body | Response |
|--------|-----|------|------|----------|
| POST | `/auth/login` | public | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | any | - | `{ user }` |

### Vouchers
| Method | URL | Role | Body / Query | Notes |
|--------|-----|------|--------------|-------|
| GET | `/vouchers` | any | query: `q, department, category, status, from, to, min, max, sort, order` | employee gets only own vouchers, director/accounts get all except drafts |
| GET | `/vouchers/:id` | any | - | same visibility rules as above |
| POST | `/vouchers` | employee | multipart: `expense_date, department, title, category, description, amount, signature (file)` | always saved as `draft`, returns created voucher (201) |
| PUT | `/vouchers/:id` | employee | same as create | only own `draft` vouchers |
| DELETE | `/vouchers/:id` | employee | - | only own `draft` vouchers |
| POST | `/vouchers/:id/submit` | employee | - | draft -> pending, needs employee signature |
| POST | `/vouchers/:id/approve` | director | multipart: `signature (file)` (optional if director already has a saved signature) | pending -> approved |
| POST | `/vouchers/:id/reject` | director | `{ reason }` | pending -> rejected, reason required (max 500 chars) |

List query params:
- `q` - search in voucher no, employee name and title
- `department` - partial match, `category`, `status` - exact
- `from`, `to` - expense date range (`YYYY-MM-DD`)
- `min`, `max` - amount range
- `sort` - one of `created, updated, date, amount, voucher_no, employee, department, status` (default `created`)
- `order` - `asc` / `desc` (default `desc`)

Example:
```
GET /api/vouchers?department=sales&status=approved&min=500&sort=amount&order=asc
```

Signature images are served from `http://localhost:5000/uploads/<file>` (png/jpg, max 2MB).

### Dashboard
| Method | URL | Role | Response `stats` |
|--------|-----|------|-------|
| GET | `/dashboard` | employee | `total, draft, pending, approved, rejected, total_claimed` + `recent` (5 own) |
| GET | `/dashboard` | director | `pending, approved_today, rejected_today, pending_amount` + `recent` (10 latest activity) |
| GET | `/dashboard` | accounts | `total, pending, approved, rejected, approved_amount` + `recent` (5 latest approved) |

## Assumptions

1. "Submitted" and "Pending Approval" are one status (`pending`) since a voucher goes to the Director as soon as it is submitted.
2. Drafts are private. Director and Accounts only see vouchers after they are submitted.
3. Approved and rejected vouchers are final. A rejected voucher can not be edited or resubmitted, the employee creates a new one.
4. Every new voucher is saved as draft first. "Save & Submit" in the form saves the draft and then submits it.
5. Signature is uploaded with the voucher (employee) or while approving (director). The last uploaded signature is stored in the user's profile and reused automatically next time, a new upload replaces it.
6. "Total Amount Claimed" on employee dashboard = sum of all submitted vouchers (pending + approved + rejected), drafts not counted.
7. "Approved Today" / "Rejected Today" use the server's date.
8. Expense date can not be in the future. Department is pre-filled from the user profile but can be changed.
9. Users are created by the seed script, there is no sign-up page (company internal app). Any user with role `director` can approve / reject.
10. Uploaded files are stored on local disk (`server/uploads`), not cloud storage.
11. Amount is in INR.
12. Voucher numbers keep increasing across years (`VCH-2027-0005` is possible), only the year part changes.
