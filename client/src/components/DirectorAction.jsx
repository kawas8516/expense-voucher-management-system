import { useState } from "react";
import api, { getErrorMsg } from "../api/axios";
import { useAuth } from "../context/AuthContext";

// approve (with signature) / reject (with reason) box for director
// onDone(updatedVoucher, message) is called after success
function DirectorAction({ voucherId, onDone }) {
  const { user, refreshUser } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user.signature_path || null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      setError("Signature must be png / jpg");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError("Signature image must be less than 2MB");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function approve() {
    if (!file && !preview) {
      setError("Please upload your signature to approve");
      return;
    }
    if (!window.confirm("Approve this voucher?")) return;

    const data = new FormData();
    if (file) data.append("signature", file);

    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/vouchers/${voucherId}/approve`, data);
      refreshUser();
      onDone(res.data, "Voucher approved");
    } catch (err) {
      setError(getErrorMsg(err));
      setBusy(false);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setError("Please write the rejection reason");
      return;
    }
    if (!window.confirm("Reject this voucher?")) return;

    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/vouchers/${voucherId}/reject`, { reason: reason.trim() });
      onDone(res.data, "Voucher rejected");
    } catch (err) {
      setError(getErrorMsg(err));
      setBusy(false);
    }
  }

  return (
    <div className="action-box no-print">
      <h3>Director Action</h3>
      {error && <div className="alert">{error}</div>}

      <div className="form-row">
        <div>
          <b>Approve</b>
          <label>Your Signature (png/jpg) *</label>
          <input type="file" accept="image/png, image/jpeg" onChange={handleFile} />
          {preview && (
            <div className="sign-preview">
              <img src={preview} alt="director signature" />
              {!file && <span className="small"> (saved signature will be used)</span>}
            </div>
          )}
          <div className="form-buttons">
            <button onClick={approve} disabled={busy}>Approve</button>
          </div>
        </div>

        <div>
          <b>Reject</b>
          <label>Reason for rejection *</label>
          <textarea rows="3" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
          <div className="form-buttons">
            <button className="btn-danger" onClick={reject} disabled={busy}>Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectorAction;
