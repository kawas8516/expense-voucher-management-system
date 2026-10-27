// loads a realistic sample dataset into BOTH databases:
//   PostgreSQL (DATABASE_URL): 9 users with signatures, ~45 vouchers over the last 60 days
//   MongoDB    (MONGO_URL)   : audit log events on the same timeline (logins, created, edited,
//                               submitted, approved, rejected)
// it RESETS both first (schema.sql + empty audit_logs), so hosted databases need --force:
//   npm run db:seed-demo -- --force
// signatures come from demo/signatures/*.png (made by demo/signatures.mjs)
// the data is the same every run (fixed random seed), only dates move with "today"
import fs from "fs";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import pool from "../src/config/db.js";
import AuditLog from "../src/models/AuditLog.js";

const force = process.argv.includes("--force");
const isLocal = (url) => /(@|\/\/)(localhost|127\.0\.0\.1)[:/]/.test(url || "");
for (const [name, url] of [["DATABASE_URL", process.env.DATABASE_URL], ["MONGO_URL", process.env.MONGO_URL]]) {
  if (url && !isLocal(url) && !force) {
    console.log(`${name} is not a local database. This deletes all its data.`);
    console.log("Stopped. Run `npm run db:seed-demo -- --force` if you really want to reset it.");
    process.exit(1);
  }
}

// ---------- small helpers ----------
let seed = 20261027;
function rand() {
  // mulberry32: same numbers every run
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.now();

// a time on the day `daysAgo` days back, between 9:00 and 19:00 IST
function onDay(daysAgo, minHour = 9, maxHour = 19) {
  const ist = new Date(NOW + 5.5 * HOUR); // shift so getUTC* gives IST wall clock
  const midnightIst = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * HOUR;
  return new Date(midnightIst - daysAgo * DAY + randInt(minHour * 60, maxHour * 60) * 60 * 1000);
}
// "YYYY-MM-DD" of a Date in IST
const istDate = (d) => new Date(d.getTime() + 5.5 * HOUR).toISOString().slice(0, 10);
const later = (d, minH, maxH) => new Date(d.getTime() + randInt(minH * 60, maxH * 60) * 60 * 1000);
const notFuture = (d) => (d.getTime() > NOW - 20 * 60 * 1000 ? new Date(NOW - randInt(20, 120) * 60 * 1000) : d);

// ---------- users ----------
const USERS = [
  { key: "rahul", name: "Rahul Sharma", email: "employee@test.com", role: "employee", code: "EMP001", dept: "IT" },
  { key: "priya", name: "Priya Mehta", email: "employee2@test.com", role: "employee", code: "EMP002", dept: "Sales" },
  { key: "director", name: "Anil Verma", email: "director@test.com", role: "director", code: "DIR001", dept: "Management" },
  { key: "accounts", name: "Sneha Joshi", email: "accounts@test.com", role: "accounts", code: "ACC001", dept: "Accounts" },
  { key: "arjun", name: "Arjun Nair", email: "arjun.nair@test.com", role: "employee", code: "EMP003", dept: "Operations" },
  { key: "kavya", name: "Kavya Iyer", email: "kavya.iyer@test.com", role: "employee", code: "EMP004", dept: "HR" },
  { key: "rohan", name: "Rohan Desai", email: "rohan.desai@test.com", role: "employee", code: "EMP005", dept: "Marketing" },
  { key: "fatima", name: "Fatima Shaikh", email: "fatima.shaikh@test.com", role: "employee", code: "EMP006", dept: "IT" },
  { key: "vikram", name: "Vikram Patil", email: "vikram.patil@test.com", role: "employee", code: "EMP007", dept: "Sales" },
];

// ---------- vouchers ----------
// the original sample vouchers (the demo video and README screenshots use these titles)
const FIXED = [
  { by: "rahul", title: "Flight to Bangalore for client meeting", category: "Travel", amount: 8450, description: "Mumbai - Bangalore return ticket, IndiGo", status: "approved", age: 48 },
  { by: "priya", title: "Fuel for client visits - week 2", category: "Fuel", amount: 2400, description: "Visits to Thane and Vashi clients", status: "approved", age: 45 },
  { by: "rahul", title: "Hotel stay Bangalore (2 nights)", category: "Accommodation", amount: 6200, description: "Hotel near client office", status: "approved", age: 47 },
  { by: "priya", title: "Client lunch - Mehta Traders", category: "Food", amount: 1760, description: "Lunch meeting for new order discussion", status: "approved", age: 32 },
  { by: "rahul", title: "Broadband reimbursement - September", category: "Communication", amount: 999, description: "Home internet for WFH days", status: "pending", age: 20 },
  { by: "priya", title: "Cab to Navi Mumbai expo", category: "Travel", amount: 1340, description: "Return cab for trade expo", status: "pending", age: 14 },
  { by: "rahul", title: "Team dinner after release", category: "Food", amount: 3150, description: "Dinner for 6 people after v2.0 release", status: "rejected", age: 16, reason: "Team dinners need prior approval from HR. Please attach the HR approval mail and create a new voucher." },
  { by: "priya", title: "Mobile bill - October", category: "Communication", amount: 699, description: "Postpaid bill", status: "rejected", age: 9, reason: "Mobile bill is already covered in the monthly phone allowance." },
  { by: "rahul", title: "Keyboard and mouse", category: "Office Supplies", amount: 1890, description: "Old keyboard stopped working", status: "draft", age: 6 },
  { by: "priya", title: "Sales brochures printing", category: "Office Supplies", amount: 4500, description: "500 brochures for Diwali campaign", status: "pending", age: 5 },
];

// building blocks for the generated vouchers: [title, category, min amount, max amount, description]
const TEMPLATES = [
  ["Cab to airport", "Travel", 600, 1400, "Uber from office to airport"],
  ["Train tickets - Pune client visit", "Travel", 400, 1200, "Deccan Queen, 2 tickets"],
  ["Flight to Delhi - vendor audit", "Travel", 5200, 9800, "Return ticket, economy"],
  ["Hotel stay Pune (1 night)", "Accommodation", 2800, 5200, "Stay for client workshop"],
  ["Guest house - Chennai site visit", "Accommodation", 1800, 3600, "2 nights near the site"],
  ["Lunch with client", "Food", 900, 2600, "Business lunch"],
  ["Team snacks - sprint review", "Food", 450, 1200, "Snacks for 10 people"],
  ["Working dinner - quarter close", "Food", 1200, 3400, "Late night work, dinner for 4"],
  ["Printer cartridges", "Office Supplies", 1100, 3200, "Black + colour cartridges"],
  ["Whiteboard markers and stationery", "Office Supplies", 300, 900, "Monthly stationery"],
  ["External monitor cable", "Office Supplies", 450, 1300, "HDMI cable and adapter"],
  ["Fuel - field visits", "Fuel", 900, 3200, "Field visits around Mumbai"],
  ["Fuel - warehouse trips", "Fuel", 700, 2200, "Trips to Bhiwandi warehouse"],
  ["Mobile data recharge", "Communication", 299, 799, "Data pack for travel days"],
  ["Courier charges - documents", "Other", 150, 650, "Courier to head office"],
  ["Training workshop fee", "Other", 2500, 7500, "One day workshop"],
  ["Recruitment drive - campus travel", "Travel", 1500, 4200, "Travel for campus hiring"],
  ["Marketing event stall material", "Other", 3500, 9000, "Standee and banners"],
];
const REJECT_REASONS = [
  "Original bill is missing, please attach the invoice.",
  "Amount is higher than the policy limit for this category.",
  "Personal expense, not reimbursable.",
  "Duplicate of an earlier voucher.",
  "Expense date is outside the claim window.",
];
const EMPLOYEES = USERS.filter((u) => u.role === "employee").map((u) => u.key);

// 35 generated vouchers with this status mix (+ the 10 fixed ones above)
const statusBag = [
  ...Array(18).fill("approved"),
  ...Array(7).fill("pending"),
  ...Array(5).fill("rejected"),
  ...Array(5).fill("draft"),
];
const generated = statusBag.map((status, i) => {
  const [title, category, min, max, description] = pick(TEMPLATES);
  return {
    by: i < 6 ? EMPLOYEES[2 + (i % 5)] : pick(EMPLOYEES), // make sure every new employee has some
    title,
    category,
    amount: Math.round(randInt(min, max) / 10) * 10,
    description,
    status,
    age: status === "draft" ? randInt(0, 10) : status === "pending" ? randInt(1, 18) : randInt(3, 58),
    reason: status === "rejected" ? pick(REJECT_REASONS) : undefined,
  };
});
const VOUCHERS = [...FIXED, ...generated];

// a few decisions happen today, so "Approved Today" / "Rejected Today" are not zero
let todayApproved = 0, todayRejected = 0;
for (const v of generated) {
  if (v.status === "approved" && todayApproved < 2 && v.age > 3) { v.decidedToday = true; todayApproved++; }
  if (v.status === "rejected" && todayRejected < 1 && v.age > 3) { v.decidedToday = true; todayRejected++; }
}

// ---------- build the timeline ----------
for (const v of VOUCHERS) {
  v.created = onDay(v.age);
  v.expense = new Date(v.created.getTime() - randInt(0, 5) * DAY);
  v.edited = v.status !== "draft" ? rand() < 0.3 : rand() < 0.5;
  if (v.edited) v.editedAt = notFuture(later(v.created, 1, 20));
  if (v.status !== "draft") v.submitted = notFuture(later(v.editedAt || v.created, 1, 30));
  if (v.status === "approved" || v.status === "rejected") {
    v.decided = v.decidedToday ? onDay(0, 9, 12) : later(v.submitted, 6, 96);
    v.decided = notFuture(v.decided < v.submitted ? later(v.submitted, 1, 3) : v.decided);
  }
  v.updated = v.decided || v.submitted || v.editedAt || v.created;
}
VOUCHERS.sort((a, b) => a.created - b.created);

// ---------- write PostgreSQL ----------
const sigDir = new URL("../../demo/signatures/", import.meta.url);
const ids = {};
const sigs = {};
try {
  await pool.query(fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  const hash = await bcrypt.hash("password123", 10);

  for (const u of USERS) {
    const png = fs.readFileSync(new URL(u.key + ".png", sigDir));
    const f = await pool.query("INSERT INTO files (mime, data) VALUES ('image/png', $1) RETURNING id", [png]);
    sigs[u.key] = "/api/files/" + f.rows[0].id;
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, employee_code, department, signature_path, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [u.name, u.email, hash, u.role, u.code, u.dept, sigs[u.key], new Date(NOW - 70 * DAY)]
    );
    ids[u.key] = r.rows[0].id;
  }

  let n = 0;
  for (const v of VOUCHERS) {
    n++;
    const emp = USERS.find((u) => u.key === v.by);
    v.voucher_no = `VCH-${v.created.getFullYear()}-${String(n).padStart(4, "0")}`;
    const hasSign = v.status !== "draft" || rand() < 0.5;
    const r = await pool.query(
      `INSERT INTO vouchers
         (voucher_no, voucher_date, expense_date, department, title, category, description, amount,
          employee_id, employee_signature, status, director_id, director_signature,
          submitted_at, approved_at, rejected_at, rejection_reason, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [
        v.voucher_no, istDate(v.created), istDate(v.expense), emp.dept, v.title, v.category, v.description, v.amount,
        ids[v.by], hasSign ? sigs[v.by] : null, v.status,
        v.decided ? ids.director : null,
        v.status === "approved" ? sigs.director : null,
        v.submitted || null,
        v.status === "approved" ? v.decided : null,
        v.status === "rejected" ? v.decided : null,
        v.reason || null, v.created, v.updated,
      ]
    );
    v.id = r.rows[0].id;
  }
  await pool.query("SELECT setval('voucher_no_seq', $1)", [n]);
  console.log(`PostgreSQL: ${USERS.length} users, ${VOUCHERS.length} vouchers`);
} catch (err) {
  console.log("PostgreSQL seed failed:", err.message);
  await pool.end();
  process.exit(1);
}
await pool.end();

// ---------- write MongoDB audit log ----------
if (!process.env.MONGO_URL) {
  console.log("MONGO_URL not set, audit log skipped");
  process.exit(0);
}
const userInfo = (key) => {
  const u = USERS.find((x) => x.key === key);
  return { id: ids[key], name: u.name, role: u.role };
};
const ip = () => `203.0.113.${randInt(10, 240)}`; // documentation IP range
const events = [];
const lastLogin = {}; // one login per user per day before their first action
function login(key, at) {
  const day = istDate(at);
  if (lastLogin[key] === day) return;
  lastLogin[key] = day;
  events.push({ action: "login", user: userInfo(key), ip: ip(), createdAt: new Date(at.getTime() - randInt(2, 25) * 60 * 1000) });
}
function add(key, action, v, at, details) {
  login(key, at);
  events.push({ action, voucherId: v.id, voucherNo: v.voucher_no, user: userInfo(key), details, ip: ip(), createdAt: at });
}
for (const v of VOUCHERS) {
  add(v.by, "voucher_created", v, v.created, { amount: v.amount });
  if (v.edited) {
    const changed = ["amount", "description", "title", "expense_date"].filter(() => rand() < 0.5);
    add(v.by, "voucher_updated", v, v.editedAt, { changed: changed.length ? changed : ["description"] });
  }
  if (v.submitted) add(v.by, "voucher_submitted", v, v.submitted, { amount: v.amount });
  if (v.status === "approved") add("director", "voucher_approved", v, v.decided, { amount: v.amount });
  if (v.status === "rejected") add("director", "voucher_rejected", v, v.decided, { reason: v.reason, amount: v.amount });
}
// accounts team checks approved vouchers now and then
for (let d = 55; d >= 0; d -= 7) login("accounts", onDay(d, 10, 17));
// a couple of failed logins (wrong password, unknown email)
events.push({ action: "login_failed", user: userInfo("rahul"), details: { email: "employee@test.com" }, ip: ip(), createdAt: onDay(12) });
events.push({ action: "login_failed", details: { email: "admin@test.com" }, ip: ip(), createdAt: onDay(4) });
events.sort((a, b) => a.createdAt - b.createdAt);

try {
  await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 15000 });
  await AuditLog.deleteMany({});
  await AuditLog.syncIndexes();
  // insertMany on the raw collection keeps the backdated createdAt
  await AuditLog.collection.insertMany(events);
  console.log(`MongoDB: ${events.length} audit events`);
} catch (err) {
  console.log("MongoDB seed failed:", err.message);
} finally {
  await mongoose.disconnect();
}
