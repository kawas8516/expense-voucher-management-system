import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMsg } from "../../api/axios";
import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import Icon from "../../components/Icon";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useToast } from "../../context/toast";
import { formatAmount } from "../../utils/helpers";

const PENDING = { status: "pending" };

function PendingApprovals() {
  const navigate = useNavigate();
  const toast = useToast();
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);

  // oldest first, so old requests are not forgotten
  const { vouchers, error, loading, sort, toggleSort, setFilters, reload } = useVoucherList(PENDING, {
    sort: "created",
    order: "asc",
  });

  const total = vouchers.reduce((sum, v) => sum + Number(v.amount), 0);
  // only count ticks for vouchers still in the list (after a search some may be hidden)
  const picked = vouchers.filter((v) => selected.has(v.id));
  const pickedTotal = picked.reduce((sum, v) => sum + Number(v.amount), 0);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    const allPicked = vouchers.length > 0 && vouchers.every((v) => selected.has(v.id));
    setSelected(allPicked ? new Set() : new Set(vouchers.map((v) => v.id)));
  }

  // approve with the director's saved signature
  async function approve(v) {
    if (!window.confirm(`Approve ${v.voucher_no} (${formatAmount(v.amount)})?`)) return;
    try {
      await api.post(`/vouchers/${v.id}/approve`, new FormData());
      toast(`${v.voucher_no} approved`);
      reload();
    } catch (err) {
      // no saved signature yet -> open the voucher to upload one
      if (getErrorMsg(err).includes("signature")) {
        navigate(`/vouchers/${v.id}`, { state: { msg: "Upload your signature once to approve" } });
        return;
      }
      toast(getErrorMsg(err), "error");
    }
  }

  async function approveSelected() {
    if (!window.confirm(`Approve ${picked.length} voucher(s), total ${formatAmount(pickedTotal)}?`)) return;
    setBusy(true);
    try {
      const res = await api.post("/vouchers/bulk-approve", { ids: picked.map((v) => v.id) });
      const n = res.data.approved.length;
      const skipped = res.data.skipped.length;
      toast(`${n} voucher(s) approved` + (skipped ? `, ${skipped} skipped (no longer pending)` : ""));
      setSelected(new Set());
      reload();
    } catch (err) {
      toast(getErrorMsg(err), "error");
    }
    setBusy(false);
  }

  async function reject(v) {
    const reason = window.prompt(`Reason for rejecting ${v.voucher_no}:`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      toast("Rejection reason is required", "error");
      return;
    }
    try {
      await api.post(`/vouchers/${v.id}/reject`, { reason: reason.trim() });
      toast(`${v.voucher_no} rejected`);
      reload();
    } catch (err) {
      toast(getErrorMsg(err), "error");
    }
  }

  return (
    <div className="page">
      <h2>Pending Approvals</h2>
      <VoucherFilters onSearch={setFilters} hideStatus />

      {error && <div className="alert">{error}</div>}
      <div className="list-head">
        <p className="small">
          {loading ? "Loading..." : `${vouchers.length} voucher(s) waiting | Total: ${formatAmount(total)}`}
        </p>
        <div className="list-actions">
          <button type="button" onClick={approveSelected} disabled={busy || picked.length === 0}>
            <Icon name="check" /> Approve selected{picked.length ? ` (${picked.length}, ${formatAmount(pickedTotal)})` : ""}
          </button>
        </div>
      </div>
      <VoucherTable
        vouchers={vouchers}
        sort={sort}
        onSort={toggleSort}
        showStatus={false} // every row here is pending
        selected={selected}
        onSelect={toggle}
        onSelectAll={toggleAll}
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
