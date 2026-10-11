import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMsg } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import DirectorAction from "../components/DirectorAction";
import { formatAmount, formatDate, formatDateTime } from "../utils/helpers";

function VoucherDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [v, setV] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(location.state ? location.state.msg : "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`/vouchers/${id}`)
      .then((res) => setV(res.data))
      .catch((err) => setError(getErrorMsg(err)));
  }, [id]);

  async function handleSubmit() {
    if (!window.confirm("After submitting you can not edit this voucher. Continue?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/vouchers/${id}/submit`);
      setV(res.data);
      setMsg("Voucher submitted for approval");
    } catch (err) {
      setError(getErrorMsg(err));
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete draft ${v.voucher_no}?`)) return;
    try {
      await api.delete(`/vouchers/${id}`);
      navigate("/employee/vouchers");
    } catch (err) {
      setError(getErrorMsg(err));
    }
  }

  if (!v) {
    return <div className="page">{error ? <div className="alert">{error}</div> : "Loading..."}</div>;
  }

  const isOwnDraft = user.role === "employee" && v.status === "draft";
  const backLink = {
    employee: ["/employee/vouchers", "My Vouchers"],
    director: v.status === "pending" ? ["/director/pending", "Pending Approvals"] : ["/director/vouchers", "All Vouchers"],
    accounts: ["/accounts/vouchers", "All Vouchers"],
  }[user.role];

  function afterAction(updated, message) {
    setV(updated);
    setMsg(message);
    setError("");
    window.scrollTo(0, 0);
  }

  return (
    <div className="page">
      <p className="no-print">
        <Link to={backLink[0]} className="btn btn-sm btn-secondary">&larr; Back to {backLink[1]}</Link>
      </p>
      <div className="page-head">
        <h2>Expense Voucher - {v.voucher_no}</h2>
        <span>
          <StatusBadge status={v.status} />{" "}
          {v.status !== "draft" && (
            <button className="btn-secondary no-print" onClick={() => window.print()}>Print</button>
          )}
        </span>
      </div>

      {msg && <div className="success no-print">{msg}</div>}
      {error && <div className="alert">{error}</div>}

      {v.status === "rejected" && (
        <div className="alert">
          <b>Rejected:</b> {v.rejection_reason}
        </div>
      )}

      <h3>Basic Information</h3>
      <table className="details">
        <tbody>
          <tr><th>Voucher Number</th><td>{v.voucher_no}</td></tr>
          <tr><th>Voucher Date</th><td>{formatDate(v.voucher_date)}</td></tr>
          <tr><th>Expense Date</th><td>{formatDate(v.expense_date)}</td></tr>
          <tr><th>Department</th><td>{v.department}</td></tr>
          <tr><th>Expense Title</th><td>{v.title}</td></tr>
          <tr><th>Category</th><td>{v.category || "-"}</td></tr>
          <tr><th>Description</th><td>{v.description || "-"}</td></tr>
          <tr><th>Amount</th><td><b>{formatAmount(v.amount)}</b></td></tr>
        </tbody>
      </table>

      <h3>Employee Information</h3>
      <table className="details">
        <tbody>
          <tr><th>Employee Name</th><td>{v.employee_name}</td></tr>
          <tr><th>Employee ID</th><td>{v.employee_code || "-"}</td></tr>
          <tr>
            <th>Employee Signature</th>
            <td>
              {v.employee_signature ? <img className="sign" src={v.employee_signature} alt="employee signature" /> : "Not uploaded"}
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Approval Information</h3>
      <table className="details">
        <tbody>
          <tr><th>Current Status</th><td><StatusBadge status={v.status} /></td></tr>
          <tr><th>Submitted On</th><td>{formatDateTime(v.submitted_at)}</td></tr>
          <tr><th>{v.status === "rejected" ? "Rejected By" : "Approved By"}</th><td>{v.director_name || "-"}</td></tr>
          <tr>
            <th>Director Signature</th>
            <td>
              {v.director_signature ? <img className="sign" src={v.director_signature} alt="director signature" /> : "-"}
            </td>
          </tr>
          <tr><th>Approval Date</th><td>{formatDateTime(v.approved_at)}</td></tr>
          {v.status === "rejected" && (
            <>
              <tr><th>Rejected On</th><td>{formatDateTime(v.rejected_at)}</td></tr>
              <tr><th>Rejection Reason</th><td>{v.rejection_reason}</td></tr>
            </>
          )}
        </tbody>
      </table>

      <h3>Audit</h3>
      <table className="details">
        <tbody>
          <tr><th>Created</th><td>{formatDateTime(v.created_at)}</td></tr>
          <tr><th>Last Updated</th><td>{formatDateTime(v.updated_at)}</td></tr>
        </tbody>
      </table>

      {user.role === "director" && v.status === "pending" && (
        <DirectorAction voucherId={v.id} onDone={afterAction} />
      )}

      {isOwnDraft && (
        <div className="form-buttons no-print">
          <Link to={`/employee/vouchers/${v.id}/edit`} className="btn">Edit</Link>
          <button onClick={handleSubmit} disabled={busy}>Submit for Approval</button>
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}

export default VoucherDetails;
