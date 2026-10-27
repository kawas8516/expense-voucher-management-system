import { validationResult } from "express-validator";
import pool from "../config/db.js";
import { mongoReady } from "../config/mongo.js";
import AuditLog from "../models/AuditLog.js";

const PAGE_SIZE = 25;
const DRAFT_ACTIONS = ["voucher_created", "voucher_updated"];

// "Rahul (S)" -> safe text for a regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/audit?action=&user=&from=&to=&page=   (director, accounts)
export async function getAuditLog(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  if (!mongoReady()) {
    return res.json({ enabled: false, events: [], total: 0, page: 1, pages: 0 });
  }

  const { action, user, from, to } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const filter = {};
  if (action) filter.action = action;
  if (user) filter["user.name"] = { $regex: escapeRegex(user), $options: "i" };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from + "T00:00:00+05:30");
    if (to) filter.createdAt.$lte = new Date(to + "T23:59:59.999+05:30");
  }

  // drafts are private to the employee: hide events of vouchers that are still drafts,
  // and deleted vouchers (only drafts can be deleted)
  const drafts = await pool.query("SELECT id FROM vouchers WHERE status = 'draft'");
  filter.$nor = [
    { action: { $in: DRAFT_ACTIONS }, voucherId: { $in: drafts.rows.map((r) => r.id) } },
    { action: "voucher_deleted" },
  ];

  const total = await AuditLog.countDocuments(filter);
  const events = await AuditLog.find(filter, { ip: 0 })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  res.json({ enabled: true, events, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}
