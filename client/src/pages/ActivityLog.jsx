import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMsg } from "../api/axios";
import { AUDIT_LABELS, AUDIT_STATUS, auditDetails, formatDateTime } from "../utils/helpers";

const EMPTY = { action: "", user: "", from: "", to: "" };

// full activity log from MongoDB (director + accounts)
function ActivityLog() {
  const [form, setForm] = useState(EMPTY);
  const [query, setQuery] = useState({ page: 1 });
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    const params = {};
    Object.keys(query).forEach((k) => {
      if (query[k] !== "") params[k] = query[k];
    });
    api
      .get("/audit", { params })
      .then((res) => !cancelled && setResult({ key, data: res.data, error: "" }))
      .catch((err) => !cancelled && setResult({ key, data: null, error: getErrorMsg(err) }));
    return () => {
      cancelled = true;
    };
  }, [key, query]);

  const loading = result.key !== key;
  const data = result.data;

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function search(e) {
    e.preventDefault();
    setQuery({ ...form, user: form.user.trim(), page: 1 });
  }

  function reset() {
    setForm(EMPTY);
    setQuery({ page: 1 });
  }

  const goTo = (page) => setQuery({ ...query, page });

  return (
    <div className="page">
      <h2>Activity Log</h2>
      <p className="small">Every login and voucher action, saved in MongoDB. Draft vouchers are private and not listed.</p>

      <form className="filters" onSubmit={search}>
        <div className="filter-grid">
          <div>
            <label htmlFor="f-action">Action</label>
            <select id="f-action" name="action" value={form.action} onChange={change}>
              <option value="">All</option>
              {Object.keys(AUDIT_LABELS)
                .filter((a) => a !== "voucher_deleted")
                .map((a) => (
                  <option key={a} value={a}>{AUDIT_LABELS[a]}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-user">User</label>
            <input id="f-user" name="user" value={form.user} onChange={change} placeholder="Name" />
          </div>
          <div>
            <label htmlFor="f-from">From</label>
            <input id="f-from" type="date" name="from" value={form.from} onChange={change} />
          </div>
          <div>
            <label htmlFor="f-to">To</label>
            <input id="f-to" type="date" name="to" value={form.to} onChange={change} />
          </div>
        </div>
        <div className="form-buttons">
          <button type="submit">Search</button>
          <button type="button" className="btn-secondary" onClick={reset}>Reset</button>
        </div>
      </form>

      {result.error && <div className="alert">{result.error}</div>}

      {loading && !data ? (
        <p className="small">Loading...</p>
      ) : data && !data.enabled ? (
        <p className="small">Activity log is not available (audit log database not connected).</p>
      ) : data && data.events.length === 0 ? (
        <p>No activity found.</p>
      ) : data ? (
        <>
          <p className="small">{loading ? "Loading..." : `${data.total} event(s)`}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Voucher</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={e._id}>
                    <td>{formatDateTime(e.createdAt)}</td>
                    <td>{e.user ? `${e.user.name} (${e.user.role})` : "-"}</td>
                    <td>
                      {AUDIT_STATUS[e.action] ? (
                        <span className={"badge badge-" + AUDIT_STATUS[e.action]}>{AUDIT_LABELS[e.action]}</span>
                      ) : (
                        AUDIT_LABELS[e.action] || e.action
                      )}
                    </td>
                    <td>{e.voucherId ? <Link to={`/vouchers/${e.voucherId}`}>{e.voucherNo}</Link> : "-"}</td>
                    <td>{auditDetails(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <div className="pager">
              <button type="button" className="btn-sm btn-secondary" disabled={data.page <= 1 || loading} onClick={() => goTo(data.page - 1)}>
                &lsaquo; Prev
              </button>
              <span>Page {data.page} of {data.pages}</span>
              <button type="button" className="btn-sm btn-secondary" disabled={data.page >= data.pages || loading} onClick={() => goTo(data.page + 1)}>
                Next &rsaquo;
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default ActivityLog;
