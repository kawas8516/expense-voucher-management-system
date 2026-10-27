import { validationResult } from "express-validator";
import pool from "../config/db.js";
import { generateVoucherNo } from "../utils/voucherNumber.js";
import { saveFile } from "../utils/files.js";
import { logAudit } from "../utils/audit.js";
import { mongoReady } from "../config/mongo.js";
import AuditLog from "../models/AuditLog.js";

// voucher + employee name + director name
const SELECT_VOUCHER = `
  SELECT v.*,
         e.name AS employee_name,
         e.employee_code,
         d.name AS director_name
  FROM vouchers v
  JOIN users e ON e.id = v.employee_id
  LEFT JOIN users d ON d.id = v.director_id
`;

function sendValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    return true;
  }
  return false;
}

async function findVoucher(id) {
  const result = await pool.query(SELECT_VOUCHER + " WHERE v.id = $1", [id]);
  return result.rows[0];
}

// employee sees only own vouchers, director / accounts see everything except drafts
function canSee(user, voucher) {
  if (!voucher) return false;
  if (user.role === "employee") return voucher.employee_id === user.id;
  return voucher.status !== "draft";
}

// employee can only touch own draft vouchers
async function getOwnDraft(req, res) {
  const voucher = await findVoucher(req.params.id);
  if (!voucher || voucher.employee_id !== req.user.id) {
    res.status(404).json({ message: "Voucher not found" });
    return null;
  }
  if (voucher.status !== "draft") {
    res.status(400).json({ message: "Only draft vouchers can be changed" });
    return null;
  }
  return voucher;
}

// allowed sort columns (never put user text directly in ORDER BY)
const SORT_COLUMNS = {
  created: "v.created_at",
  updated: "v.updated_at",
  date: "v.expense_date",
  amount: "v.amount",
  voucher_no: "v.voucher_no",
  employee: "e.name",
  department: "v.department",
  status: "v.status",
};

// GET /api/vouchers?q=&department=&category=&status=&from=&to=&min=&max=&sort=&order=
export async function getVouchers(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const where = [];
  const params = [];
  // small helper so I don't have to count $1, $2 by hand
  function add(sql, value) {
    params.push(value);
    where.push(sql.replace("?", "$" + params.length));
  }

  if (req.user.role === "employee") {
    add("v.employee_id = ?", req.user.id);
  } else {
    // drafts are private to the employee
    where.push("v.status <> 'draft'");
  }

  const { q, department, category, status, from, to, min, max } = req.query;

  if (q) {
    params.push("%" + q + "%");
    where.push(`(v.voucher_no ILIKE $${params.length} OR e.name ILIKE $${params.length} OR v.title ILIKE $${params.length})`);
  }
  if (department) add("v.department ILIKE ?", "%" + department + "%");
  if (category) add("v.category = ?", category);
  if (status) add("v.status = ?", status);
  if (from) add("v.expense_date >= ?", from);
  if (to) add("v.expense_date <= ?", to);
  if (min) add("v.amount >= ?", min);
  if (max) add("v.amount <= ?", max);

  const sortCol = SORT_COLUMNS[req.query.sort] || "v.created_at";
  const order = req.query.order === "asc" ? "ASC" : "DESC";

  const sql =
    SELECT_VOUCHER + " WHERE " + where.join(" AND ") + ` ORDER BY ${sortCol} ${order}, v.id ${order}`;
  const result = await pool.query(sql, params);
  res.json(result.rows);
}

// GET /api/vouchers/:id
export async function getVoucher(req, res) {
  const voucher = await findVoucher(req.params.id);
  if (!canSee(req.user, voucher)) {
    return res.status(404).json({ message: "Voucher not found" });
  }
  res.json(voucher);
}

// GET /api/vouchers/:id/history  (audit events from MongoDB, oldest first)
export async function getVoucherHistory(req, res) {
  const voucher = await findVoucher(req.params.id);
  if (!canSee(req.user, voucher)) {
    return res.status(404).json({ message: "Voucher not found" });
  }
  if (!mongoReady()) {
    return res.json({ enabled: false, events: [] });
  }
  const events = await AuditLog.find({ voucherId: voucher.id }, { ip: 0 }).sort({ createdAt: 1 }).lean();
  res.json({ enabled: true, events });
}

// POST /api/vouchers  (always saved as draft first)
export async function createVoucher(req, res) {
  if (sendValidationErrors(req, res)) return;

  const { expense_date, department, title, category, description, amount } = req.body;

  // new signature uploaded -> use it and save to profile, else reuse saved one
  let signature = null;
  if (req.file) {
    signature = await saveFile(req.file);
    await pool.query("UPDATE users SET signature_path = $1 WHERE id = $2", [signature, req.user.id]);
  } else {
    const u = await pool.query("SELECT signature_path FROM users WHERE id = $1", [req.user.id]);
    signature = u.rows[0] ? u.rows[0].signature_path : null;
  }

  const voucherNo = await generateVoucherNo();

  const result = await pool.query(
    `INSERT INTO vouchers
       (voucher_no, expense_date, department, title, category, description, amount, employee_id, employee_signature)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [voucherNo, expense_date, department, title, category || null, description || null, amount, req.user.id, signature]
  );

  const voucher = await findVoucher(result.rows[0].id);
  logAudit(req, "voucher_created", { voucher, details: { amount: Number(voucher.amount) } });
  res.status(201).json(voucher);
}

// PUT /api/vouchers/:id
export async function updateVoucher(req, res) {
  if (sendValidationErrors(req, res)) return;

  const voucher = await getOwnDraft(req, res);
  if (!voucher) return;

  const { expense_date, department, title, category, description, amount } = req.body;

  let signature = voucher.employee_signature;
  if (req.file) {
    signature = await saveFile(req.file);
    await pool.query("UPDATE users SET signature_path = $1 WHERE id = $2", [signature, req.user.id]);
  }

  await pool.query(
    `UPDATE vouchers
     SET expense_date = $1, department = $2, title = $3, category = $4, description = $5,
         amount = $6, employee_signature = $7, updated_at = NOW()
     WHERE id = $8`,
    [expense_date, department, title, category || null, description || null, amount, signature, voucher.id]
  );

  const updated = await findVoucher(voucher.id);
  // which fields actually changed, for the history
  const changed = ["expense_date", "department", "title", "category", "description"].filter(
    (f) => (voucher[f] || "") !== (updated[f] || "")
  );
  if (Number(voucher.amount) !== Number(updated.amount)) changed.push("amount");
  if (req.file) changed.push("signature");
  logAudit(req, "voucher_updated", { voucher: updated, details: { changed } });
  res.json(updated);
}

// DELETE /api/vouchers/:id
export async function deleteVoucher(req, res) {
  const voucher = await getOwnDraft(req, res);
  if (!voucher) return;

  await pool.query("DELETE FROM vouchers WHERE id = $1", [voucher.id]);
  logAudit(req, "voucher_deleted", { voucher, details: { amount: Number(voucher.amount) } });
  res.json({ message: "Voucher deleted" });
}

// POST /api/vouchers/:id/approve  (director)
export async function approveVoucher(req, res) {
  if (sendValidationErrors(req, res)) return;

  // signature: new upload, else the one saved in director profile
  let signature = null;
  if (req.file) {
    signature = await saveFile(req.file);
  } else {
    const u = await pool.query("SELECT signature_path FROM users WHERE id = $1", [req.user.id]);
    signature = u.rows[0] ? u.rows[0].signature_path : null;
  }
  if (!signature) {
    return res.status(400).json({ message: "Director signature is required to approve" });
  }

  // "AND status = 'pending'" makes sure it is not approved/rejected twice
  const result = await pool.query(
    `UPDATE vouchers
     SET status = 'approved', director_id = $1, director_signature = $2,
         approved_at = NOW(), updated_at = NOW()
     WHERE id = $3 AND status = 'pending'
     RETURNING id`,
    [req.user.id, signature, req.params.id]
  );

  if (result.rows.length === 0) {
    // not approved, so remove the signature we just saved
    if (req.file) {
      await pool.query("DELETE FROM files WHERE id = $1", [signature.split("/").pop()]);
    }
    const exists = await findVoucher(req.params.id);
    if (!exists || exists.status === "draft") {
      return res.status(404).json({ message: "Voucher not found" });
    }
    return res.status(400).json({ message: "Only pending vouchers can be approved" });
  }

  if (req.file) {
    await pool.query("UPDATE users SET signature_path = $1 WHERE id = $2", [signature, req.user.id]);
  }
  const approved = await findVoucher(req.params.id);
  logAudit(req, "voucher_approved", { voucher: approved, details: { amount: Number(approved.amount) } });
  res.json(approved);
}

// POST /api/vouchers/bulk-approve  { ids: [..] }  (director)
// approves all the given vouchers that are still pending, with the director's saved signature
export async function bulkApprove(req, res) {
  if (sendValidationErrors(req, res)) return;

  const ids = [...new Set(req.body.ids.map(Number))];
  const u = await pool.query("SELECT signature_path FROM users WHERE id = $1", [req.user.id]);
  const signature = u.rows[0] ? u.rows[0].signature_path : null;
  if (!signature) {
    return res.status(400).json({ message: "Save your signature in My Profile before approving several vouchers" });
  }

  // one statement, so a voucher can't be approved twice even with two clicks
  const result = await pool.query(
    `UPDATE vouchers
     SET status = 'approved', director_id = $1, director_signature = $2,
         approved_at = NOW(), updated_at = NOW()
     WHERE id = ANY($3::int[]) AND status = 'pending'
     RETURNING id, voucher_no, amount`,
    [req.user.id, signature, ids]
  );

  for (const v of result.rows) {
    logAudit(req, "voucher_approved", { voucher: v, details: { amount: Number(v.amount), bulk: true } });
  }
  const done = new Set(result.rows.map((r) => r.id));
  res.json({
    approved: result.rows.map((r) => ({ id: r.id, voucher_no: r.voucher_no })),
    skipped: ids.filter((id) => !done.has(id)), // not pending any more, or not found
  });
}

// POST /api/vouchers/:id/reject  (director)
export async function rejectVoucher(req, res) {
  if (sendValidationErrors(req, res)) return;

  const result = await pool.query(
    `UPDATE vouchers
     SET status = 'rejected', director_id = $1, rejection_reason = $2,
         rejected_at = NOW(), updated_at = NOW()
     WHERE id = $3 AND status = 'pending'
     RETURNING id`,
    [req.user.id, req.body.reason, req.params.id]
  );

  if (result.rows.length === 0) {
    const exists = await findVoucher(req.params.id);
    if (!exists || exists.status === "draft") {
      return res.status(404).json({ message: "Voucher not found" });
    }
    return res.status(400).json({ message: "Only pending vouchers can be rejected" });
  }
  const rejected = await findVoucher(req.params.id);
  logAudit(req, "voucher_rejected", {
    voucher: rejected,
    details: { reason: req.body.reason, amount: Number(rejected.amount) },
  });
  res.json(rejected);
}

// POST /api/vouchers/:id/submit
export async function submitVoucher(req, res) {
  const voucher = await getOwnDraft(req, res);
  if (!voucher) return;

  if (!voucher.employee_signature) {
    return res.status(400).json({ message: "Please upload your signature before submitting" });
  }

  await pool.query(
    "UPDATE vouchers SET status = 'pending', submitted_at = NOW(), updated_at = NOW() WHERE id = $1",
    [voucher.id]
  );
  const submitted = await findVoucher(voucher.id);
  logAudit(req, "voucher_submitted", { voucher: submitted, details: { amount: Number(submitted.amount) } });
  res.json(submitted);
}
