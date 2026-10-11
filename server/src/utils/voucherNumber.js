import pool from "../config/db.js";

// format: VCH-2026-0001
// uses a postgres sequence so two people saving at same time never get same number
export async function generateVoucherNo() {
  const year = new Date().getFullYear();
  const result = await pool.query("SELECT nextval('voucher_no_seq') AS n");
  return `VCH-${year}-${String(result.rows[0].n).padStart(4, "0")}`;
}
