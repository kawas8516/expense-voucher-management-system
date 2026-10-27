import mongoose from "mongoose";

// one document per action (login, voucher created / submitted / approved ...)
// voucherId points to vouchers.id in PostgreSQL
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "login_failed",
        "voucher_created",
        "voucher_updated",
        "voucher_deleted",
        "voucher_submitted",
        "voucher_approved",
        "voucher_rejected",
        "signature_updated",
      ],
    },
    voucherId: Number,
    voucherNo: String,
    user: {
      id: Number,
      name: String,
      role: String,
    },
    // extra info, different per action: { amount }, { changed: [...] }, { reason }, { email }
    details: mongoose.Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: "audit_logs" }
);

auditLogSchema.index({ voucherId: 1, createdAt: 1 }); // history of one voucher
auditLogSchema.index({ createdAt: -1 }); // latest activity

export default mongoose.model("AuditLog", auditLogSchema);
