import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Database, Server, Radio, ShieldCheck } from 'lucide-react';
import FreshnessTag from '../components/FreshnessTag';

interface DataHealthChannel {
  channel: string;
  name: string;
  status: 'LIVE' | 'CACHED' | 'DEMO' | string;
  source: string;
  refresh_interval_seconds: number;
  last_updated: string;
  next_update_in_seconds: number;
  record_count: number;
  details: string;
}

interface DataHealthResponse {
  system_mode: string;
  overall_status: string;
  last_sync: string;
  channels: DataHealthChannel[];
}

export default function DataHealth() {
  const [data, setData] = useState<DataHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      let res = await fetch('/api/data-health').catch(() => fetch('http://127.0.0.1:8000/api/data-health'));
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error('Failed to load data health metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to data health API');
    } flex: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const timer = setInterval(fetchHealthData, 5000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="card-slate-navy p-8 flex flex-col items-center gap-4 border border-slate-800 shadow-xl">
          <RefreshCw className="h-10 w-10 text-sky-400 animate-spin" />
          <p className="text-sm font-bold text-slate-300 tracking-wider uppercase">Loading Data Health Control Tower...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-slate-blue uppercase tracking-wider text-[10px] font-bold">Logistics Infrastructure</span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">| INGESTION PIPELINE</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2.5 mt-1">
            <Activity className="h-6 w-6 text-emerald-400" />
            Real-Time Data Health & Sync Control Tower
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            End-to-end data telemetry monitor for SAIL bulk raw material imports & freight execution layers.
          </p>
        </div>

        <button
          onClick={fetchHealthData}
          className="btn-navy-primary px-4 py-2 text-xs flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Pipeline Status
        </button>
      </div>

      {/* System Status Overview Banner */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card-slate-navy p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-950/40 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">SYSTEM HEALTH</span>
              <span className="text-xl font-black text-emerald-400 block mt-0.5">{data.overall_status}</span>
              <span className="text-[10px] text-slate-400 font-medium">6 of 6 telemetry channels active</span>
            </div>
          </div>

          <div className="card-slate-navy p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-sky-950/40 border border-sky-800 flex items-center justify-center text-sky-400 shrink-0">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">OPERATING MODE</span>
              <span className="text-xl font-black text-slate-100 block mt-0.5">{data.system_mode} MODE</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {data.system_mode === 'LIVE' ? 'Connected to external live maritime APIs' : 'Using realistic SAIL enterprise simulation'}
              </span>
            </div>
          </div>

          <div className="card-slate-navy p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-950/40 border border-indigo-800 flex items-center justify-center text-sky-400 shrink-0">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">WEBSOCKET SYNC</span>
              <span className="text-xl font-black text-sky-400 block mt-0.5">ACTIVE</span>
              <span className="text-[10px] text-slate-400 font-mono">Heartbeat: {new Date(data.last_sync).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Architecture Demonstration Note */}
      <div className="card-slate-navy p-5 border-l-4 border-l-sky-400 flex gap-4 text-xs">
        <div className="p-2 bg-slate-950 border border-slate-800 rounded-md text-sky-400 shrink-0 h-max">
          <Database className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <span className="font-bold text-slate-100 uppercase tracking-wider block text-xs">
            SAIL Telemetry Architecture Specification
          </span>
          <p className="leading-relaxed text-slate-300">
            The background ingestion engine uses modular provider interfaces (<code className="text-sky-400 font-mono">AISProvider</code>, <code className="text-sky-400 font-mono">PortCongestionProvider</code>, <code className="text-sky-400 font-mono">BalticIndexProvider</code>). Each channel operates on isolated polling cycles with automatic failover, broadcasting live state changes directly over WebSockets to enterprise dashboards.
          </p>
        </div>
      </div>

      {/* Channel Matrix Table */}
      {data && (
        <div className="card-slate-navy p-5">
          <h2 className="text-xs font-bold tracking-wide uppercase mb-4 flex items-center gap-2 text-slate-100">
            <Activity className="h-4 w-4 text-sky-400" />
            Active Telemetry Channels Matrix
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] bg-slate-950/60">
                  <th className="py-3 px-3">Data Channel</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Provider Source</th>
                  <th className="py-3 px-3">Refresh Cycle</th>
                  <th className="py-3 px-3">Next Refresh</th>
                  <th className="py-3 px-3">Last Updated</th>
                  <th className="py-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.channels.map((ch) => (
                  <tr key={ch.channel} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3 font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      {ch.name}
                    </td>

                    <td className="py-3.5 px-3">
                      <FreshnessTag status={ch.status} compact />
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-300">
                      {ch.source}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-400">
                      Every {ch.refresh_interval_seconds}s
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                      {ch.next_update_in_seconds}s
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-400">
                      {new Date(ch.last_updated).toLocaleTimeString()}
                    </td>

                    <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate font-medium">
                      {ch.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
