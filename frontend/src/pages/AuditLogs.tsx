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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review human-in-the-loop decisions, recommendation overrides, and scenario testing history.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs active:scale-95 transition flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Logs Table */}
      <div className="glass-panel p-5 rounded-2xl">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-slate-600 animate-pulse" />
            <span>Audit log is currently empty. Run an optimization or perform an override to generate logs.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-2">Timestamp (UTC)</th>
                  <th className="py-3 px-2">Operator</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Action</th>
                  <th className="py-3 px-2">Target ID</th>
                  <th className="py-3 px-2">Log Description Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition text-slate-300">
                    <td className="py-3.5 px-2 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-2 font-medium text-slate-200">{log.username}</td>
                    <td className="py-3.5 px-2 text-slate-400">{log.role}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                        log.action === 'Override' ? 'bg-amber-950/60 text-amber-400 border border-amber-900/40' :
                        log.action === 'Optimize' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/40' :
                        log.action === 'Reset' ? 'bg-red-950/60 text-red-400 border border-red-900/40' :
                        'bg-slate-900 text-slate-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-[10px] text-slate-500">
                      {log.target ? `#${log.target}` : '--'}
                    </td>
                    <td className="py-3.5 px-2 text-slate-300 font-sans max-w-md">{log.details}</td>
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
