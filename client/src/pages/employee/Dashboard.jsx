import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import StatCard from "../../components/StatCard";
import { CategoryChart, WeeklyChart } from "../../components/Charts";
import VoucherTable from "../../components/VoucherTable";
import { formatAmount } from "../../utils/helpers";

function EmployeeDashboard() {
  const { user } = useAuth();
  const { data, error } = useDashboard();

  if (error) return <div className="page"><div className="alert">{error}</div></div>;
  if (!data) return <div className="page">Loading...</div>;

  const s = data.stats;

  return (
    <div className="page">
      <div className="page-head">
        <h2>Welcome, {user.name}</h2>
        <Link to="/employee/create" className="btn"><Icon name="plus" size={16} /> New Voucher</Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Vouchers" value={s.total} />
        <StatCard label="Draft" value={s.draft} color="gray" />
        <StatCard label="Pending Approval" value={s.pending} color="orange" />
        <StatCard label="Approved" value={s.approved} color="green" />
        <StatCard label="Rejected" value={s.rejected} color="red" />
        <StatCard label="Total Amount Claimed" value={formatAmount(s.total_claimed)} color="purple" />
      </div>

      {data.charts && (
        <div className="chart-grid">
          <CategoryChart title="Amount by category" sub="Your submitted vouchers" data={data.charts.byCategory} />
          <WeeklyChart title="Claims per week" sub="Last 8 weeks, by submit date" data={data.charts.byWeek} />
        </div>
      )}

      <h3>Recent Vouchers</h3>
      <VoucherTable vouchers={data.recent} showEmployee={false} />
      <p><Link to="/employee/vouchers" className="btn btn-sm btn-secondary">See all my vouchers &rarr;</Link></p>
    </div>
  );
}

export default EmployeeDashboard;
