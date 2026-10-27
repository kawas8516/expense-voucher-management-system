import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import StatCard from "../../components/StatCard";
import { CategoryChart, WeeklyChart } from "../../components/Charts";
import VoucherTable from "../../components/VoucherTable";
import { formatAmount } from "../../utils/helpers";

function AccountsDashboard() {
  const { user } = useAuth();
  const { data, error } = useDashboard();

  if (error) return <div className="page"><div className="alert">{error}</div></div>;
  if (!data) return <div className="page">Loading...</div>;

  const s = data.stats;

  return (
    <div className="page">
      <h2>Welcome, {user.name}</h2>

      <div className="stat-grid">
        <StatCard label="Total Vouchers" value={s.total} />
        <StatCard label="Pending Approval" value={s.pending} color="orange" />
        <StatCard label="Approved" value={s.approved} color="green" />
        <StatCard label="Rejected" value={s.rejected} color="red" />
        <StatCard label="Total Approved Amount" value={formatAmount(s.approved_amount)} color="purple" />
      </div>

      {data.charts && (
        <div className="chart-grid">
          <CategoryChart title="Approved amount by category" sub="Ready for reimbursement" data={data.charts.byCategory} />
          <WeeklyChart title="Approved per week" sub="Last 8 weeks, by approval date" data={data.charts.byWeek} />
        </div>
      )}

      <h3>Recently Approved (ready for reimbursement)</h3>
      <VoucherTable vouchers={data.recent} />
      <p><Link to="/accounts/vouchers" className="btn btn-sm btn-secondary">See all vouchers &rarr;</Link></p>
    </div>
  );
}

export default AccountsDashboard;
