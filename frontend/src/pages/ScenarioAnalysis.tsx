import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Sliders, AlertTriangle, Ship, RefreshCw } from 'lucide-react';

interface CargoRequest {
  id: number;
  commodity: string;
  quantity: number;
  origin: string;
  destination: string;
}

export default function ScenarioAnalysis() {
  const [requests, setRequests] = useState<CargoRequest[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  
  // Simulation Inputs
  const [rateMult, setRateMult] = useState(1.0);
  const [fuelPrice, setFuelPrice] = useState(600);
  const [fxRate, setFxRate] = useState(83.5);
  const [congestionMult, setCongestionMult] = useState(1.0);
  const [disrSeverity, setDisrSeverity] = useState('Low');
  
  // Results
  const [baseCase, setBaseCase] = useState<any | null>(null);
  const [simCase, setSimCase] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoadingReqs(true);
        let res: Response;
        try {
          res = await fetch('/api/recommendations');
        } catch (_) {
          res = await fetch('http://127.0.0.1:8000/api/recommendations');
        }
        
        const text = await res.text();
        let data: any = [];
        try {
          data = text ? JSON.parse(text) : [];
        } catch (_) {
          data = [];
        }

        if (Array.isArray(data) && data.length > 0) {
          const list = data.map((r: any) => ({
            id: r.cargo_request_id,
            commodity: r.explanation && r.explanation.includes('Coking Coal') ? 'Coking Coal' : 'Thermal Coal',
            quantity: r.explanation && r.explanation.includes('Coking Coal') ? 75000 : 80000,
            origin: r.explanation && r.explanation.includes('Newcastle') ? 'Newcastle' : 'Richards Bay',
            destination: r.explanation && r.explanation.includes('Visakhapatnam') ? 'Visakhapatnam' : 'Paradip'
          }));
          const uniqueList = list.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.id === v.id) === i);
          setRequests(uniqueList);
          setSelectedReqId(uniqueList[0].id);
        } else {
          const fallbackList = [
            { id: 1, commodity: 'Coking Coal', quantity: 75000, origin: 'Newcastle', destination: 'Visakhapatnam' },
            { id: 2, commodity: 'Thermal Coal', quantity: 80000, origin: 'Richards Bay', destination: 'Paradip' },
            { id: 3, commodity: 'Iron Ore', quantity: 82000, origin: 'Dampier', destination: 'Gangavaram' }
          ];
          setRequests(fallbackList);
          setSelectedReqId(1);
        }
      } catch (e) {
        console.error("Failed to load requests", e);
      } flex: {
        setLoadingReqs(false);
      }
    };
    fetchRequests();
  }, []);

  const handleSimulate = async () => {
    if (!selectedReqId) return;
    setLoading(true);
    setBaseCase(null);
    setSimCase(null);

    try {
      const basePayload = {
        request_id: selectedReqId,
        rate_multiplier: 1.0,
        fuel_price: 600.0,
        fx_rate: 82.5,
        congestion_multiplier: 1.0,
        disruption_severity: 'Low'
      };

      let baseRes: Response;
      try {
        baseRes = await fetch('/api/scenarios/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(basePayload)
        });
      } catch (_) {
        baseRes = await fetch('http://127.0.0.1:8000/api/scenarios/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(basePayload)
        });
      }
      
      const baseText = await baseRes.text();
      let baseData: any = {};
      try {
        baseData = baseText ? JSON.parse(baseText) : {};
      } catch (err) {
        throw new Error(`Base case error (${baseRes.status}): ${baseText.substring(0, 80)}`);
      }
      if (!baseRes.ok) {
        throw new Error(baseData.detail || `Base case simulation failed (${baseRes.status})`);
      }
      setBaseCase(baseData);

      const simPayload = {
        request_id: selectedReqId,
        rate_multiplier: rateMult,
        fuel_price: fuelPrice,
        fx_rate: fxRate,
        congestion_multiplier: congestionMult,
        disruption_severity: disrSeverity
      };

      let simRes: Response;
      try {
        simRes = await fetch('/api/scenarios/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simPayload)
        });
      } catch (_) {
        simRes = await fetch('http://127.0.0.1:8000/api/scenarios/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simPayload)
        });
      }

      const simText = await simRes.text();
      let simData: any = {};
      try {
        simData = simText ? JSON.parse(simText) : {};
      } catch (err) {
        throw new Error(`Sim case error (${simRes.status}): ${simText.substring(0, 80)}`);
      }
      if (!simRes.ok) {
        throw new Error(simData.detail || `Simulation failed (${simRes.status})`);
      }
      setSimCase(simData);

    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Simulation failed. Please check backend connection.');
    } flex: {
      setLoading(false);
    }
  };

  const chartData = baseCase && simCase && baseCase.best_vessel && simCase.best_vessel ? [
    {
      name: 'Freight Cost',
      'Base Case': baseCase.best_vessel.metrics.freight_cost,
      'Simulated Case': simCase.best_vessel.metrics.freight_cost
    },
    {
      name: 'Fuel Cost',
      'Base Case': baseCase.best_vessel.metrics.fuel_cost,
      'Simulated Case': simCase.best_vessel.metrics.fuel_cost
    },
    {
      name: 'Idle Cost',
      'Base Case': baseCase.best_vessel.metrics.idle_cost,
      'Simulated Case': simCase.best_vessel.metrics.idle_cost
    }
  ] : [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase flex items-center gap-3">
          <Sliders className="h-6 w-6 text-sky-400" />
          Voyage Scenario Simulator Desk
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Steel Authority of India Limited • Market Shock Stress Testing & Vessel Ranking Shifts
        </p>
      </div>

      {/* Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Input Panel */}
        <div className="card-slate-navy p-5 space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Shock Parameter Workspace
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Select Cargo Request</label>
              <select
                value={selectedReqId || ''}
                onChange={(e) => setSelectedReqId(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
              >
                {requests.map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-900">
                    {r.quantity.toLocaleString()} MT {r.commodity} ({r.origin} &rarr; {r.destination})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 inset-slate-container p-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Freight Rate Factor</span>
                <span className="text-sky-400 font-bold">{rateMult.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="1.50"
                step="0.05"
                value={rateMult}
                onChange={(e) => setRateMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div className="space-y-1.5 inset-slate-container p-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Bunker Fuel Price</span>
                <span className="text-sky-400 font-bold">${fuelPrice} / ton</span>
              </div>
              <input
                type="range"
                min="400"
                max="900"
                step="25"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div className="space-y-1.5 inset-slate-container p-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 text-[10px] uppercase font-bold">FX Exchange Rate</span>
                <span className="text-sky-400 font-bold">{fxRate} INR/USD</span>
              </div>
              <input
                type="range"
                min="78.0"
                max="88.0"
                step="0.2"
                value={fxRate}
                onChange={(e) => setFxRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div className="space-y-1.5 inset-slate-container p-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Port Congestion Factor</span>
                <span className="text-sky-400 font-bold">{congestionMult.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="2.50"
                step="0.1"
                value={congestionMult}
                onChange={(e) => setCongestionMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Disruption Severity</label>
              <select
                value={disrSeverity}
                onChange={(e) => setDisrSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none cursor-pointer font-mono"
              >
                <option value="Low" className="bg-slate-900">Low (Minor dredging swells)</option>
                <option value="Medium" className="bg-slate-900">Medium (Berth maintenance)</option>
                <option value="High" className="bg-slate-900">High (Channel closures)</option>
                <option value="Critical" className="bg-slate-900">Critical (Geopolitical lockout)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || !selectedReqId}
            className="w-full btn-navy-primary font-semibold text-xs uppercase py-3 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Execute Scenario Simulation
          </button>
        </div>

        {/* Outputs Comparative Panel */}
        <div className="lg:col-span-2 space-y-6">
          {baseCase && simCase && baseCase.best_vessel && simCase.best_vessel ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="card-slate-navy p-5 border-l-4 border-l-slate-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Base Case Scenario</span>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Ship className="h-4 w-4 text-slate-400" />
                    {baseCase.best_vessel.vessel.vessel_name}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs font-mono">
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Cost:</span>
                      <span className="font-bold text-slate-100">${baseCase.best_vessel.metrics.total_cost.toLocaleString()}</span>
                    </div>
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Fuel Cost:</span>
                      <span className="font-bold text-slate-300">${baseCase.best_vessel.metrics.fuel_cost.toLocaleString()}</span>
                    </div>
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Port Idle:</span>
                      <span className="font-bold text-slate-300">{(baseCase.best_vessel.metrics.idle_days * 24.0).toFixed(0)} hrs</span>
                    </div>
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Risk Index:</span>
                      <span className="font-bold text-emerald-400">{baseCase.best_vessel.risk_score.toFixed(0)}/100</span>
                    </div>
                  </div>
                </div>

                <div className="card-slate-navy p-5 border-l-4 border-l-sky-400 relative">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">Simulated Shock Case</span>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Ship className="h-4 w-4 text-sky-400" />
                    {simCase.best_vessel.vessel.vessel_name}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs font-mono">
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Cost:</span>
                      <span className="font-bold text-sky-400">${simCase.best_vessel.metrics.total_cost.toLocaleString()}</span>
                    </div>
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Fuel Cost:</span>
                      <span className="font-bold text-slate-300">${simCase.best_vessel.metrics.fuel_cost.toLocaleString()}</span>
                    </div>
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Port Idle:</span>
                      <span className="font-bold text-slate-300">{(simCase.best_vessel.metrics.idle_days * 24.0).toFixed(0)} hrs</span>
                    </div>
                    <div className="inset-slate-container p-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Risk Index:</span>
                      <span className={`font-bold ${simCase.best_vessel.risk_score > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {simCase.best_vessel.risk_score.toFixed(0)}/100
                      </span>
                    </div>
                  </div>
                  
                  {baseCase.best_vessel.vessel.id !== simCase.best_vessel.vessel.id && (
                    <div className="absolute top-3 right-3 badge-slate-amber text-[9px] font-bold uppercase px-2 py-0.5 rounded-md">
                      ⚠️ RANK SHIFT
                    </div>
                  )}
                </div>
              </div>

              <div className="card-slate-navy p-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-3">
                  Voyage Cost Component Comparison ($ USD)
                </h3>
                <div className="h-[240px] w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '0.5rem' }} />
                      <Legend />
                      <Bar dataKey="Base Case" fill="#64748B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Simulated Case" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="card-slate-navy p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <AlertTriangle className="h-8 w-8 text-sky-400 mb-2" />
              <p className="font-medium text-slate-300 max-w-sm">Select market shock sliders on the left and click "Execute Scenario Simulation".</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
