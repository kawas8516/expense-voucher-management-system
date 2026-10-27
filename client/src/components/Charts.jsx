import { formatAmount, formatCompact } from "../utils/helpers";

// "2026-10-13" -> "13 Oct"
const weekLabel = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// same numbers as a table, for screen readers and anyone who prefers text
function DataTable({ head, rows }) {
  return (
    <details>
      <summary>Show as table</summary>
      <table>
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i ? "num" : ""}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// horizontal bars: amount per expense category, biggest first
export function CategoryChart({ title, sub, data }) {
  const max = Math.max(0, ...data.map((d) => d.amount));
  return (
    <div className="chart">
      <h4>{title}</h4>
      <p className="chart-sub">{sub}</p>
      {data.length === 0 ? (
        <p className="chart-empty">No vouchers yet.</p>
      ) : (
        <>
          {data.map((d) => (
            <div
              key={d.category}
              className="hbar-row chart-tip"
              tabIndex={0}
              aria-label={`${d.category}: ${formatAmount(d.amount)}, ${d.count} voucher(s)`}
            >
              <span>{d.category}</span>
              <span className="hbar-track">
                <span className="hbar-fill" style={{ width: (max ? (d.amount / max) * 100 : 0) + "%", display: "block" }} />
              </span>
              <span className="hbar-value">{formatCompact(d.amount)}</span>
              <span role="tooltip">
                {d.category}: {formatAmount(d.amount)} · {d.count} voucher(s)
              </span>
            </div>
          ))}
          <DataTable
            head={["Category", "Amount", "Vouchers"]}
            rows={data.map((d) => [d.category, formatAmount(d.amount), d.count])}
          />
        </>
      )}
    </div>
  );
}

// columns: amount per week for the last 8 weeks
export function WeeklyChart({ title, sub, data }) {
  const max = Math.max(0, ...data.map((d) => d.amount));
  const empty = data.every((d) => d.amount === 0);
  return (
    <div className="chart">
      <h4>{title}</h4>
      <p className="chart-sub">
        {sub}
        {!empty && <> · highest week {formatCompact(max)}</>}
      </p>
      {empty ? (
        <p className="chart-empty">Nothing in the last 8 weeks.</p>
      ) : (
        <>
          <div className="vbar-plot">
            {data.map((d) => (
              <div
                key={d.week}
                className="vbar-col chart-tip"
                tabIndex={0}
                aria-label={`Week of ${weekLabel(d.week)}: ${formatAmount(d.amount)}, ${d.count} voucher(s)`}
              >
                <div className="vbar-fill" style={{ height: (max ? (d.amount / max) * 100 : 0) + "%" }} />
                <span role="tooltip">
                  Week of {weekLabel(d.week)}: {formatAmount(d.amount)} · {d.count} voucher(s)
                </span>
              </div>
            ))}
          </div>
          <div className="vbar-labels" aria-hidden="true">
            {data.map((d) => (
              <span key={d.week} className="vbar-label">{weekLabel(d.week)}</span>
            ))}
          </div>
          <DataTable
            head={["Week of", "Amount", "Vouchers"]}
            rows={data.map((d) => [weekLabel(d.week), formatAmount(d.amount), d.count])}
          />
        </>
      )}
    </div>
  );
}
