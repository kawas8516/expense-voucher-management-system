// creates audit log events (MongoDB) for vouchers that existed before the audit log,
// using the timestamps already stored in PostgreSQL.
// safe to run more than once: vouchers that already have events are skipped.
// run: npm run db:backfill-audit
import mongoose from "mongoose";
import pool from "../src/config/db.js";
import AuditLog from "../src/models/AuditLog.js";

if (!process.env.MONGO_URL) {
  console.log("MONGO_URL not set, nothing to do");
  await pool.end();
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });

  const { rows } = await pool.query(`
    SELECT v.*, e.name AS employee_name, e.role AS employee_role,
           d.name AS director_name, d.role AS director_role
    FROM vouchers v
    JOIN users e ON e.id = v.employee_id
    LEFT JOIN users d ON d.id = v.director_id
    ORDER BY v.id
  `);

  let added = 0;
  for (const v of rows) {
    if (await AuditLog.exists({ voucherId: v.id })) continue;

    const employee = { id: v.employee_id, name: v.employee_name, role: v.employee_role };
    const director = v.director_id ? { id: v.director_id, name: v.director_name, role: v.director_role } : null;
    const base = { voucherId: v.id, voucherNo: v.voucher_no };
    const amount = Number(v.amount);
    const events = [{ ...base, action: "voucher_created", user: employee, details: { amount }, createdAt: v.created_at }];

    if (v.submitted_at) {
      events.push({ ...base, action: "voucher_submitted", user: employee, details: { amount }, createdAt: v.submitted_at });
    }
    if (v.approved_at) {
      events.push({ ...base, action: "voucher_approved", user: director, details: { amount }, createdAt: v.approved_at });
    }
    if (v.rejected_at) {
      events.push({
        ...base,
        action: "voucher_rejected",
        user: director,
        details: { reason: v.rejection_reason, amount },
        createdAt: v.rejected_at,
      });
    }

    // insertMany keeps the given createdAt (create() would overwrite it)
    await AuditLog.collection.insertMany(events);
    added += events.length;
  }
  console.log(`Backfill done: ${added} event(s) added for ${rows.length} voucher(s)`);
} catch (err) {
  console.log("Backfill failed:", err.message);
} finally {
  await pool.end();
  await mongoose.disconnect();
}
