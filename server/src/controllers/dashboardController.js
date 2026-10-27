import pool from "../config/db.js";
import { mongoReady } from "../config/mongo.js";
import AuditLog from "../models/AuditLog.js";

const RECENT_SELECT = `
  SELECT v.id, v.voucher_no, v.title, v.department, v.category, v.amount, v.status,
         v.expense_date, v.updated_at, v.approved_at, e.name AS employee_name
  FROM vouchers v
  JOIN users e ON e.id = v.employee_id
`;

// pg gives COUNT/SUM as strings, convert to numbers
function toNumbers(row) {
  const out = {};
  for (const key in row) out[key] = Number(row[key]);
  return out;
}

// GET /api/dashboard  (different numbers for each role)
export async function getStats(req, res) {
  const role = req.user.role;

  if (role === "employee") {
    const stats = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'draft')    AS draft,
              COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
              COUNT(*) FILTER (WHERE status = 'approved') AS approved,
              COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
              COALESCE(SUM(amount) FILTER (WHERE status <> 'draft'), 0) AS total_claimed
       FROM vouchers WHERE employee_id = $1`,
      [req.user.id]
    );
    const recent = await pool.query(
      RECENT_SELECT + " WHERE v.employee_id = $1 ORDER BY v.updated_at DESC LIMIT 5",
      [req.user.id]
    );
    return res.json({ stats: toNumbers(stats.rows[0]), recent: recent.rows });
  }

  if (role === "director") {
    const stats = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'pending') AS pending,
              COUNT(*) FILTER (WHERE status = 'approved' AND approved_at::date = CURRENT_DATE) AS approved_today,
              COUNT(*) FILTER (WHERE status = 'rejected' AND rejected_at::date = CURRENT_DATE) AS rejected_today,
              COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount
       FROM vouchers`
    );
    // recent activity comes from the MongoDB audit log when it is available
    // (only submitted / approved / rejected, draft activity is private to the employee)
    if (mongoReady()) {
      const events = await AuditLog.find(
        { action: { $in: ["voucher_submitted", "voucher_approved", "voucher_rejected"] } },
        { ip: 0 }
      )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return res.json({ stats: toNumbers(stats.rows[0]), activity: true, recent: events });
    }
    const recent = await pool.query(
      RECENT_SELECT + " WHERE v.status <> 'draft' ORDER BY v.updated_at DESC LIMIT 10"
    );
    return res.json({ stats: toNumbers(stats.rows[0]), recent: recent.rows });
  }

  // accounts
  const stats = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
            COUNT(*) FILTER (WHERE status = 'approved') AS approved,
            COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
            COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS approved_amount
     FROM vouchers WHERE status <> 'draft'`
  );
  const recent = await pool.query(
    RECENT_SELECT + " WHERE v.status = 'approved' ORDER BY v.approved_at DESC LIMIT 5"
  );
  res.json({ stats: toNumbers(stats.rows[0]), recent: recent.rows });
}
