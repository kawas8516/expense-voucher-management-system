import { useEffect, useState } from "react";
import api from "../api/axios";
import { AUDIT_LABELS, auditDetails, formatDateTime } from "../utils/helpers";

// voucher history from the MongoDB audit log
// `version` changes after approve / submit, so the list reloads
function VoucherHistory({ voucherId, version }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get(`/vouchers/${voucherId}/history`)
      .then((res) => setData(res.data))
      .catch(() => setData({ enabled: false, events: [] }));
  }, [voucherId, version]);

  if (!data) return null;

  return (
    <>
      <h3>History</h3>
      {!data.enabled ? (
        <p className="small">History is not available (audit log database not connected).</p>
      ) : data.events.length === 0 ? (
        <p className="small">No history recorded for this voucher.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e._id}>
                  <td>{formatDateTime(e.createdAt)}</td>
                  <td>{AUDIT_LABELS[e.action] || e.action}</td>
                  <td>{e.user ? `${e.user.name} (${e.user.role})` : "-"}</td>
                  <td>{auditDetails(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default VoucherHistory;
