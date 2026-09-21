import { useAuditLogs } from '../api/misc.js';

export default function AuditLog() {
  const { data: logs = [], isLoading } = useAuditLogs();

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Audit Log</h1>
      <p className="text-sm text-charcoal/60 mb-6">Every sensitive admin action (product/order/coupon changes, uploads) is recorded here for accountability.</p>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="table-base">
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                <td>{log.adminEmail}</td>
                <td>{log.action}</td>
                <td>{log.targetType} {log.targetId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
