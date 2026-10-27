export const CATEGORIES = ["Travel", "Food", "Accommodation", "Office Supplies", "Fuel", "Communication", "Other"];

export const STATUS_LABELS = {
  draft: "Draft",
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
};

// audit log actions (stored in MongoDB) -> words shown in the UI
export const AUDIT_LABELS = {
  voucher_created: "Created",
  voucher_updated: "Edited",
  voucher_deleted: "Deleted",
  voucher_submitted: "Submitted",
  voucher_approved: "Approved",
  voucher_rejected: "Rejected",
  login: "Logged in",
  login_failed: "Failed login",
  signature_updated: "Signature updated",
};

// audit action -> status badge colour
export const AUDIT_STATUS = {
  voucher_submitted: "pending",
  voucher_approved: "approved",
  voucher_rejected: "rejected",
};

// 2026-10-11 or timestamp -> 11/10/2026
export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value.length === 10 ? value + "T00:00:00" : value);
  return d.toLocaleDateString("en-IN");
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN");
}

export function formatAmount(value) {
  return "₹ " + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

// readable text for the "Details" column of an audit event
export function auditDetails(e) {
  const d = e.details || {};
  if (d.reason) return "Reason: " + d.reason;
  if (d.changed) return d.changed.length ? "Changed: " + d.changed.join(", ").replace(/_/g, " ") : "No changes";
  if (d.email) return "Email: " + d.email;
  if (d.amount !== undefined) return formatAmount(d.amount);
  return "-";
}

export function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
