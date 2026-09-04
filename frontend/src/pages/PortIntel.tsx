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
  const indianPorts = ports.filter(p => p.coast === 'East Coast');
  
  const [portAId, setPortAId] = useState<number>(indianPorts[0]?.id || 1);
  const [portBId, setPortBId] = useState<number>(indianPorts[1]?.id || 2);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDisruptions = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/alerts');
        const data = await res.json();
        
        const mappedDisr = data
          .filter((a: any) => a.id.startsWith('alert-disr-'))
          .map((a: any) => ({
            id: a.id,
            port: a.message.split(' ')[0],
            type: a.title.split(' ')[0],
            severity: a.message.includes('Severity: High') ? 'High' : 'Medium',
            description: a.message
          }));
        setDisruptions(mappedDisr);
      } catch (e) {
        console.error("Failed to load disruptions", e);
      } flex: {
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

  const draftAdv = portA.max_draft !== portB.max_draft ? (portA.max_draft > portB.max_draft ? 'A' : 'B') : null;
  const loaAdv = portA.max_loa !== portB.max_loa ? (portA.max_loa > portB.max_loa ? 'A' : 'B') : null;
  const congAdv = portA.congestion_score !== portB.congestion_score ? (portA.congestion_score < portB.congestion_score ? 'A' : 'B') : null;
  const handlingAdv = portA.cargo_handling_capacity !== portB.cargo_handling_capacity ? (portA.cargo_handling_capacity > portB.cargo_handling_capacity ? 'A' : 'B') : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase flex items-center gap-3">
          <Compass className="h-6 w-6 text-sky-400" />
          Port Infrastructure & Disruption Intelligence Desk
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Steel Authority of India Limited • Indian East Coast Bulk Discharge Terminal Comparison
        </p>
      </div>

      {/* Selectors Panel */}
      <div className="card-slate-navy p-5 font-mono">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="w-full sm:w-64">
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Compare Port A</label>
            <select
              value={portAId}
              onChange={(e) => setPortAId(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
            >
              {indianPorts.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-950 p-3 rounded-full text-sky-400 border border-slate-800">
            <ArrowRightLeft className="h-4 w-4" />
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Compare Port B</label>
            <select
              value={portBId}
              onChange={(e) => setPortBId(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
            >
              {indianPorts.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        
        {/* Left Side: Detail Cards Comparison */}
        <div className="card-slate-navy p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Compass className="h-4 w-4 text-sky-400" />
            Infrastructure Specs & Restriction Limits
          </h2>
          
          <div className="space-y-3">
            <div className="inset-slate-container p-3 flex justify-between items-center text-xs">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Max Draft</span>
                <span className={`text-sm font-black block mt-0.5 ${draftAdv === 'A' ? 'text-emerald-400' : 'text-slate-100'}`}>{portA.max_draft} m</span>
              </div>
              <div className="text-center font-bold text-sky-400 text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">Draft</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Max Draft</span>
                <span className={`text-sm font-black block mt-0.5 ${draftAdv === 'B' ? 'text-emerald-400' : 'text-slate-100'}`}>{portB.max_draft} m</span>
              </div>
            </div>

            <div className="inset-slate-container p-3 flex justify-between items-center text-xs">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Max LOA Length</span>
                <span className={`text-sm font-black block mt-0.5 ${loaAdv === 'A' ? 'text-emerald-400' : 'text-slate-100'}`}>{portA.max_loa} m</span>
              </div>
              <div className="text-center font-bold text-sky-400 text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">LOA</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Max LOA Length</span>
                <span className={`text-sm font-black block mt-0.5 ${loaAdv === 'B' ? 'text-emerald-400' : 'text-slate-100'}`}>{portB.max_loa} m</span>
              </div>
            </div>

            <div className="inset-slate-container p-3 flex justify-between items-center text-xs">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Congestion Score</span>
                <span className={`text-sm font-black block mt-0.5 ${congAdv === 'A' ? 'text-emerald-400' : 'text-slate-100'}`}>{portA.congestion_score}%</span>
              </div>
              <div className="text-center font-bold text-sky-400 text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">Queue</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Congestion Score</span>
                <span className={`text-sm font-black block mt-0.5 ${congAdv === 'B' ? 'text-emerald-400' : 'text-slate-100'}`}>{portB.congestion_score}%</span>
              </div>
            </div>

            <div className="inset-slate-container p-3 flex justify-between items-center text-xs">
              <div className="w-5/12">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Capacity</span>
                <span className={`text-sm font-black block mt-0.5 ${handlingAdv === 'A' ? 'text-emerald-400' : 'text-slate-100'}`}>{portA.cargo_handling_capacity.toLocaleString()} T</span>
              </div>
              <div className="text-center font-bold text-sky-400 text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">Intake</div>
              <div className="w-5/12 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Capacity</span>
                <span className={`text-sm font-black block mt-0.5 ${handlingAdv === 'B' ? 'text-emerald-400' : 'text-slate-100'}`}>{portB.cargo_handling_capacity.toLocaleString()} T</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Operational Disruptions Comparison */}
        <div className="card-slate-navy p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Active Route Disruption Telemetry
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-100 block">{portA.name} Log</span>
                {portADisruptions.length === 0 ? (
                  <div className="badge-slate-emerald p-3 rounded-lg text-xs flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Clean log. No active operational alerts.</span>
                  </div>
                ) : (
                  portADisruptions.map(d => (
                    <div key={d.id} className="bg-rose-950/40 border border-rose-800 p-2.5 rounded-lg text-slate-100 text-xs space-y-1">
                      <div className="font-bold text-[10px] uppercase text-rose-400">
                        ⚠️ {d.type} DISRUPTION
                      </div>
                      <p className="leading-relaxed text-[11px] text-slate-300">{d.description}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-100 block">{portB.name} Log</span>
                {portBDisruptions.length === 0 ? (
                  <div className="badge-slate-emerald p-3 rounded-lg text-xs flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Clean log. No active operational alerts.</span>
                  </div>
                ) : (
                  portBDisruptions.map(d => (
                    <div key={d.id} className="bg-rose-950/40 border border-rose-800 p-2.5 rounded-lg text-slate-100 text-xs space-y-1">
                      <div className="font-bold text-[10px] uppercase text-rose-400">
                        ⚠️ {d.type} DISRUPTION
                      </div>
                      <p className="leading-relaxed text-[11px] text-slate-300">{d.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="inset-slate-container p-3 text-xs text-slate-400 mt-5 font-sans leading-relaxed">
            💡 <strong className="text-sky-400">SAIL Protocol</strong>: Selecting ports with higher draft tolerances avoids monsoon tide demurrage.
          </div>
        </div>

      </div>
    </div>
  );
}
