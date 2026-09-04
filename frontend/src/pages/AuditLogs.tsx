import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  target: string | null;
  details: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } flex: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase flex items-center gap-3">
            <FileText className="h-6 w-6 text-sky-400" />
            System Audit Trail & Decision Governance Desk
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Steel Authority of India Limited • Immutable Audit Trail for Human Overrides & Recommendations
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="btn-navy-primary font-semibold text-xs px-4 py-2 flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Log
        </button>
      </div>

      {/* Logs Table */}
      <div className="card-slate-navy p-5 font-mono">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-8 w-8 text-sky-400 animate-pulse" />
            <span className="font-bold text-slate-300">Audit trail log is empty. Execute optimization or human override to record events.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px] bg-slate-950/60">
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target ID</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition text-slate-300">
                    <td className="py-3 px-3 font-mono text-sky-400 font-medium text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{log.username}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px] uppercase">{log.role}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                        log.action === 'Override' ? 'badge-slate-amber' :
                        log.action === 'Optimize' ? 'badge-slate-blue' :
                        log.action === 'Reset' ? 'badge-slate-rose' :
                        'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-sky-400 font-bold">
                      {log.target ? `#${log.target}` : '--'}
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-medium max-w-md leading-relaxed">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
