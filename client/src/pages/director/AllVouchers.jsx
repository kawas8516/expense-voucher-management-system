import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import { useVoucherList } from "../../hooks/useVoucherList";

function DirectorAllVouchers() {
  const { vouchers, error, loading, sort, toggleSort, setFilters } = useVoucherList();

  return (
    <div className="page">
      <h2>All Vouchers</h2>
      <VoucherFilters onSearch={setFilters} hideDraft />

      {error && <div className="alert">{error}</div>}
      <p className="small">{loading ? "Loading..." : `${vouchers.length} voucher(s) found`}</p>
      <VoucherTable vouchers={vouchers} sort={sort} onSort={toggleSort} />
    </div>
  );
}

export default DirectorAllVouchers;
