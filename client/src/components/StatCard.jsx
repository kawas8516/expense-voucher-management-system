import Icon from "./Icon";

// icon for each colour (colour = what the number is about)
const ICONS = {
  blue: "file",
  gray: "pencil",
  orange: "clock",
  green: "check",
  red: "x",
  purple: "rupee",
};

// box for dashboard numbers. colours come from the theme (works in dark mode)
function StatCard({ label, value, color = "blue" }) {
  return (
    <div className={"stat-card stat-" + color}>
      <span className="stat-icon" aria-hidden="true">
        <Icon name={ICONS[color] || "file"} />
      </span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default StatCard;
