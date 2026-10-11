import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getErrorMsg } from "../../api/axios";
import VoucherForm from "../../components/VoucherForm";
import { useAuth } from "../../context/AuthContext";

function EditVoucher() {
  const { id } = useParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/vouchers/${id}`)
      .then((res) => setVoucher(res.data))
      .catch((err) => setError(getErrorMsg(err)));
  }, [id]);

  async function handleSave(data, submitAfter) {
    setSaving(true);
    setError("");
    try {
      await api.put(`/vouchers/${id}`, data);
      refreshUser();
      if (submitAfter) {
        await api.post(`/vouchers/${id}/submit`);
      }
      navigate(`/vouchers/${id}`, {
        state: { msg: submitAfter ? "Voucher submitted for approval" : "Changes saved" },
      });
    } catch (err) {
      setError(getErrorMsg(err));
      setSaving(false);
    }
  }

  if (!voucher) {
    return <div className="page">{error ? <div className="alert">{error}</div> : "Loading..."}</div>;
  }

  if (voucher.status !== "draft") {
    return (
      <div className="page">
        <div className="alert">This voucher is already {voucher.status} and cannot be edited.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Edit Voucher - {voucher.voucher_no}</h2>
      {error && <div className="alert">{error}</div>}

      <VoucherForm
        initial={voucher}
        savedSignature={voucher.employee_signature}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

export default EditVoucher;
