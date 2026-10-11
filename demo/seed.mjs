// Seeds 10 sample vouchers (draft / pending / approved / rejected) through the API.
// Used by demo.mjs, and can be run alone against any deployment:
//   API_URL=https://your-api.onrender.com/api node seed.mjs
// Uses the signature images in demo/signatures. Run on a database that only has the demo users.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR_HERE = path.dirname(fileURLToPath(import.meta.url));
const PASSWORD = "password123";
let API = process.env.API_URL || "http://localhost:5000/api";
let DIR; // director token, set in seedVouchers

export const SIGN = {
  rahul: path.join(DIR_HERE, "signatures", "rahul.png"),
  priya: path.join(DIR_HERE, "signatures", "priya.png"),
  director: path.join(DIR_HERE, "signatures", "director.png"),
};

export async function api(method, url, token, body) {
  const opts = { method, headers: { Authorization: "Bearer " + token } };
  if (body instanceof FormData) opts.body = body;
  else if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API + url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${url}: ${data.message}`);
  return data;
}
export async function token(email) {
  const res = await fetch(API + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  return (await res.json()).token;
}
function signForm(file) {
  const f = new FormData();
  f.append("signature", new Blob([fs.readFileSync(file)], { type: "image/png" }), path.basename(file));
  return f;
}
async function createVoucher(tok, sign, v) {
  const f = signForm(sign);
  for (const k of ["expense_date", "department", "title", "category", "description", "amount"]) f.append(k, v[k]);
  const created = await api("POST", "/vouchers", tok, f);
  if (v.status !== "draft") await api("POST", `/vouchers/${created.id}/submit`, tok);
  if (v.status === "approved") await api("POST", `/vouchers/${created.id}/approve`, DIR, signForm(SIGN.director));
  if (v.status === "rejected") await api("POST", `/vouchers/${created.id}/reject`, DIR, { reason: v.reason });
  return created;
}

export async function seedVouchers(apiUrl = API) {
  API = apiUrl;
  const RAHUL = await token("employee@test.com");
  const PRIYA = await token("employee2@test.com");
  DIR = await token("director@test.com");

  const rahulVouchers = [
    { expense_date: "2026-09-08", department: "IT", title: "Flight to Bangalore for client meeting", category: "Travel", description: "Mumbai - Bangalore return ticket, IndiGo", amount: "8450", status: "approved" },
    { expense_date: "2026-09-09", department: "IT", title: "Hotel stay Bangalore (2 nights)", category: "Accommodation", description: "Hotel near client office, 9-11 Sept", amount: "6200", status: "approved" },
    { expense_date: "2026-09-30", department: "IT", title: "Broadband reimbursement - September", category: "Communication", description: "Home internet for WFH days", amount: "999", status: "pending" },
    { expense_date: "2026-10-03", department: "IT", title: "Team dinner after release", category: "Food", description: "Dinner for 6 people after v2.0 release", amount: "3150", status: "rejected", reason: "Team dinners need prior approval from HR. Please attach the HR approval mail and create a new voucher." },
    { expense_date: "2026-10-06", department: "IT", title: "Keyboard and mouse", category: "Office Supplies", description: "Old keyboard stopped working", amount: "1890", status: "draft" },
  ];
  const priyaVouchers = [
    { expense_date: "2026-09-12", department: "Sales", title: "Fuel for client visits - week 2", category: "Fuel", description: "Visits to Thane and Vashi clients", amount: "2400", status: "approved" },
    { expense_date: "2026-09-25", department: "Sales", title: "Client lunch - Mehta Traders", category: "Food", description: "Lunch meeting for new order discussion", amount: "1760", status: "approved" },
    { expense_date: "2026-10-01", department: "Sales", title: "Cab to Navi Mumbai expo", category: "Travel", description: "Return cab for trade expo", amount: "1340", status: "pending" },
    { expense_date: "2026-10-05", department: "Sales", title: "Mobile bill - October", category: "Communication", description: "Postpaid bill", amount: "699", status: "rejected", reason: "Mobile bill is already covered in the monthly phone allowance." },
    { expense_date: "2026-10-07", department: "Sales", title: "Sales brochures printing", category: "Office Supplies", description: "500 brochures for Diwali campaign", amount: "4500", status: "pending" },
  ];
  // mix the order so voucher numbers are not grouped by employee
  for (let i = 0; i < 5; i++) {
    await createVoucher(RAHUL, SIGN.rahul, rahulVouchers[i]);
    await createVoucher(PRIYA, SIGN.priya, priyaVouchers[i]);
  }
}

// run directly: node seed.mjs
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log("Seeding vouchers to", API);
  await seedVouchers();
  console.log("Done");
}
