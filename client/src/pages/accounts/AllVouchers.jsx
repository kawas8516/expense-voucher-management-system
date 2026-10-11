import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import { useVoucherList } from "../../hooks/useVoucherList";
import { formatAmount } from "../../utils/helpers";

function AccountsAllVouchers() {
  const { vouchers, error, loading, sort, toggleSort, setFilters } = useVoucherList();

  // total of approved vouchers in the current list (for reimbursement)
  const approvedTotal = vouchers
    .filter((v) => v.status === "approved")
    .reduce((sum, v) => sum + Number(v.amount), 0);

  return (
    <div className="page">
      <h2>All Vouchers</h2>
      <VoucherFilters onSearch={setFilters} hideDraft />

      {error && <div className="alert">{error}</div>}
      <p className="small">
        {loading
          ? "Loading..."
          : `${vouchers.length} voucher(s) found | Approved amount in this list: ${formatAmount(approvedTotal)}`}
      </p>
      <VoucherTable vouchers={vouchers} sort={sort} onSort={toggleSort} />
    </div>
  );
}

export default AccountsAllVouchers;
