import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api, { getErrorMsg } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/toast";
import { formatDate } from "../utils/helpers";

const ROLE_LABELS = { employee: "Employee", director: "Director", accounts: "Accounts Team" };

function Profile() {
  const { user, refreshUser } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const { hash } = useLocation();

  // "Update Signature" in the profile menu opens /profile#signature -> go to that part
  useEffect(() => {
    if (hash !== "#signature") return;
    const el = document.getElementById("signature");
    if (el) el.scrollIntoView({ block: "start" });
    const input = document.getElementById("new-signature");
    if (input) input.focus();
  }, [hash]);

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

  async function saveSignature() {
    if (!file) {
      setError("Please choose a signature image first");
      return;
    }
    const data = new FormData();
    data.append("signature", file);
    setSaving(true);
    setError("");
    try {
      await api.put("/auth/me/signature", data);
      refreshUser();
      setFile(null);
      setPreview(null);
      toast("Signature saved. It will be used for your next " + (user.role === "director" ? "approval." : "voucher."));
    } catch (err) {
      setError(getErrorMsg(err));
    }
    setSaving(false);
  }

  return (
    <div className="page">
      <h2>My Profile</h2>

      {error && <div className="alert">{error}</div>}

      <table className="details">
        <tbody>
          <tr><th>Name</th><td>{user.name}</td></tr>
          <tr><th>Email</th><td>{user.email}</td></tr>
          <tr><th>Role</th><td>{ROLE_LABELS[user.role] || user.role}</td></tr>
          <tr><th>Department</th><td>{user.department || "-"}</td></tr>
          <tr><th>Employee ID</th><td>{user.employee_code || "-"}</td></tr>
          <tr><th>Member Since</th><td>{formatDate(user.created_at)}</td></tr>
        </tbody>
      </table>

      {user.role !== "accounts" && (
        <>
          <h3 id="signature">My Signature</h3>
          <p className="small">
            {user.role === "director"
              ? "Used when you approve a voucher."
              : "Used when you submit a voucher. You can still upload a different one on the voucher form."}
          </p>
          <div className="sign-preview">
            {user.signature_path ? (
              <img className="sign" src={user.signature_path} alt="saved signature" />
            ) : (
              <span className="small">No signature saved yet.</span>
            )}
          </div>

          <label htmlFor="new-signature">Upload a new signature (png/jpg, max 2MB)</label>
          <input id="new-signature" type="file" accept="image/png, image/jpeg" onChange={handleFile} />
          {preview && (
            <div className="sign-preview">
              <img className="sign" src={preview} alt="new signature preview" />
              <span className="small"> (new, not saved yet)</span>
            </div>
          )}
          <div className="form-buttons">
            <button type="button" onClick={saveSignature} disabled={saving || !file}>
              {saving ? "Saving..." : "Save Signature"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
