// same colours as the status badges, dark enough to read on the light card
const COLORS = {
  blue: "#2471a3",
  gray: "#646e70",
  orange: "#a85400",
  green: "#1e7b34",
  red: "#c0392b",
  purple: "#7d3c98",
};

// simple box for dashboard numbers
function StatCard({ label, value, color = "blue" }) {
  const c = COLORS[color] || COLORS.blue;
  return (
    <div className="stat-card" style={{ borderTopColor: c }}>
      <div className="stat-value" style={{ color: c }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default StatCard;
