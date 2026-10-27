import { useState } from "react";
import { CATEGORIES, STATUS_LABELS } from "../utils/helpers";

const EMPTY = { q: "", department: "", category: "", status: "", from: "", to: "", min: "", max: "" };

// search + filter box. calls onSearch(filters) when Search is clicked
// initial = starting values, eg. { status: "approved" } when opened from a menu link
function VoucherFilters({ onSearch, hideStatus, hideDraft, searchLabel, initial }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState("");

  function change(e) {
    setF({ ...f, [e.target.name]: e.target.value });
  }

  function search(e) {
    e.preventDefault();
    if (f.from && f.to && f.from > f.to) {
      setError("From date should be before To date");
      return;
    }
    if (f.min && f.max && Number(f.min) > Number(f.max)) {
      setError("Min amount should be less than Max amount");
      return;
    }
    setError("");
    // send only filled fields
    const clean = {};
    Object.keys(f).forEach((k) => {
      if (f[k] !== "") clean[k] = f[k].trim ? f[k].trim() : f[k];
    });
    onSearch(clean);
  }

  function reset() {
    setF(EMPTY);
    setError("");
    onSearch({});
  }

  return (
    <form className="filters" onSubmit={search}>
      <div className="filter-grid">
        <div>
          <label>Search</label>
          <input name="q" value={f.q} onChange={change} placeholder={searchLabel || "Voucher no / employee / title"} />
        </div>
        <div>
          <label>Department</label>
          <input name="department" value={f.department} onChange={change} />
        </div>
        <div>
          <label>Category</label>
          <select name="category" value={f.category} onChange={change}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {!hideStatus && (
          <div>
            <label>Status</label>
            <select name="status" value={f.status} onChange={change}>
              <option value="">All</option>
              {Object.keys(STATUS_LABELS)
                .filter((s) => !(hideDraft && s === "draft"))
                .map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
            </select>
          </div>
        )}
        <div>
          <label>Expense Date From</label>
          <input type="date" name="from" value={f.from} onChange={change} />
        </div>
        <div>
          <label>To</label>
          <input type="date" name="to" value={f.to} onChange={change} />
        </div>
        <div>
          <label>Min Amount</label>
          <input type="number" min="0" name="min" value={f.min} onChange={change} />
        </div>
        <div>
          <label>Max Amount</label>
          <input type="number" min="0" name="max" value={f.max} onChange={change} />
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="form-buttons">
        <button type="submit">Search</button>
        <button type="button" className="btn-secondary" onClick={reset}>Reset</button>
      </div>
    </form>
  );
}

export default VoucherFilters;
