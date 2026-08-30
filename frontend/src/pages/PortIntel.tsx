import React, { useState, useEffect } from 'react';
import { Compass, AlertTriangle, ArrowRightLeft, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';

interface Port {
  id: number;
  name: string;
  country: string;
  coast: string;
  latitude: number;
  longitude: number;
  max_loa: number;
  max_beam: number;
  max_draft: number;
  berth_capacity: number;
  cargo_handling_capacity: number;
  congestion_score: number;
  status: string;
}

interface Disruption {
  id: number;
  port: string;
  type: string;
  severity: string;
  description: string;
  start_date: string;
  expected_duration: number;
}

interface PortIntelProps {
  ports: Port[];
}

export default function PortIntel({ ports }: PortIntelProps) {
  // Only compare Indian ports
  const indianPorts = ports.filter(p => p.coast === 'East Coast');
  
  const [portAId, setPortAId] = useState<number>(indianPorts[0]?.id || 1);
  const [portBId, setPortBId] = useState<number>(indianPorts[1]?.id || 2);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDisruptions = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/alerts'); // retrieves disruptions as alerts
        const data = await res.json();
        
        // Map alert objects back to structural disruption formats
        const mappedDisr = data
          .filter((a: any) => a.id.startsWith('alert-disr-'))
          .map((a: any) => ({
            id: a.id,
            port: a.message.split(' ')[0], // simple parse
            type: a.title.split(' ')[0],
            severity: a.message.includes('Severity: High') ? 'High' : 'Medium',
            description: a.message
          }));
        setDisruptions(mappedDisr);
      } catch (e) {
        console.error("Failed to load disruptions", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDisruptions();
  }, []);

  const portA = ports.find(p => p.id === portAId);
  const portB = ports.find(p => p.id === portBId);

  if (!portA || !portB) return null;

  const portADisruptions = disruptions.filter(d => d.port.toLowerCase().includes(portA.name.toLowerCase()));
  const portBDisruptions = disruptions.filter(d => d.port.toLowerCase().includes(portB.name.toLowerCase()));

  // Comparisons advantages (higher specs is advantage, lower congestion is advantage)
  const draftAdv = portA.max_draft !== portB.max_draft ? (portA.max_draft > portB.max_draft ? 'A' : 'B') : null;
  const loaAdv = portA.max_loa !== portB.max_loa ? (portA.max_loa > portB.max_loa ? 'A' : 'B') : null;
  const congAdv = portA.congestion_score !== portB.congestion_score ? (portA.congestion_score < portB.congestion_score ? 'A' : 'B') : null;
  const handlingAdv = portA.cargo_handling_capacity !== portB.cargo_handling_capacity ? (portA.cargo_handling_capacity > portB.cargo_handling_capacity ? 'A' : 'B') : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Port Intelligence Comparison</h1>
        <p className="text-sm text-slate-400 mt-1">
          Compare draft and berth restrictions, congestion indices, and active disruption logs side-by-side.
        </p>
      </div>

      {/* Selectors Panel */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="w-full sm:w-64">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Compare Port A</label>
            <select
              value={portAId}
              onChange={(e) => setPortAId(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {indianPorts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-900 p-3 rounded-full border border-slate-800 text-slate-400">
            <ArrowRightLeft className="h-5 w-5" />
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Compare Port B</label>
            <select
              value={portBId}
              onChange={(e) => setPortBId(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {indianPorts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Detail Cards Comparison */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-blue-400" />
            Vessel Restrictions & Infrastructure Specs
          </h2>
          
          <div className="space-y-4">
            {/* Draft comparison */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 flex justify-between items-center">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-500 block">Max Draft Limit</span>
                <span className={`text-base font-bold block mt-1 ${draftAdv === 'A' ? 'text-emerald-400' : 'text-slate-200'}`}>{portA.max_draft}m</span>
              </div>
              <div className="text-center font-semibold text-slate-600 text-xs px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg">Draft</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-500 block">Max Draft Limit</span>
                <span className={`text-base font-bold block mt-1 ${draftAdv === 'B' ? 'text-emerald-400' : 'text-slate-200'}`}>{portB.max_draft}m</span>
              </div>
            </div>

            {/* LOA comparison */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 flex justify-between items-center">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-500 block">Max Length (LOA)</span>
                <span className={`text-base font-bold block mt-1 ${loaAdv === 'A' ? 'text-emerald-400' : 'text-slate-200'}`}>{portA.max_loa}m</span>
              </div>
              <div className="text-center font-semibold text-slate-600 text-xs px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg">LOA</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-500 block">Max Length (LOA)</span>
                <span className={`text-base font-bold block mt-1 ${loaAdv === 'B' ? 'text-emerald-400' : 'text-slate-200'}`}>{portB.max_loa}m</span>
              </div>
            </div>

            {/* Congestion comparison */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 flex justify-between items-center">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-500 block">Congestion Score</span>
                <span className={`text-base font-bold block mt-1 ${congAdv === 'A' ? 'text-emerald-400' : 'text-slate-200'}`}>{portA.congestion_score}%</span>
              </div>
              <div className="text-center font-semibold text-slate-600 text-xs px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg">Queue</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-500 block">Congestion Score</span>
                <span className={`text-base font-bold block mt-1 ${congAdv === 'B' ? 'text-emerald-400' : 'text-slate-200'}`}>{portB.congestion_score}%</span>
              </div>
            </div>

            {/* Handling Capacity comparison */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 flex justify-between items-center">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-500 block">Dly Cargo Capacity</span>
                <span className={`text-base font-bold block mt-1 ${handlingAdv === 'A' ? 'text-emerald-400' : 'text-slate-200'}`}>{portA.cargo_handling_capacity.toLocaleString()} T</span>
              </div>
              <div className="text-center font-semibold text-slate-600 text-xs px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg">Handling</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-500 block">Dly Cargo Capacity</span>
                <span className={`text-base font-bold block mt-1 ${handlingAdv === 'B' ? 'text-emerald-400' : 'text-slate-200'}`}>{portB.cargo_handling_capacity.toLocaleString()} T</span>
              </div>
            </div>

            {/* Status comparison */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 flex justify-between items-center">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-500 block">Operational Status</span>
                <span className={`text-sm font-semibold uppercase block mt-1 ${portA.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>{portA.status}</span>
              </div>
              <div className="text-center font-semibold text-slate-600 text-xs px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg">Status</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-500 block">Operational Status</span>
                <span className={`text-sm font-semibold uppercase block mt-1 ${portB.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>{portB.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Operational Disruptions Comparison */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 mb-4 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Active Route & Port Disruption Log
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Port A Disruptions */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">{portA.name} Alerts</span>
                {portADisruptions.length === 0 ? (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl text-emerald-400 flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Clean log. No active operational alerts.</span>
                  </div>
                ) : (
                  portADisruptions.map(d => (
                    <div key={d.id} className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-red-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1 text-[10px] uppercase">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        {d.type} ALERT
                      </div>
                      <p className="leading-relaxed text-[11px] text-slate-300">{d.description}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Port B Disruptions */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">{portB.name} Alerts</span>
                {portBDisruptions.length === 0 ? (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl text-emerald-400 flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Clean log. No active operational alerts.</span>
                  </div>
                ) : (
                  portBDisruptions.map(d => (
                    <div key={d.id} className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-red-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1 text-[10px] uppercase">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        {d.type} ALERT
                      </div>
                      <p className="leading-relaxed text-[11px] text-slate-300">{d.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-xl text-[11px] text-slate-500 mt-6 leading-relaxed">
            💡 **SAIL Operations Tip**: Selecting ports with larger draft and LOA buffers minimizes high swell docking delays, reducing demurrage exposure under severe weather disruptions.
          </div>
        </div>

      </div>
    </div>
  );
}
