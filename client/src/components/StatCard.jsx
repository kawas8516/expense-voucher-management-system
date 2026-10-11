// simple box for dashboard numbers
function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color || "#3498db" }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default StatCard;
