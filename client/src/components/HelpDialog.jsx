import { useEffect, useRef } from "react";
import Icon from "./Icon";

// what each role does, shown from the profile menu
const GUIDE = {
  employee: [
    "Vouchers → New Voucher: fill the expense details and add your signature.",
    "Save as Draft to finish later, or Save & Submit to send it to the Director.",
    "Drafts can be edited or deleted. After submitting, the voucher is read-only.",
    "Track the status in Vouchers → All My Vouchers. A rejected voucher shows the reason.",
  ],
  director: [
    "Vouchers → Pending Approvals lists everything waiting, oldest first.",
    "Approve uses your saved signature (set it in My Profile). Reject asks for a reason.",
    "Tick several rows and use Approve selected to approve them together.",
    "Activity Log shows every login and voucher action.",
  ],
  accounts: [
    "Vouchers → Approved (to reimburse) lists approved vouchers ready for payment.",
    "Use the filters and Export CSV to download the list for reimbursement.",
    "Open a voucher to see both signatures and print it.",
    "Activity Log shows every login and voucher action.",
  ],
};

// native <dialog>: keeps focus inside, Escape closes it
function HelpDialog({ open, role, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="help-dialog" onClose={onClose} aria-labelledby="help-title">
      <div className="help-head">
        <h2 id="help-title">
          <Icon name="help" /> How it works
        </h2>
        <button type="button" className="btn-sm btn-secondary" onClick={onClose} aria-label="Close help">
          <Icon name="x" size={16} />
        </button>
      </div>
      <p className="small">
        Voucher flow: <b>Draft</b> → <b>Pending Approval</b> → <b>Approved</b> or <b>Rejected</b>
      </p>
      <ol>
        {(GUIDE[role] || []).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <p className="small">Keyboard: Tab moves between controls, arrow keys move inside menus, Escape closes menus and this window.</p>
    </dialog>
  );
}

export default HelpDialog;
