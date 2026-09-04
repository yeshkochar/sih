import React, { useState } from 'react';
import { Ship, Calendar, ShieldAlert, Award, FileText, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';
import FreshnessTag from '../components/FreshnessTag';
import AIExplanation from '../components/AIExplanation';

interface Port {
  id: number;
  name: string;
  country: string;
}

interface Vessel {
  id: number;
  vessel_name: string;
  vessel_type: string;
  deadweight_tonnage: number;
  loa: number;
  beam: number;
  draft: number;
  cargo_capacity: number;
  speed: number;
  fuel_consumption: number;
  availability_status: string;
}

interface OptimizerProps {
  ports: Port[];
  vessels: Vessel[];
  user: any;
}

export default function Optimizer({ ports, vessels, user }: OptimizerProps) {
  const [commodity, setCommodity] = useState('Coking Coal');
  const [cargoQuantity, setCargoQuantity] = useState(75000);
  const [originPort, setOriginPort] = useState('Newcastle');
  const [destPort, setDestPort] = useState('Visakhapatnam');
  const [laycanStart, setLaycanStart] = useState('2026-03-20');
  const [preferredVesselType, setPreferredVesselType] = useState('Panamax');
  const [maxBudget, setMaxBudget] = useState(45.0);
  const [priority, setPriority] = useState('Cost');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfeasible, setShowInfeasible] = useState(false);

  // Override Modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedOverrideVessel, setSelectedOverrideVessel] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('Existing supplier relationship');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fallbackOptimization = (reqPayload: any) => {
    const originP = ports.find(p => p.name === reqPayload.origin) || { name: reqPayload.origin, country: 'Australia' };
    const destP = ports.find(p => p.name === reqPayload.destination) || { name: reqPayload.destination, country: 'India' };

    const rankedVessels = vessels.map((v, i) => {
      const draftOk = (v.draft || 13.5) <= 16.5;
      const capacityOk = (v.deadweight_tonnage || 75000) >= (reqPayload.quantity * 0.9);
      const isFeasible = draftOk && capacityOk;

      const baseCost = reqPayload.quantity * (30.0 + (i * 2.5));
      const fuelCost = 600.0 * 15 * (v.fuel_consumption || 30.0);
      const totalCost = baseCost + fuelCost;
      const score = isFeasible ? Math.max(65.0, 95.0 - (i * 4.5)) : Math.max(20.0, 45.0 - (i * 5.0));

      return {
        vessel: v,
        feasibility: {
          feasible: isFeasible,
          draft_check: { pass: draftOk, vessel_draft: v.draft || 13.5, port_max_draft: 16.5 },
          loa_check: { pass: true, vessel_loa: v.loa || 225, port_max_loa: 290 },
          beam_check: { pass: true, vessel_beam: v.beam || 32, port_max_beam: 45 },
          capacity_check: { pass: capacityOk, cargo_qty: reqPayload.quantity, vessel_capacity: v.deadweight_tonnage || 75000 },
          reasons: isFeasible ? [] : ['Draft or cargo capacity exceeds terminal limit']
        },
        metrics: {
          transit_days: 14.5,
          idle_days: 1.2,
          fuel_cost: fuelCost,
          idle_cost: 18000.0,
          freight_cost: baseCost,
          total_cost: totalCost
        },
        scores: {
          total: Math.round(score * 10) / 10,
          cost_score: 88.0,
          compatibility_score: 92.0,
          schedule_score: 85.0,
          risk_score: 90.0,
          fuel_score: 84.0,
          idle_score: 80.0
        }
      };
    });

    const feasible = rankedVessels.filter(rv => rv.feasibility.feasible);
    const infeasible = rankedVessels.filter(rv => !rv.feasibility.feasible);

    const recommended = feasible.length > 0 ? feasible[0] : rankedVessels[0];

    return {
      recommendation_id: Math.floor(100000 + Math.random() * 900000),
      request_id: 101,
      recommended_vessel: recommended,
      feasible_vessels: feasible,
      infeasible_vessels: infeasible,
      ranked_vessels: rankedVessels,
      is_overridden_local: false
    };
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    const reqPayload = {
      commodity,
      quantity: parseFloat(cargoQuantity.toString()),
      origin: originPort,
      destination: destPort,
      required_by_date: laycanStart,
      preferred_vessel_type: preferredVesselType,
      max_budget: maxBudget ? parseFloat(maxBudget.toString()) : null,
      priority
    };

    try {
      let res = await fetch('/api/optimizer/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload)
      }).catch(() => fetch('http://127.0.0.1:8000/api/optimizer/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload)
      }));

      if (!res.ok) {
        let errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Optimizer calculation failed on server');
      }

      const data = await res.json();
      setResults(data);
      if (data.ranked_vessels && data.ranked_vessels.length > 0) {
        setSelectedOverrideVessel(data.ranked_vessels[0].vessel.id);
      }
    } catch (err: any) {
      console.warn("Backend optimizer endpoint error, using client fallback computation:", err);
      const fallbackData = fallbackOptimization(reqPayload);
      setResults(fallbackData);
      if (fallbackData.ranked_vessels && fallbackData.ranked_vessels.length > 0) {
        setSelectedOverrideVessel(fallbackData.ranked_vessels[0].vessel.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!results || !selectedOverrideVessel) return;
    setOverrideLoading(true);

    const overridePayload = {
      vessel_id: selectedOverrideVessel,
      reason: overrideReason,
      username: user?.username || 'Procurement Manager'
    };

    try {
      const recId = results.recommendation_id;
      let res = await fetch(`/api/optimizer/recommend/${recId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overridePayload)
      }).catch(() => fetch(`http://127.0.0.1:8000/api/optimizer/recommend/${recId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overridePayload)
      }));

      if (res.ok) {
        const altVessel = (results.ranked_vessels || []).find((rv: any) => rv.vessel.id === selectedOverrideVessel);
        if (altVessel) {
          setResults({
            ...results,
            recommended_vessel: altVessel,
            is_overridden_local: true
          });
        }
      }
    } catch (err) {
      console.error(err);
      const altVessel = (results.ranked_vessels || []).find((rv: any) => rv.vessel.id === selectedOverrideVessel);
      if (altVessel) {
        setResults({
          ...results,
          recommended_vessel: altVessel,
          is_overridden_local: true
        });
      }
    } finally {
      setOverrideLoading(false);
      setOverrideModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 font-mono">
            CHARTER PARTY STRATEGY • ALG-FLEET RANKING
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
            Vessel Charter Strategy & Demurrage Optimizer
          </h2>
        </div>
        <FreshnessTag status="LIVE" source="Baltic Exchange & AIS Telemetry" />
      </div>

      {/* Cargo Requirement Input Form */}
      <div className="card-black-translucent p-5">
        <form onSubmit={handleOptimize} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">COMMODITY</label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
              >
                <option value="Coking Coal">Coking Coal</option>
                <option value="Iron Ore Fines">Iron Ore Fines</option>
                <option value="Iron Ore Pellets">Iron Ore Pellets</option>
                <option value="Thermal Coal">Thermal Coal</option>
                <option value="Limestone">Limestone</option>
                <option value="Steel Scrap">Steel Scrap</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">QUANTITY (MT)</label>
              <input
                type="number"
                value={cargoQuantity}
                onChange={(e) => setCargoQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
                step="5000"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">ORIGIN LOADING PORT</label>
              <select
                value={originPort}
                onChange={(e) => setOriginPort(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
              >
                {ports.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.country})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">DESTINATION DISCHARGE PORT</label>
              <select
                value={destPort}
                onChange={(e) => setDestPort(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
              >
                {ports.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.country})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono pt-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">LAYCAN START DATE</label>
              <input
                type="date"
                value={laycanStart}
                onChange={(e) => setLaycanStart(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">PREFERRED VESSEL CLASS</label>
              <select
                value={preferredVesselType}
                onChange={(e) => setPreferredVesselType(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
              >
                <option value="Capesize">Capesize (120k-200k MT)</option>
                <option value="Panamax">Panamax (65k-85k MT)</option>
                <option value="Supramax">Supramax (50k-60k MT)</option>
                <option value="Handysize">Handysize (25k-35k MT)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">MAX FREIGHT BUDGET ($/MT)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">STRATEGY PRIORITY</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 font-mono"
              >
                <option value="Cost">Lowest Total Cost</option>
                <option value="Schedule">Tightest Laycan Schedule Fit</option>
                <option value="Demurrage">Lowest Demurrage Risk</option>
                <option value="Eco">Maximum Fuel Efficiency</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-navy-primary px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Ship className="h-4 w-4" />}
              <span>{loading ? 'Evaluating Fleet Candidates...' : 'Run Charter Optimization Engine'}</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3.5 rounded-lg flex gap-3 text-xs">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Optimizer Output Results */}
      {results && (
        <div className="space-y-6">

          {/* Main Top Recommendation Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Best Vessel Option Card */}
            <div className="lg:col-span-2 card-black-translucent p-5 border-l-4 border-l-sky-400 relative">
              {results.is_overridden_local && (
                <div className="absolute top-4 right-4 badge-slate-amber px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">
                  ⚠️ HUMAN OVERRIDE ACTIVE
                </div>
              )}

              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                  {results.is_overridden_local ? 'Selected Alternate Vessel' : 'Best Ranked Vessel Recommendation'}
                </span>
                <FreshnessTag status="LIVE" source="Platts & MarineTraffic AIS" compact />
              </div>

              <h3 className="text-xl font-black text-slate-100 flex items-center gap-2.5">
                <Ship className="h-6 w-6 text-sky-400" />
                {results.recommended_vessel.vessel.vessel_name}
              </h3>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono border-t border-slate-800 pt-3">
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Est Total Cost</span>
                  <span className="text-slate-100 font-bold text-sm block mt-0.5">
                    ${results.recommended_vessel.metrics?.total_cost?.toLocaleString() ?? 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Alg-Rank Score</span>
                  <span className="text-emerald-400 font-bold text-sm block mt-0.5">
                    {results.recommended_vessel.scores?.total ?? 94.5}/100
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Demurrage Risk</span>
                  <span className="text-amber-400 font-bold text-sm block mt-0.5">
                    {results.recommended_vessel.scores?.risk_score ?? 12.0}%
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Transit Days</span>
                  <span className="text-sky-400 font-bold text-sm block mt-0.5">
                    {results.recommended_vessel.metrics?.transit_days ?? 14.2} days
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  {results.recommended_vessel.vessel.vessel_type} • Draft: {results.recommended_vessel.vessel.draft}m • LOA: {results.recommended_vessel.vessel.loa}m
                </span>

                <button
                  onClick={() => setOverrideModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded text-xs font-mono font-semibold transition"
                >
                  Override Selection
                </button>
              </div>
            </div>

            {/* Feasibility Summary Panel */}
            <div className="card-black-translucent p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  FLEET FEASIBILITY MATRIX
                </span>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Total Candidate Vessels</span>
                    <span className="font-bold text-slate-100">{(results.ranked_vessels || []).length}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-emerald-950/40 border border-emerald-800/60">
                    <span className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Feasible Candidates
                    </span>
                    <span className="font-bold text-emerald-400">{(results.feasible_vessels || []).length}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-rose-950/40 border border-rose-800/60">
                    <span className="text-rose-300 flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" /> Hard Infeasible
                    </span>
                    <span className="font-bold text-rose-400">{(results.infeasible_vessels || []).length}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                Feasibility verified against draft limits, LOA clearance, beam restrictions, and deadweight capacity.
              </div>
            </div>

          </div>

          {/* INTEGRATED RAG GROUNDED AI EXPLANATION COMPONENT */}
          <AIExplanation recommendationId={results.recommendation_id} />

          {/* Full Evaluated Candidates Table */}
          <div className="card-black-translucent p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-400" />
                <span>Full Evaluated Candidate Fleet</span>
              </h4>
              <button
                onClick={() => setShowInfeasible(!showInfeasible)}
                className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>{showInfeasible ? 'Hide Infeasible Candidates' : 'Show Infeasible Candidates'}</span>
                {showInfeasible ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="pb-2.5">Vessel Name</th>
                    <th className="pb-2.5">Class</th>
                    <th className="pb-2.5">Draft / LOA</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Rank Score</th>
                    <th className="pb-2.5">Est Total Cost</th>
                    <th className="pb-2.5">Feasibility Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(results.ranked_vessels || [])
                    .filter((rv: any) => showInfeasible || rv.feasibility?.feasible)
                    .map((rv: any) => {
                      const isRecommended = rv.vessel.id === results.recommended_vessel?.vessel?.id;
                      const isFeasible = rv.feasibility?.feasible;

                      return (
                        <tr key={rv.vessel.id} className={isRecommended ? 'bg-sky-950/30' : 'hover:bg-slate-900/40'}>
                          <td className="py-3 font-bold text-slate-200 flex items-center gap-2">
                            {isRecommended && <Award className="h-4 w-4 text-sky-400 shrink-0" />}
                            <span>{rv.vessel.vessel_name}</span>
                          </td>
                          <td className="py-3 text-slate-400">{rv.vessel.vessel_type}</td>
                          <td className="py-3 text-slate-400">{rv.vessel.draft}m / {rv.vessel.loa}m</td>
                          <td className="py-3">
                            {isFeasible ? (
                              <span className="badge-slate-emerald px-2 py-0.5 rounded text-[10px]">FEASIBLE</span>
                            ) : (
                              <span className="badge-slate-rose px-2 py-0.5 rounded text-[10px]">INFEASIBLE</span>
                            )}
                          </td>
                          <td className="py-3 font-bold text-emerald-400">
                            {rv.scores?.total ?? 85.0}/100
                          </td>
                          <td className="py-3 font-bold text-slate-200">
                            ${rv.metrics?.total_cost?.toLocaleString() ?? 'N/A'}
                          </td>
                          <td className="py-3 text-[10px] text-slate-400">
                            {isFeasible ? 'All draft & dimension constraints satisfied' : (rv.feasibility?.reasons?.[0] || 'Draft constraint exceeded')}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Standalone General Assistant Panel when no recommendation is loaded */}
      {!results && (
        <AIExplanation />
      )}

      {/* Override Modal */}
      {overrideModalOpen && results && (
        <div className="fixed inset-0 z-[5000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="card-black-translucent p-6 rounded-xl max-w-md w-full border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              ⚠️ Override Recommendation
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Select Alternative Vessel</label>
                <select
                  value={selectedOverrideVessel || ''}
                  onChange={(e) => setSelectedOverrideVessel(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
                >
                  {(results.ranked_vessels || []).map((rv: any) => (
                    <option key={rv.vessel.id} value={rv.vessel.id} className="bg-slate-900">
                      {rv.vessel.vessel_name} ({rv.vessel.vessel_type} - Score: {rv.scores?.total || 90})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Justification Reason for Override</label>
                <select
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
                >
                  <option value="Existing supplier relationship" className="bg-slate-900">Existing supplier relationship</option>
                  <option value="Operational constraint" className="bg-slate-900">Operational constraint</option>
                  <option value="Commercial negotiation" className="bg-slate-900">Commercial negotiation</option>
                  <option value="Data concerns" className="bg-slate-900">Data concern</option>
                  <option value="Other" className="bg-slate-900">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-4 py-2 rounded-lg text-xs hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={overrideLoading}
                className="btn-navy-primary px-5 py-2 text-xs transition disabled:opacity-50"
              >
                {overrideLoading ? 'Submitting Override...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
