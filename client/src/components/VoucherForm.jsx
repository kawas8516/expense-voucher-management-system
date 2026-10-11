import { useState } from "react";
import { CATEGORIES, today } from "../utils/helpers";

// shared form for create + edit
// onSave(formData, submitAfterSave) is given by the parent page
function VoucherForm({ initial, savedSignature, onSave, saving }) {
  const [form, setForm] = useState({
    expense_date: initial.expense_date || "",
    department: initial.department || "",
    title: initial.title || "",
    category: initial.category || "",
    description: initial.description || "",
    amount: initial.amount || "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(savedSignature || null);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      setErrors({ ...errors, signature: "Only png / jpg allowed" });
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, signature: "Image must be less than 2MB" });
      return;
    }
    setErrors({ ...errors, signature: null });
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function validate(forSubmit) {
    const e = {};
    if (!form.department.trim()) e.department = "Department is required";
    if (!form.title.trim()) e.title = "Expense title is required";
    if (!form.expense_date) e.expense_date = "Expense date is required";
    else if (form.expense_date > today()) e.expense_date = "Expense date cannot be in the future";
    if (form.amount === "") e.amount = "Amount is required";
    else if (Number(form.amount) <= 0) e.amount = "Amount must be greater than zero";
    if (forSubmit && !file && !preview) e.signature = "Signature is required to submit";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave(submitAfter) {
    if (!validate(submitAfter)) return;

    const data = new FormData();
    Object.keys(form).forEach((key) => data.append(key, form[key]));
    if (file) data.append("signature", file);

    onSave(data, submitAfter);
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="form-row">
        <div>
          <label>Expense Date *</label>
          <input type="date" name="expense_date" max={today()} value={form.expense_date} onChange={handleChange} />
          {errors.expense_date && <div className="error">{errors.expense_date}</div>}
        </div>
        <div>
          <label>Department *</label>
          <input type="text" name="department" value={form.department} onChange={handleChange} />
          {errors.department && <div className="error">{errors.department}</div>}
        </div>
      </div>

      <label>Expense Title *</label>
      <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="eg. Client visit to Pune" />
      {errors.title && <div className="error">{errors.title}</div>}

      <div className="form-row">
        <div>
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">-- select --</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Amount (₹) *</label>
          <input type="number" name="amount" min="0" step="0.01" value={form.amount} onChange={handleChange} />
          {errors.amount && <div className="error">{errors.amount}</div>}
        </div>
      </div>

      <label>Description</label>
      <textarea name="description" rows="3" value={form.description} onChange={handleChange}></textarea>

      <label>Your Signature (png/jpg)</label>
      <input type="file" accept="image/png, image/jpeg" onChange={handleFile} />
      {errors.signature && <div className="error">{errors.signature}</div>}
      {preview && (
        <div className="sign-preview">
          <img src={preview} alt="signature" />
          {!file && <span className="small"> (saved signature will be used)</span>}
        </div>
      )}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => handleSave(false)}>
          Save as Draft
        </button>
        <button type="button" disabled={saving} onClick={() => handleSave(true)}>
          Save & Submit
        </button>
      </div>
    </form>
  );
}

export default VoucherForm;
