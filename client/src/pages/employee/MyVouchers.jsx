import { Link } from "react-router-dom";
import api, { getErrorMsg } from "../../api/axios";
import VoucherFilters from "../../components/VoucherFilters";
import VoucherTable from "../../components/VoucherTable";
import { useVoucherList } from "../../hooks/useVoucherList";
import { useStatusParam } from "../../hooks/useStatusParam";

function MyVouchers() {
  const initial = useStatusParam();
  const { vouchers, error, loading, sort, toggleSort, setFilters, reload } = useVoucherList({}, undefined, initial);

  async function handleDelete(v) {
    if (!window.confirm(`Delete draft ${v.voucher_no}?`)) return;
    try {
      await api.delete(`/vouchers/${v.id}`);
      reload();
    } catch (err) {
      alert(getErrorMsg(err));
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>My Vouchers</h2>
        <Link to="/employee/create" className="btn">+ New Voucher</Link>
      </div>

      <VoucherFilters onSearch={setFilters} searchLabel="Voucher no / title" initial={initial} />

      {error && <div className="alert">{error}</div>}
      <p className="small">{loading ? "Loading..." : `${vouchers.length} voucher(s) found`}</p>

      <VoucherTable
        vouchers={vouchers}
        sort={sort}
        onSort={toggleSort}
        showEmployee={false}
        actions={(v) =>
          v.status === "draft" && (
            <>
              <Link to={`/employee/vouchers/${v.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
              <button type="button" className="btn-sm btn-danger" onClick={() => handleDelete(v)}>
                Delete
              </button>
            </>
          )
        }
      />
    </div>
  );
}

export default MyVouchers;
