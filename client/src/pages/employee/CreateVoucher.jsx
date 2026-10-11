import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMsg } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import VoucherForm from "../../components/VoucherForm";
import { today } from "../../utils/helpers";

function CreateVoucher() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(data, submitAfter) {
    setSaving(true);
    setError("");
    let created;
    try {
      const res = await api.post("/vouchers", data);
      created = res.data;
      refreshUser(); // signature may have changed
      if (submitAfter) {
        await api.post(`/vouchers/${created.id}/submit`);
      }
      navigate(`/vouchers/${created.id}`, {
        state: { msg: submitAfter ? "Voucher submitted for approval" : "Voucher saved as draft" },
      });
    } catch (err) {
      if (created) {
        // draft is saved but submit failed, don't create it again
        navigate(`/vouchers/${created.id}`, {
          state: { msg: "Saved as draft, but could not submit: " + getErrorMsg(err) },
        });
        return;
      }
      setError(getErrorMsg(err));
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h2>Create Voucher</h2>
      <p className="small">Voucher number will be generated automatically. Fields with * are required.</p>
      {error && <div className="alert">{error}</div>}

      <VoucherForm
        initial={{ department: user.department, expense_date: today() }}
        savedSignature={user.signature_path}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

export default CreateVoucher;
