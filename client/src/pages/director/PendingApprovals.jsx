import { Link } from "react-router-dom";
import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import { useVoucherList } from "../../hooks/useVoucherList";
import { formatAmount } from "../../utils/helpers";

const PENDING = { status: "pending" };

function PendingApprovals() {
  // oldest first, so old requests are not forgotten
  const { vouchers, error, loading, sort, toggleSort, setFilters } = useVoucherList(PENDING, {
    sort: "created",
    order: "asc",
  });

  const total = vouchers.reduce((sum, v) => sum + Number(v.amount), 0);

  return (
    <div className="page">
      <h2>Pending Approvals</h2>
      <VoucherFilters onSearch={setFilters} hideStatus />

      {error && <div className="alert">{error}</div>}
      <p className="small">
        {loading ? "Loading..." : `${vouchers.length} voucher(s) waiting | Total: ${formatAmount(total)}`}
      </p>
      <VoucherTable
        vouchers={vouchers}
        sort={sort}
        onSort={toggleSort}
        actions={(v) => (
          <>
            {" | "}
            <Link to={`/vouchers/${v.id}`}>Approve / Reject</Link>
          </>
        )}
      />
    </div>
  );
}

export default PendingApprovals;
