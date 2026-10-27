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

// data for the two dashboard charts: amount by category, and amount per week (last 8 weeks)
// where = which vouchers count, written with the table alias v (fixed strings, not user input)
// dateCol = which date puts a voucher in a week
async function chartData(where, params, dateCol) {
  const byCategory = await pool.query(
    `SELECT COALESCE(v.category, 'Other') AS category, SUM(v.amount)::float AS amount, COUNT(*)::int AS count
     FROM vouchers v WHERE ${where}
     GROUP BY 1 ORDER BY amount DESC`,
    params
  );
  // weeks start on Monday (database timezone is IST)
  const byWeek = await pool.query(
    `SELECT to_char(w, 'YYYY-MM-DD') AS week, COALESCE(SUM(v.amount), 0)::float AS amount, COUNT(v.id)::int AS count
     FROM generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') AS w
     LEFT JOIN vouchers v ON date_trunc('week', v.${dateCol}) = w AND ${where}
     GROUP BY w ORDER BY w`,
    params
  );
  return { byCategory: byCategory.rows, byWeek: byWeek.rows };
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
    const charts = await chartData("v.employee_id = $1 AND v.status <> 'draft'", [req.user.id], "submitted_at");
    return res.json({ stats: toNumbers(stats.rows[0]), recent: recent.rows, charts });
  }

  if (role === "director") {
    const stats = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'pending') AS pending,
              COUNT(*) FILTER (WHERE status = 'approved' AND approved_at::date = CURRENT_DATE) AS approved_today,
              COUNT(*) FILTER (WHERE status = 'rejected' AND rejected_at::date = CURRENT_DATE) AS rejected_today,
              COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount
       FROM vouchers`
    );
    const charts = await chartData("v.status <> 'draft'", [], "submitted_at");
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
      return res.json({ stats: toNumbers(stats.rows[0]), activity: true, recent: events, charts });
    }
    const recent = await pool.query(
      RECENT_SELECT + " WHERE v.status <> 'draft' ORDER BY v.updated_at DESC LIMIT 10"
    );
    return res.json({ stats: toNumbers(stats.rows[0]), recent: recent.rows, charts });
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
  const charts = await chartData("v.status = 'approved'", [], "approved_at");
  res.json({ stats: toNumbers(stats.rows[0]), recent: recent.rows, charts });
}
