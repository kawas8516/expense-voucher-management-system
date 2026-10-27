import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatAmount, formatDate } from "../utils/helpers";

// table header cell, clickable if column can be sorted
function Header({ col, sort, onSort, children }) {
  if (!onSort || !col) return <th>{children}</th>;
  const arrow = sort && sort.sort === col ? (sort.order === "asc" ? " ▲" : " ▼") : "";
  return (
    <th className="sortable" onClick={() => onSort(col)} title="Click to sort">
      {children}
      {arrow}
    </th>
  );
}

// common table for voucher lists
// sort + onSort are optional, without them headers are not clickable
// actions(v) can add extra buttons in last column (eg. edit/delete)
// selected (Set of ids) + onSelect(id) + onSelectAll() show a checkbox column (bulk approve)
function VoucherTable({ vouchers, sort, onSort, showEmployee = true, showStatus = true, actions, selected, onSelect, onSelectAll }) {
  const selectable = !!selected;
  const allSelected = selectable && vouchers.length > 0 && vouchers.every((v) => selected.has(v.id));
  if (vouchers.length === 0) {
    return <p>No vouchers found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {selectable && (
              <th className="select">
                <input type="checkbox" checked={allSelected} onChange={onSelectAll} aria-label="Select all vouchers" />
              </th>
            )}
            <Header sort={sort} onSort={onSort} col="voucher_no">Voucher No</Header>
            {showEmployee && <Header sort={sort} onSort={onSort} col="employee">Employee</Header>}
            <Header sort={sort} onSort={onSort} col="department">Department</Header>
            <Header>Title</Header>
            <Header>Category</Header>
            <Header sort={sort} onSort={onSort} col="date">Expense Date</Header>
            <Header sort={sort} onSort={onSort} col="amount">Amount</Header>
            {showStatus && <Header sort={sort} onSort={onSort} col="status">Status</Header>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => (
            <tr key={v.id}>
              {selectable && (
                <td className="select">
                  <input
                    type="checkbox"
                    checked={selected.has(v.id)}
                    onChange={() => onSelect(v.id)}
                    aria-label={`Select ${v.voucher_no}`}
                  />
                </td>
              )}
              <td>{v.voucher_no}</td>
              {showEmployee && <td>{v.employee_name}</td>}
              <td>{v.department}</td>
              <td>{v.title}</td>
              <td>{v.category || "-"}</td>
              <td>{formatDate(v.expense_date)}</td>
              <td className="num">{formatAmount(v.amount)}</td>
              {showStatus && <td><StatusBadge status={v.status} /></td>}
              <td className="actions">
                <Link to={`/vouchers/${v.id}`} className="btn btn-sm btn-secondary">View</Link>
                {actions && actions(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VoucherTable;
