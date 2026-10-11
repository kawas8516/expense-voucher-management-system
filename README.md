# 🧾 Expense Voucher Management System

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)

Digital expense vouchers. **Employees** submit, the **Director** approves (with signature) or rejects (with reason), and **Accounts** tracks approved vouchers for reimbursement.

🎬 [Demo video](docs/demo-walkthrough.webm) · 📸 [Screenshots](docs/screenshots)

![Approved voucher](docs/screenshots/11-voucher-approved.png)

## Features

- JWT login with role-based pages and APIs
- **Draft → Pending → Approved / Rejected** flow with auto voucher numbers
- Signature upload for the employee (submit) and the Director (approve)
- Role dashboards, plus search, filter and sort on every list, and print

## Setup

Needs Node.js 18+ and PostgreSQL 14+.

```bash
cd server && npm install
cp .env.example .env      # set DATABASE_URL, JWT_SECRET
npm run db:setup          # database + tables + demo users
npm run dev               # :5000

cd client && npm install
npm run dev               # :5173
```

Demo logins (password `password123`): `employee@test.com`, `employee2@test.com`, `director@test.com`, `accounts@test.com`

## Database Schema

There are three tables: **users** (role, department, saved signature), **vouchers** (all voucher, approval and audit fields) and **files** (signature images). A sequence generates unique voucher numbers.
→ [docs/DATABASE.md](docs/DATABASE.md)

## API

REST under `/api`: `auth/login`, `vouchers` (CRUD, `submit`, `approve`, `reject`, with search and filter query params), `dashboard` and `files/:id`. Every route except login uses a JWT and role checks.
→ [docs/API.md](docs/API.md)

## Assumptions

1. "Submitted" and "Pending Approval" are one status (`pending`).
2. Drafts are private. The Director and Accounts see only submitted vouchers.
3. Approved and rejected vouchers are final (no resubmit).
4. The last uploaded signature is saved and reused automatically.
5. Expense date can't be in the future. Currency is INR and "today" means IST.
6. Users come from the seed script (no sign-up page).

Deployment (Supabase + Render + Vercel): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
