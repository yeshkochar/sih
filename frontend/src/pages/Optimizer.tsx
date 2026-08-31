import React, { useState } from 'react';
import { Ship, Calendar, ShieldAlert, Award, FileText, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';

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
  // Inputs
  const [commodity, setCommodity] = useState('Coking Coal');
  const [quantity, setQuantity] = useState(75000);
  const [origin, setOrigin] = useState('Newcastle');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [requiredDate, setRequiredDate] = useState('2026-09-25');
  const [budget, setBudget] = useState(38.0);
  const [prefVessel, setPrefVessel] = useState('Panamax');

  // Outputs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any | null>(null);

  // UI state
  const [expandedVesselId, setExpandedVesselId] = useState<number | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedOverrideVessel, setSelectedOverrideVessel] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('Existing supplier relationship');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const origins = ['Newcastle', 'Richards Bay', 'Dampier', 'Vancouver'];
  const destinations = ['Visakhapatnam', 'Paradip', 'Gangavaram', 'Kakinada', 'Chennai', 'Krishnapatnam'];
  const commodities = ['Coking Coal', 'Thermal Coal', 'Iron Ore', 'Metallurgical Coal'];
  const vesselTypes = ['Handysize', 'Handymax', 'Supramax', 'Panamax', 'Kamsarmax'];

  const handleOptimize = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/optimizer/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity,
          quantity: Float64Array ? parseFloat(quantity.toString()) : quantity,
          origin,
          destination,
          required_by_date: requiredDate,
          preferred_vessel_type: prefVessel,
          max_budget: budget,
          priority: 'High'
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Optimizer calculation failed');
      }

      const data = await res.json();
      setResults(data);
    } catch (e: any) {
      setError(e.message || 'Error executing optimizer');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!results || !selectedOverrideVessel) return;
    setOverrideLoading(true);

    try {
      const res = await fetch(`/api/optimizer/recommend/${results.recommendation_id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vessel_id: selectedOverrideVessel,
          reason: overrideReason,
          username: user?.username || 'Procurement Manager'
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Override submission failed');
      }

      // Re-fetch rankings or mark overridden locally
      const updatedResults = { ...results };
      updatedResults.recommended_vessel = results.ranked_vessels.find((rv: any) => rv.vessel.id === selectedOverrideVessel);
      updatedResults.is_overridden_local = true;
      updatedResults.override_reason_local = overrideReason;
      setResults(updatedResults);
      setOverrideModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Charter Vessel Optimization Workspace</h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform port limit feasibility checks, score vessel classes, determine procurement windows, and log human overrides.
        </p>
      </div>

      {/* Constraints Input Form */}
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          Logistics Requirement Specification
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Commodity Type</label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Cargo Volume (MT)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Origin Port</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {origins.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Destination Port</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {destinations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Required Delivery Date</label>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Max Budget (USD / MT)</label>
            <input
              type="number"
              step="0.1"
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Preferred Vessel Class</label>
            <select
              value={prefVessel}
              onChange={(e) => setPrefVessel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {vesselTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-900 pt-4 flex justify-end">
          <button
            onClick={handleOptimize}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Ship className="h-4 w-4" />}
            Generate Charter Recommendation
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-200 p-4 rounded-2xl flex gap-3 text-xs">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Optimizer Output Results */}
      {results && (
        <div className="space-y-6">

          {/* Main Top Recommendation Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Best Vessel Option Card (2 cols) */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl relative overflow-hidden border-l-4 border-l-indigo-500">
              {results.is_overridden_local && (
                <div className="absolute top-4 right-4 bg-amber-950/60 border border-amber-900 text-amber-400 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                  ⚠️ USER OVERRIDE ACTIVE
                </div>
              )}

              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                {results.is_overridden_local ? 'Selected Alternate Vessel' : 'Best Ranked Vessel Recommendation'}
              </span>

              <h3 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                <Ship className="h-6 w-6 text-indigo-400" />
                {results.recommended_vessel.vessel.vessel_name}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Vessel Class</span>
                  <span className="text-sm font-semibold text-slate-200 block mt-1">{results.recommended_vessel.vessel.vessel_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Optimization Score</span>
                  <span className="text-sm font-bold text-indigo-400 block mt-1">{results.recommended_vessel.scores.total} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Est Voyage Cost</span>
                  <span className="text-sm font-bold text-slate-200 block mt-1">${results.recommended_vessel.metrics.total_cost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Voyage Risk Index</span>
                  <span className={`text-sm font-semibold block mt-1 ${results.recommended_vessel.risk_score > 60 ? 'text-red-400' :
                      results.recommended_vessel.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                    {results.recommended_vessel.risk_score.toFixed(0)}/100
                  </span>
                </div>
              </div>

              {/* Action Buttons for Human-in-the-loop */}
              <div className="mt-6 pt-5 border-t border-slate-900 flex justify-between items-center gap-4">
                <div className="text-[11px] text-slate-400 max-w-md">
                  {results.is_overridden_local ? (
                    <span>Reason: <span className="text-slate-200">"{results.override_reason_local}"</span></span>
                  ) : (
                    <span>Review alternative options below. Procurement manager holds override authority.</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedOverrideVessel(results.ranked_vessels[1]?.vessel?.id || null);
                    setOverrideModalOpen(true);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium px-4 py-2 rounded-xl text-xs transition active:scale-95 shrink-0"
                >
                  Override Recommendation
                </button>
              </div>
            </div>

            {/* AI Charter Decision Options (1 col) */}
            <div className="space-y-4">

              {/* Window Advice */}
              <div className="glass-panel p-5 rounded-2xl relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Recommended Booking Action</span>
                <span className="text-sm font-bold block text-slate-200">{results.charter_window.action}</span>
                <p className="text-[11px] leading-relaxed text-slate-400 mt-2">{results.charter_window.explanation}</p>
                {results.charter_window.expected_savings > 0 && (
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-2 bg-emerald-950/20 border border-emerald-900/40 w-max px-2 py-0.5 rounded">
                    Expected Savings: ${results.charter_window.expected_savings.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Spot vs COA Advice */}
              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Contract Structure Recommendation</span>
                <span className="text-sm font-bold block text-slate-200">{results.spot_vs_multivoyage.recommendation}</span>
                <p className="text-[11px] leading-relaxed text-slate-400 mt-2">{results.spot_vs_multivoyage.explanation}</p>
              </div>

            </div>
          </div>

          {/* Explainable AI Decision Drivers Block */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Why We Recommend This Option (Explainable AI Drivers)
            </h3>
            <ul className="space-y-3">
              {results.explainability_drivers.map((driver: string, index: number) => (
                <li key={index} className="flex gap-3 text-xs leading-relaxed text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Feasible Vessels Ranking Table */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 mb-4">
              Ranked Feasible Vessels Options
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-2">Rank</th>
                    <th className="py-2.5 px-2">Vessel Name</th>
                    <th className="py-2.5 px-2">Class</th>
                    <th className="py-2.5 px-2">Cargo Capacity</th>
                    <th className="py-2.5 px-2">Total Cost</th>
                    <th className="py-2.5 px-2">Risk</th>
                    <th className="py-2.5 px-2">Cost Score</th>
                    <th className="py-2.5 px-2">Compat Score</th>
                    <th className="py-2.5 px-2">Schedule Fit</th>
                    <th className="py-2.5 px-2">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {results.ranked_vessels.map((rv: any, idx: number) => (
                    <tr
                      key={rv.vessel.id}
                      className={`hover:bg-slate-900/30 transition ${(results.is_overridden_local ? rv.vessel.id === selectedOverrideVessel : idx === 0)
                          ? 'bg-indigo-950/20 text-slate-100 font-medium border-l-2 border-l-indigo-500'
                          : 'text-slate-400'
                        }`}
                    >
                      <td className="py-3.5 px-2 font-bold">#{idx + 1}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-200">{rv.vessel.vessel_name}</td>
                      <td className="py-3.5 px-2">{rv.vessel.vessel_type}</td>
                      <td className="py-3.5 px-2">{rv.vessel?.cargo_capacity?.toLocaleString() ?? "N/A"} MT</td>
                      <td className="py-3.5 px-2 font-mono text-slate-200">${rv.metrics?.total_cost?.toLocaleString() ?? "N/A"}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${rv.risk_score > 60 ? 'bg-red-950/60 text-red-400' :
                            rv.risk_score > 40 ? 'bg-amber-950/60 text-amber-400' : 'bg-emerald-950/60 text-emerald-400'
                          }`}>
                          {rv.risk_score.toFixed(0)}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono">{rv.scores.cost}</td>
                      <td className="py-3.5 px-2 font-mono">{rv.scores.compatibility}</td>
                      <td className="py-3.5 px-2 font-mono">{rv.scores.schedule_fit}</td>
                      <td className="py-3.5 px-2 font-mono font-bold text-slate-100">{rv.scores.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejected Infeasible Vessels List */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 mb-4 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-400" />
              Infeasible Rejected Vessels (Physical Constraints Violations)
            </h3>

            {results.infeasible_vessels.length === 0 ? (
              <p className="text-xs text-slate-500">All registered fleet vessels satisfy the destination port constraints.</p>
            ) : (
              <div className="space-y-3">
                {results.infeasible_vessels.map((iv: any) => {
                  const isExpanded = expandedVesselId === iv.vessel.id;

                  return (
                    <div
                      key={iv.vessel.id}
                      className="border border-slate-900 bg-slate-950/40 rounded-xl overflow-hidden"
                    >
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => setExpandedVesselId(isExpanded ? null : iv.vessel.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/10 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <span className="text-xs font-semibold text-slate-300">{iv.vessel.vessel_name}</span>
                          <span className="text-[10px] bg-red-950/60 border border-red-900/40 px-2 py-0.5 rounded text-red-400 w-max uppercase tracking-wider font-bold">
                            ❌ INFEASIBLE
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-900/50 space-y-3.5">
                          {/* Constraint rejections */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rejection Reasons:</span>
                            <ul className="space-y-1.5">
                              {iv.reasons.map((r: string, idx: number) => (
                                <li key={idx} className="text-xs text-red-400 flex items-start gap-2">
                                  <span className="font-bold shrink-0">•</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Detail specs comparison */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 bg-slate-900/40 p-3 rounded-lg border border-slate-900/80 text-[11px]">
                            <div>
                              <span className="text-slate-500 block">LOA</span>
                              <span className={`font-semibold block mt-0.5 ${iv.details.loa.feasible ? 'text-slate-300' : 'text-red-400 font-bold'}`}>
                                {iv.vessel.loa}m / Max {iv.details.loa.port}m
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Beam</span>
                              <span className={`font-semibold block mt-0.5 ${iv.details.beam.feasible ? 'text-slate-300' : 'text-red-400 font-bold'}`}>
                                {iv.vessel.beam}m / Max {iv.details.beam.port}m
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Max Draft</span>
                              <span className={`font-semibold block mt-0.5 ${iv.details.draft.feasible ? 'text-slate-300' : 'text-red-400 font-bold'}`}>
                                {iv.vessel.draft}m / Max {iv.details.draft.port}m
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Capacity Spec</span>
                              <span className={`font-semibold block mt-0.5 ${iv.details.capacity.feasible ? 'text-slate-300' : 'text-red-400 font-bold'}`}>
                                {iv.vessel.cargo_capacity.toLocaleString()} MT
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Status Check</span>
                              <span className={`font-semibold block mt-0.5 ${iv.details.port_status.feasible ? 'text-slate-300' : 'text-red-400 font-bold'}`}>
                                {iv.details.port_status.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Override Modal */}
      {overrideModalOpen && results && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 border border-slate-800">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              ⚠️ Override Recommendation
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Select Alternative Vessel</label>
                <select
                  value={selectedOverrideVessel || ''}
                  onChange={(e) => setSelectedOverrideVessel(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
                >
                  {results.ranked_vessels.map((rv: any) => (
                    <option key={rv.vessel.id} value={rv.vessel.id}>
                      {rv.vessel.vessel_name} ({rv.vessel.vessel_type} - Score: {rv.scores.total})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Justification Reason for Override</label>
                <select
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="Existing supplier relationship">Existing supplier relationship</option>
                  <option value="Operational constraint">Operational constraint</option>
                  <option value="Commercial negotiation">Commercial negotiation</option>
                  <option value="Data concerns">Data concern</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-900 pt-4 mt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="bg-slate-900 border border-slate-800 text-slate-300 font-medium px-4 py-2 rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={overrideLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-xl text-xs transition disabled:opacity-50"
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
