import AuditLog from "../models/AuditLog.js";
import { mongoReady } from "../config/mongo.js";

// save an audit event in MongoDB.
// fire and forget: the request never waits for it and never fails because of it
export function logAudit(req, action, { voucher, user, details } = {}) {
  if (!mongoReady()) return;

  const u = user || req.user;
  AuditLog.create({
    action,
    voucherId: voucher ? voucher.id : undefined,
    voucherNo: voucher ? voucher.voucher_no : undefined,
    user: u ? { id: u.id, name: u.name, role: u.role } : undefined,
    details,
    ip: req.ip,
  }).catch((err) => console.log("audit log failed:", err.message));
}
