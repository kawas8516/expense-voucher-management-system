import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { AUDIT_LABELS, AUDIT_STATUS, formatAmount, formatDateTime } from "../../utils/helpers";

function DirectorDashboard() {
  const { user } = useAuth();
  const { data, error } = useDashboard();

  if (error) return <div className="page"><div className="alert">{error}</div></div>;
  if (!data) return <div className="page">Loading...</div>;

  const s = data.stats;

  return (
    <div className="page">
      <h2>Welcome, {user.name}</h2>

      <div className="stat-grid">
        <StatCard label="Pending Approval" value={s.pending} color="orange" />
        <StatCard label="Approved Today" value={s.approved_today} color="green" />
        <StatCard label="Rejected Today" value={s.rejected_today} color="red" />
        <StatCard label="Total Pending Amount" value={formatAmount(s.pending_amount)} color="purple" />
      </div>

      {s.pending > 0 && (
        <p>
          <Link to="/director/pending" className="btn">Review {s.pending} pending voucher(s)</Link>
        </p>
      )}

      <h3>Recent Voucher Activity</h3>
      {data.recent.length === 0 ? (
        <p>No activity yet.</p>
      ) : data.activity ? (
        // events from the MongoDB audit log: who did what and when
        <ul className="activity">
          {data.recent.map((e) => (
            <li key={e._id}>
              <span className="small">{formatDateTime(e.createdAt)}</span>{" - "}
              <b>{e.user ? e.user.name : "Someone"}</b>{" "}
              <span className={"badge badge-" + AUDIT_STATUS[e.action]}>{AUDIT_LABELS[e.action]}</span>{" "}
              <Link to={`/vouchers/${e.voucherId}`}>{e.voucherNo}</Link>
              {e.details && e.details.amount !== undefined && <> ({formatAmount(e.details.amount)})</>}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="activity">
          {data.recent.map((v) => (
            <li key={v.id}>
              <span className="small">{formatDateTime(v.updated_at)}</span>{" - "}
              <Link to={`/vouchers/${v.id}`}>{v.voucher_no}</Link>{" "}
              {v.title} by {v.employee_name} ({formatAmount(v.amount)}){" "}
              <StatusBadge status={v.status} />
            </li>
          ))}
        </ul>
      )}
      <p><Link to="/director/vouchers" className="btn btn-sm btn-secondary">See all vouchers &rarr;</Link></p>
    </div>
  );
}

export default DirectorDashboard;
