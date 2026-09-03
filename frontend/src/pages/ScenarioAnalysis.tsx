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
        // Resets/creates requests, or queries active ones
        // To ensure we always have requests, we fetch recommendations
        // which returns recommendations associated with cargo requests.
        // We can just fetch `/api/recommendations` to see what requests exist.
        // But the generator creates cargo requests on reset!
        // Let's fetch them directly. Since they might not have a direct GET all endpoint
        // we can fetch recommendations and extract request details, or mock them.
        // Wait, the API routes file app/api/api.py doesn't have a direct GET /cargo_requests.
        // But we can query recommendations, which contains cargo request info in optimize_charter returns
        // or we can fetch a static mock selector if none exists, or fetch recommendations
        // which contains cargo_request_id. Let's write a fetch that reads from recommendations
        // or simply queries a list. Let's fetch recommendations, and if empty, we fall back to a default mock request object.
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
          // Remove duplicates
          const uniqueList = list.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.id === v.id) === i);
          setRequests(uniqueList);
          setSelectedReqId(uniqueList[0].id);
        } else {
          // Seeding fallback if database reset has not been clicked yet
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
      } finally {
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
      // 1. Run Base Case Optimization (normal inputs)
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

      // 2. Run Simulated Custom Case
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
    } finally {
      setLoading(false);
    }
  };

  const selectedReq = requests.find(r => r.id === selectedReqId);

  // Build Recharts comparison data
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Voyage Scenario Simulator</h1>
        <p className="text-sm text-slate-400 mt-1">
          Simulate market shocks (fuel spikes, currency drops, port congestion) and examine impact on vessel ranking dynamically.
        </p>
      </div>

      {/* Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Input Panel (Left, 1 col) */}
        <div className="glass-panel p-5 rounded-2xl space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-blue-400" />
            Shock Parameter Workspace
          </h2>

          <div className="space-y-4">
            {/* Cargo Select */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Select Cargo Context</label>
              <select
                value={selectedReqId || ''}
                onChange={(e) => setSelectedReqId(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
              >
                {requests.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.quantity.toLocaleString()} MT {r.commodity} ({r.origin} &rarr; {r.destination})
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: Freight multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Freight Rate Factor</span>
                <span className="text-blue-400 font-semibold">{rateMult.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="1.50"
                step="0.05"
                value={rateMult}
                onChange={(e) => setRateMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Slider 2: Fuel Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Bunker Fuel Price</span>
                <span className="text-blue-400 font-semibold">${fuelPrice} / ton</span>
              </div>
              <input
                type="range"
                min="400"
                max="900"
                step="25"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Slider 3: FX Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">FX Exchange Rate</span>
                <span className="text-blue-400 font-semibold">{fxRate} INR/USD</span>
              </div>
              <input
                type="range"
                min="78.0"
                max="88.0"
                step="0.2"
                value={fxRate}
                onChange={(e) => setFxRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Slider 4: Congestion multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Port Congestion factor</span>
                <span className="text-blue-400 font-semibold">{congestionMult.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="2.50"
                step="0.1"
                value={congestionMult}
                onChange={(e) => setCongestionMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Dropdown: Disruption severity */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Disruption Level</label>
              <select
                value={disrSeverity}
                onChange={(e) => setDisrSeverity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
              >
                <option value="Low">Low (Dredging/Minor swells)</option>
                <option value="Medium">Medium (Berth maintenance)</option>
                <option value="High">High (Channel closures)</option>
                <option value="Critical">Critical (Geopolitical lockout)</option>
              </select>
            </div>

          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || !selectedReqId}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-xs active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Scenario Simulation
          </button>
        </div>

        {/* Outputs Comparative Panel (Right, 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {baseCase && simCase && baseCase.best_vessel && simCase.best_vessel ? (
            <>
              {/* Comparative Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Base Case Card */}
                <div className="glass-panel p-5 rounded-2xl relative border-l-4 border-l-slate-500 bg-slate-900/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Base Case Scenario</span>
                  <h4 className="text-lg font-bold text-slate-200 flex items-center gap-1.5">
                    <Ship className="h-5 w-5 text-slate-400" />
                    {baseCase.best_vessel.vessel.vessel_name}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Cost:</span>
                      <span className="font-bold text-slate-300 font-mono">${baseCase.best_vessel.metrics.total_cost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fuel Cost:</span>
                      <span className="font-semibold text-slate-400 font-mono">${baseCase.best_vessel.metrics.fuel_cost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Port Idle Time:</span>
                      <span className="font-semibold text-slate-400">{(baseCase.best_vessel.metrics.idle_days * 24.0).toFixed(0)} hours</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Risk Index:</span>
                      <span className="font-bold text-emerald-400">{baseCase.best_vessel.risk_score.toFixed(0)}/100</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Case Card */}
                <div className="glass-panel p-5 rounded-2xl relative border-l-4 border-l-blue-500 bg-blue-950/5">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Simulated shock Case</span>
                  <h4 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                    <Ship className="h-5 w-5 text-blue-400" />
                    {simCase.best_vessel.vessel.vessel_name}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Cost:</span>
                      <span className="font-bold text-blue-300 font-mono">${simCase.best_vessel.metrics.total_cost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fuel Cost:</span>
                      <span className="font-semibold text-slate-400 font-mono">${simCase.best_vessel.metrics.fuel_cost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Port Idle Time:</span>
                      <span className="font-semibold text-slate-400">{(simCase.best_vessel.metrics.idle_days * 24.0).toFixed(0)} hours</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Risk Index:</span>
                      <span className={`font-bold ${simCase.best_vessel.risk_score > 60 ? 'text-red-400' : 'text-amber-400'}`}>
                        {simCase.best_vessel.risk_score.toFixed(0)}/100
                      </span>
                    </div>
                  </div>
                  
                  {baseCase.best_vessel.vessel.id !== simCase.best_vessel.vessel.id && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[9px] bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded text-blue-400 font-bold uppercase tracking-wider">
                      ⚠️ Best Vessel Changed
                    </div>
                  )}
                </div>

              </div>

              {/* Chart Comparison */}
              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">
                  Voyage Cost Breakdown Comparison ($ USD)
                </h3>
                <div className="h-[250px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend />
                      <Bar dataKey="Base Case" fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Simulated Case" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-8 rounded-2xl text-center text-xs text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
              <AlertTriangle className="h-8 w-8 text-slate-600 mb-3" />
              <p>Configure custom market shock sliders on the left and click "Run Scenario Simulation" to solve.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
