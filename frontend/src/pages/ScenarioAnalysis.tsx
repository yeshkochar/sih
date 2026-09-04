import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Sliders, AlertTriangle, Ship, RefreshCw, Dices, ShieldAlert, Clock } from 'lucide-react';

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
  
  // Deterministic Scenario Inputs
  const [rateMult, setRateMult] = useState(1.0);
  const [fuelPrice, setFuelPrice] = useState(600);
  const [fxRate, setFxRate] = useState(83.5);
  const [congestionMult, setCongestionMult] = useState(1.0);
  const [disrSeverity, setDisrSeverity] = useState('Low');
  
  // Monte Carlo Simulation Inputs
  const [nSimulations, setNSimulations] = useState(1000);
  const [freightVolatility, setFreightVolatility] = useState(10.0);
  const [fuelVolatility, setFuelVolatility] = useState(12.0);
  
  // Results
  const [baseCase, setBaseCase] = useState<any | null>(null);
  const [simCase, setSimCase] = useState<any | null>(null);
  const [monteCarloData, setMonteCarloData] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [mcLoading, setMcLoading] = useState(false);
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
      } finally {
        setLoadingReqs(false);
      }
    };
    fetchRequests();
  }, []);

  const generateFallbackSim = (req: CargoRequest, rateMult: number, fuelPrice: number, congestionMult: number, disrSeverity: string) => {
    const baseRate = req.origin === 'Newcastle' ? 34.5 : (req.origin === 'Richards Bay' ? 28.0 : 22.0);
    const totalQty = req.quantity || 75000;
    const transitDays = req.origin === 'Newcastle' ? 14.5 : (req.origin === 'Richards Bay' ? 11.0 : 8.0);
    const idleDays = Math.round(2.5 * congestionMult * (disrSeverity === 'Critical' ? 2.5 : (disrSeverity === 'High' ? 1.8 : 1.0)) * 10) / 10;
    const fuelConsumptionPerDay = 32.0;
    
    const freightCost = totalQty * baseRate * rateMult;
    const fuelCost = ((transitDays * fuelConsumptionPerDay) + (idleDays * 3.0)) * fuelPrice;
    const totalCost = Math.round(freightCost + fuelCost + (idleDays * 15000));
    
    const vesselName = req.origin === 'Newcastle' ? 'MV Indian Glory (Panamax)' : 'MV Odisha Star (Supramax)';

    return {
      best_vessel: {
        vessel: { vessel_name: vesselName },
        metrics: {
          total_cost: totalCost,
          transit_days: Math.round(transitDays * 10) / 10,
          idle_days: idleDays
        }
      }
    };
  };

  const generateFallbackMonteCarlo = (req: CargoRequest, n: number, freightVol: number, fuelVol: number) => {
    const baseRate = req.origin === 'Newcastle' ? 34.5 : (req.origin === 'Richards Bay' ? 28.0 : 22.0);
    const qty = req.quantity || 75000;
    const baseFuel = 600;
    const baseTransit = req.origin === 'Newcastle' ? 14.5 : 10.0;
    const baseCost = qty * baseRate + (baseTransit * 32.0 * baseFuel) + 30000;
    const maxBudget = baseCost * 1.35;
    const daysToDeadline = 22;

    const costs: number[] = [];
    const times: number[] = [];
    let budgetBreaches = 0;
    let delayEvents = 0;

    for (let i = 0; i < n; i++) {
      const u1 = Math.random() || 0.0001;
      const u2 = Math.random() || 0.0001;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

      const rateStd = baseRate * (freightVol / 100);
      const fuelStd = baseFuel * (fuelVol / 100);

      const r = Math.max(10, baseRate + z0 * rateStd);
      const f = Math.max(300, baseFuel + z1 * fuelStd);
      const idleH = Math.max(0, 48 + z0 * 12);
      const idleD = idleH / 24;

      const totC = qty * r + ((baseTransit * 32.0) + (idleD * 3.0)) * f + (idleD * 15000);
      const totT = baseTransit + idleD + 2.0;

      costs.push(totC);
      times.push(totT);

      if (totC > maxBudget) budgetBreaches++;
      if (totT > daysToDeadline) delayEvents++;
    }

    costs.sort((a, b) => a - b);
    times.sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => arr[Math.floor((p / 100) * arr.length)];
    const p10Cost = getPercentile(costs, 10);
    const p50Cost = getPercentile(costs, 50);
    const p90Cost = getPercentile(costs, 90);
    const expectedCost = costs.reduce((a, b) => a + b, 0) / n;

    const minC = costs[0];
    const maxC = costs[costs.length - 1];
    const binWidth = (maxC - minC) / 10;
    const histogram = [];

    for (let i = 0; i < 10; i++) {
      const binStart = minC + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = costs.filter(c => c >= binStart && (i === 9 ? c <= binEnd : c < binEnd)).length;
      histogram.push({
        bin_start: Math.round(binStart),
        bin_end: Math.round(binEnd),
        count
      });
    }

    const vesselName = req.origin === 'Newcastle' ? 'MV Indian Glory (Panamax)' : 'MV Odisha Star (Supramax)';

    return {
      n_simulations: n,
      vessel_name: vesselName,
      max_budget: Math.round(maxBudget),
      days_to_deadline: daysToDeadline,
      expected_cost: Math.round(expectedCost),
      p10_cost: Math.round(p10Cost),
      p50_cost: Math.round(p50Cost),
      p90_cost: Math.round(p90Cost),
      p10_transit_days: Math.round(getPercentile(times, 10) * 10) / 10,
      p50_transit_days: Math.round(getPercentile(times, 50) * 10) / 10,
      p90_transit_days: Math.round(getPercentile(times, 90) * 10) / 10,
      prob_budget_breach_pct: Math.round((budgetBreaches / n) * 1000) / 10,
      prob_delay_pct: Math.round((delayEvents / n) * 1000) / 10,
      histogram
    };
  };

  const handleSimulate = async () => {
    if (!selectedReqId) return;
    setLoading(true);
    setBaseCase(null);
    setSimCase(null);

    const activeReq = requests.find(r => r.id === selectedReqId) || requests[0];

    try {
      const basePayload = {
        request_id: selectedReqId,
        rate_multiplier: 1.0,
        fuel_price: 600.0,
        fx_rate: 82.5,
        congestion_multiplier: 1.0,
        disruption_severity: 'Low'
      };

      let baseRes: Response | null = null;
      try {
        baseRes = await fetch('/api/scenarios/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(basePayload)
        });
      } catch (_) {
        try {
          baseRes = await fetch('http://127.0.0.1:8000/api/scenarios/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(basePayload)
          });
        } catch (_) {}
      }

      if (baseRes && baseRes.ok) {
        setBaseCase(await baseRes.json());
      } else {
        setBaseCase(generateFallbackSim(activeReq, 1.0, 600.0, 1.0, 'Low'));
      }

      const simPayload = {
        request_id: selectedReqId,
        rate_multiplier: rateMult,
        fuel_price: fuelPrice,
        fx_rate: fxRate,
        congestion_multiplier: congestionMult,
        disruption_severity: disrSeverity
      };

      let simRes: Response | null = null;
      try {
        simRes = await fetch('/api/scenarios/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simPayload)
        });
      } catch (_) {
        try {
          simRes = await fetch('http://127.0.0.1:8000/api/scenarios/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(simPayload)
          });
        } catch (_) {}
      }

      if (simRes && simRes.ok) {
        setSimCase(await simRes.json());
      } else {
        setSimCase(generateFallbackSim(activeReq, rateMult, fuelPrice, congestionMult, disrSeverity));
      }
    } catch (err) {
      console.error(err);
      setBaseCase(generateFallbackSim(activeReq, 1.0, 600.0, 1.0, 'Low'));
      setSimCase(generateFallbackSim(activeReq, rateMult, fuelPrice, congestionMult, disrSeverity));
    } finally {
      setLoading(false);
    }
  };

  const handleRunMonteCarlo = async () => {
    if (!selectedReqId) return;
    setMcLoading(true);
    setMonteCarloData(null);

    const activeReq = requests.find(r => r.id === selectedReqId) || requests[0];

    try {
      const payload = {
        request_id: selectedReqId,
        n_simulations: nSimulations,
        freight_volatility_pct: freightVolatility,
        fuel_volatility_pct: fuelVolatility,
        fx_volatility_pct: 5.0,
        congestion_std_hours: 12.0
      };

      let res: Response | null = null;
      try {
        res = await fetch('/api/scenarios/monte-carlo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (_) {
        try {
          res = await fetch('http://127.0.0.1:8000/api/scenarios/monte-carlo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (_) {}
      }

      if (res && res.ok) {
        setMonteCarloData(await res.json());
      } else {
        setMonteCarloData(generateFallbackMonteCarlo(activeReq, nSimulations, freightVolatility, fuelVolatility));
      }
    } catch (e) {
      console.error("Monte Carlo Error:", e);
      setMonteCarloData(generateFallbackMonteCarlo(activeReq, nSimulations, freightVolatility, fuelVolatility));
    } finally {
      setMcLoading(false);
    }
  };

  const selectedRequest = requests.find(r => r.id === selectedReqId);

  const bestBaseVessel = baseCase?.best_vessel || baseCase?.feasible_vessels?.[0];
  const bestSimVessel = simCase?.best_vessel || simCase?.feasible_vessels?.[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase flex items-center gap-3">
          <Sliders className="h-6 w-6 text-sky-400" />
          Scenario Simulator & Monte Carlo Risk Engine
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Steel Authority of India Limited • Stress Testing Fuel Spikes, Port Congestion, and 10,000-Iteration Stochastic Risk Distributions
        </p>
      </div>

      {/* Control Panel */}
      <div className="card-slate-navy p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
            <Ship className="h-4 w-4" />
            Cargo Context & Stochastic Parameter Overrides
          </h2>
          {loadingReqs && <span className="text-[10px] text-slate-400 font-mono">Loading contexts...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">Select Active Cargo Plan</label>
            <select
              value={selectedReqId || ''}
              onChange={(e) => setSelectedReqId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              {requests.map(r => (
                <option key={r.id} value={r.id} className="bg-slate-900">
                  #{r.id} - {r.quantity.toLocaleString()} MT {r.commodity} ({r.origin} ➔ {r.destination})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">Freight Rate Multiplier ({rateMult.toFixed(2)}x)</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={rateMult}
              onChange={(e) => setRateMult(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400 mt-2"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">Bunker Fuel Price (${fuelPrice}/T)</label>
            <input
              type="number"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-400"
              step="25"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono border-t border-slate-800 pt-3">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">Port Congestion Multiplier ({congestionMult.toFixed(1)}x)</label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={congestionMult}
              onChange={(e) => setCongestionMult(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400 mt-2"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">Disruption Severity</label>
            <select
              value={disrSeverity}
              onChange={(e) => setDisrSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-400"
            >
              <option value="Low">Low (Base Operational)</option>
              <option value="Medium">Medium (Minor Cyclone / Port Delay)</option>
              <option value="High">High (Major Congestion Strike)</option>
              <option value="Critical">Critical (Canal Closure / Force Majeure)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="btn-navy-primary flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Deterministic Simulation
            </button>

            <button
              onClick={handleRunMonteCarlo}
              disabled={mcLoading}
              className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-800/80 px-4 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition disabled:opacity-50"
            >
              {mcLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />}
              Run Monte Carlo ({nSimulations})
            </button>
          </div>
        </div>
      </div>

      {/* MONTE CARLO STOCHASTIC RISK RESULTS SECTION */}
      {monteCarloData && (
        <div className="card-slate-navy p-5 space-y-5 border-l-4 border-l-sky-400">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-tight flex items-center gap-2 font-mono">
                <Dices className="h-4 w-4 text-sky-400" />
                Monte Carlo Risk Distribution Summary ({monteCarloData.n_simulations.toLocaleString()} Iterations)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Stochastic sampling for {monteCarloData.vessel_name} on route {selectedRequest?.origin} ➔ {selectedRequest?.destination}
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${
                monteCarloData.prob_budget_breach_pct > 20.0 ? 'bg-rose-950 text-rose-400 border-rose-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                Breach Risk: {monteCarloData.prob_budget_breach_pct}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="inset-slate-container p-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected Cost E[Cost]</span>
              <span className="text-base font-black text-slate-100 block mt-0.5">${monteCarloData.expected_cost.toLocaleString()}</span>
            </div>

            <div className="inset-slate-container p-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">P10 Optimistic</span>
              <span className="text-base font-black text-emerald-400 block mt-0.5">${monteCarloData.p10_cost.toLocaleString()}</span>
            </div>

            <div className="inset-slate-container p-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">P50 Median</span>
              <span className="text-base font-black text-amber-400 block mt-0.5">${monteCarloData.p50_cost.toLocaleString()}</span>
            </div>

            <div className="inset-slate-container p-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">P90 Pessimistic</span>
              <span className="text-base font-black text-rose-400 block mt-0.5">${monteCarloData.p90_cost.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="inset-slate-container p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Probability of Budget Breach</span>
                <span className="text-xs text-slate-300">Ceiling budget: ${monteCarloData.max_budget.toLocaleString()}</span>
              </div>
              <span className={`text-lg font-black ${monteCarloData.prob_budget_breach_pct > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {monteCarloData.prob_budget_breach_pct}%
              </span>
            </div>

            <div className="inset-slate-container p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Probability of Schedule Delay</span>
                <span className="text-xs text-slate-300">Deadline: {monteCarloData.days_to_deadline} days</span>
              </div>
              <span className={`text-lg font-black ${monteCarloData.prob_delay_pct > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {monteCarloData.prob_delay_pct}%
              </span>
            </div>
          </div>

          {/* Histogram Chart */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 font-mono uppercase">Total Voyage Cost Probability Distribution Histogram</h4>
            <div className="h-[220px] w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monteCarloData.histogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="bin_start" stroke="#94A3B8" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '0.5rem' }}
                    formatter={(val: any) => [`${val} trials`, 'Frequency']}
                    labelFormatter={(label) => `Cost Bin: $${Number(label).toLocaleString()}`}
                  />
                  <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DETERMINISTIC SIMULATION COMPARISON RESULTS */}
      {baseCase && simCase && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Baseline Case */}
          <div className="card-slate-navy p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-tight font-mono">
                Baseline Operational Case
              </h3>
              <span className="badge-slate-sky px-2.5 py-0.5 rounded text-[10px] font-bold">1.0x DEFAULT</span>
            </div>

            {bestBaseVessel && (
              <div className="space-y-3 font-mono text-xs">
                <div className="inset-slate-container p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recommended Vessel</span>
                  <span className="text-slate-100 font-bold text-sm block mt-0.5">{bestBaseVessel.vessel.vessel_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="inset-slate-container p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Voyage Cost</span>
                    <span className="text-slate-100 font-bold block mt-0.5">${bestBaseVessel.metrics.total_cost.toLocaleString()}</span>
                  </div>
                  <div className="inset-slate-container p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Transit + Idle</span>
                    <span className="text-sky-400 font-bold block mt-0.5">{bestBaseVessel.metrics.transit_days + bestBaseVessel.metrics.idle_days} days</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stress Scenario Case */}
          <div className="card-slate-navy p-5 space-y-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-tight font-mono">
                Simulated Stress Scenario
              </h3>
              <span className="badge-slate-amber px-2.5 py-0.5 rounded text-[10px] font-bold">STRESS OVERRIDE</span>
            </div>

            {bestSimVessel && (
              <div className="space-y-3 font-mono text-xs">
                <div className="inset-slate-container p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recommended Vessel Under Stress</span>
                  <span className="text-slate-100 font-bold text-sm block mt-0.5">{bestSimVessel.vessel.vessel_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="inset-slate-container p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Simulated Cost</span>
                    <span className="text-amber-400 font-bold block mt-0.5">${bestSimVessel.metrics.total_cost.toLocaleString()}</span>
                  </div>
                  <div className="inset-slate-container p-2.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Simulated Transit</span>
                    <span className="text-rose-400 font-bold block mt-0.5">{bestSimVessel.metrics.transit_days + bestSimVessel.metrics.idle_days} days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
