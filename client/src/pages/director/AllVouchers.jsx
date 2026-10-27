import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useStatusParam } from "../../hooks/useStatusParam";
import { STATUS_LABELS } from "../../utils/helpers";

function DirectorAllVouchers() {
  const initial = useStatusParam();
  const { vouchers, error, loading, sort, toggleSort, setFilters } = useVoucherList({}, undefined, initial);

  return (
    <div className="page">
      <h2>{initial.status ? `${STATUS_LABELS[initial.status]} Vouchers` : "All Vouchers"}</h2>
      <VoucherFilters onSearch={setFilters} hideDraft initial={initial} />

      {error && <div className="alert">{error}</div>}
      <p className="small">{loading ? "Loading..." : `${vouchers.length} voucher(s) found`}</p>
      <VoucherTable vouchers={vouchers} sort={sort} onSort={toggleSort} />
    </div>
  );
}

export default DirectorAllVouchers;
