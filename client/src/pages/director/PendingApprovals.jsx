import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMsg } from "../../api/axios";
import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import { useVoucherList } from "../../hooks/useVoucherList";
import { formatAmount } from "../../utils/helpers";

const PENDING = { status: "pending" };

function PendingApprovals() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [actionError, setActionError] = useState("");

  // oldest first, so old requests are not forgotten
  const { vouchers, error, loading, sort, toggleSort, setFilters, reload } = useVoucherList(PENDING, {
    sort: "created",
    order: "asc",
  });

  const total = vouchers.reduce((sum, v) => sum + Number(v.amount), 0);

  // approve with the director's saved signature
  async function approve(v) {
    if (!window.confirm(`Approve ${v.voucher_no} (${formatAmount(v.amount)})?`)) return;
    setMsg("");
    setActionError("");
    try {
      await api.post(`/vouchers/${v.id}/approve`, new FormData());
      setMsg(`${v.voucher_no} approved`);
      reload();
    } catch (err) {
      // no saved signature yet -> open the voucher to upload one
      if (getErrorMsg(err).includes("signature")) {
        navigate(`/vouchers/${v.id}`, { state: { msg: "Upload your signature once to approve" } });
        return;
      }
      setActionError(getErrorMsg(err));
    }
  }

  async function reject(v) {
    const reason = window.prompt(`Reason for rejecting ${v.voucher_no}:`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      setActionError("Rejection reason is required");
      return;
    }
    setMsg("");
    setActionError("");
    try {
      await api.post(`/vouchers/${v.id}/reject`, { reason: reason.trim() });
      setMsg(`${v.voucher_no} rejected`);
      reload();
    } catch (err) {
      setActionError(getErrorMsg(err));
    }
  }

  return (
    <div className="page">
      <h2>Pending Approvals</h2>
      <VoucherFilters onSearch={setFilters} hideStatus />

      {msg && <div className="success">{msg}</div>}
      {(error || actionError) && <div className="alert">{error || actionError}</div>}
      <p className="small">
        {loading ? "Loading..." : `${vouchers.length} voucher(s) waiting | Total: ${formatAmount(total)}`}
      </p>
      <VoucherTable
        vouchers={vouchers}
        sort={sort}
        onSort={toggleSort}
        actions={(v) => (
          <>
            <button type="button" className="btn-sm" onClick={() => approve(v)}>Approve</button>
            <button type="button" className="btn-sm btn-danger" onClick={() => reject(v)}>Reject</button>
          </>
        )}
      />
    </div>
  );
}

export default PendingApprovals;
