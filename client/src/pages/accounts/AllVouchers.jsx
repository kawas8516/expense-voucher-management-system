import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useStatusParam } from "../../hooks/useStatusParam";
import { STATUS_LABELS, formatAmount, today } from "../../utils/helpers";
import { downloadCsv } from "../../utils/csv";
import { useToast } from "../../context/toast";
import Icon from "../../components/Icon";

// columns of the exported file
const CSV_COLUMNS = [
  ["Voucher No", (v) => v.voucher_no],
  ["Voucher Date", (v) => v.voucher_date],
  ["Expense Date", (v) => v.expense_date],
  ["Employee", (v) => v.employee_name],
  ["Employee ID", (v) => v.employee_code],
  ["Department", (v) => v.department],
  ["Title", (v) => v.title],
  ["Category", (v) => v.category],
  ["Amount", (v) => Number(v.amount).toFixed(2)],
  ["Status", (v) => STATUS_LABELS[v.status]],
  ["Decided By", (v) => v.director_name],
  ["Decided On", (v) => (v.approved_at || v.rejected_at || "").slice(0, 10)],
  ["Rejection Reason", (v) => v.rejection_reason],
];

function AccountsAllVouchers() {
  const initial = useStatusParam();
  const toast = useToast();
  const { vouchers, error, loading, sort, toggleSort, setFilters } = useVoucherList({}, undefined, initial);

  // total of approved vouchers in the current list (for reimbursement)
  const approvedTotal = vouchers
    .filter((v) => v.status === "approved")
    .reduce((sum, v) => sum + Number(v.amount), 0);

  return (
    <div className="page">
      <h2>{initial.status ? `${STATUS_LABELS[initial.status]} Vouchers` : "All Vouchers"}</h2>
      <VoucherFilters onSearch={setFilters} hideDraft initial={initial} />

      {error && <div className="alert">{error}</div>}
      <div className="list-head">
        <p className="small">
          {loading
            ? "Loading..."
            : `${vouchers.length} voucher(s) found | Approved amount in this list: ${formatAmount(approvedTotal)}`}
        </p>
        <button
          type="button"
          className="btn-sm btn-secondary"
          disabled={loading || vouchers.length === 0}
          onClick={() => {
            downloadCsv(`vouchers-${today()}.csv`, CSV_COLUMNS, vouchers);
            toast(`Exported ${vouchers.length} voucher(s) to CSV`);
          }}
        >
          <Icon name="download" size={16} /> Export CSV
        </button>
      </div>
      <VoucherTable vouchers={vouchers} sort={sort} onSort={toggleSort} />
    </div>
  );
}

export default AccountsAllVouchers;
