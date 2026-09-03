import React, { useEffect, useState } from 'react';
import { Ship, AlertTriangle, TrendingUp, TrendingDown, Clock, ShieldAlert, Award, Compass, RefreshCw } from 'lucide-react';
import PortMap from '../components/PortMap';

import FreshnessTag from '../components/FreshnessTag';

interface Alert {
  id: string;
  title: string;
  type: string;
  message: string;
  timestamp: string;
}

interface DashboardData {
  last_updated: string;
  current_freight_index: number;
  forecasted_30d_index: number;
  index_change_pct: number;
  market_risk_label: string;
  market_risk_score: number;
  average_port_congestion: number;
  alerts: Alert[];
}

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

interface Recommendation {
  id: number;
  cargo_request_id: number;
  vessel_id: number;
  charter_window_start: string;
  charter_window_end: string;
  recommendation_score: number;
  estimated_cost: number;
  risk_score: number;
  idle_cost: number;
  feasibility_status: string;
  explanation: string;
  created_at: string;
  is_overridden: number;
  override_vessel_id?: number;
  override_reason: string;
  override_by: string;
}

interface DashboardProps {
  ports: Port[];
  vessels: Vessel[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ ports, vessels, onNavigate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/summary');
      const d = await res.json();
      setData(d);

      const resRecs = await fetch('/api/recommendations');
      const r = await resRecs.json();
      setRecs(r.slice(0, 5)); // show latest 5
    } catch (e) {
      console.error("Error loading dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading FreightSense intelligence control tower...</p>
        </div>
      </div>
    );
  }

  const isUp = data.index_change_pct >= 0;

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Freight Intelligence & Control Tower</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time decision support for vessel chartering and bulk raw material procurement.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">SYSTEM STATUS</span>
            <span className="text-xs text-slate-400 block">{data.last_updated}</span>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition active:scale-95"
            title="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Current Rate */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Ship className="h-20 w-20 text-slate-100" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Benchmark Rate Index</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">${data.current_freight_index.toFixed(2)}</span>
            <span className="text-xs text-slate-400">/ MT</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1">Newcastle to Visakhapatnam Panamax</span>
        </div>

        {/* KPI 2: 30-Day Forecast */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">30-Day Forecast Index</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">${data.forecasted_30d_index.toFixed(2)}</span>
            <span className="text-xs text-slate-400">/ MT</span>
          </div>
          <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isUp ? '+' : ''}{data.index_change_pct.toFixed(1)}% expected change</span>
          </div>
        </div>

        {/* KPI 3: Market Risk */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">SAIL Logistics Risk Index</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${
              data.market_risk_label === 'HIGH' ? 'text-red-400' : 
              data.market_risk_label === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {data.market_risk_label}
            </span>
            <span className="text-xs text-slate-400">({data.market_risk_score.toFixed(0)}/100)</span>
          </div>
          <div className="mt-3 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${
                data.market_risk_label === 'HIGH' ? 'bg-red-500' : 
                data.market_risk_label === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${data.market_risk_score}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Port Congestion */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Avg Port Congestion</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{data.average_port_congestion.toFixed(1)}%</span>
            <span className="text-xs text-slate-400">queue score</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1">Across 6 East Coast Indian ports</span>
        </div>
      </div>

      {/* Main Map + Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Port Map (Left, 2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-400" />
              <h2 className="font-bold text-base">Port Network & Route Map</h2>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              Interactive Leaflet Projection
            </span>
          </div>
          <div className="h-[400px] rounded-xl overflow-hidden border border-slate-900">
            <PortMap ports={ports} vessels={vessels} />
          </div>
        </div>

        {/* System Alerts panel (Right, 1 col) */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-900 pb-3">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <h2 className="font-bold text-base">Active Logistical Alerts</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[360px]">
            {data.alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3.5 rounded-xl border flex gap-3 ${
                  alert.type === 'critical' ? 'bg-red-950/20 border-red-500/20 text-red-100' :
                  alert.type === 'warning' ? 'bg-amber-950/20 border-amber-500/20 text-amber-100' :
                  'bg-blue-950/20 border-blue-500/20 text-blue-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {alert.type === 'critical' ? (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 pulse-glow" />
                  ) : alert.type === 'warning' ? (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                  ) : (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{alert.title}</span>
                    <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs leading-normal text-slate-300">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exogenous Market Signals */}
      <div className="glass-panel p-5 rounded-2xl">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Exogenous Market Signal Dashboard
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bunker Fuel (380 CST)</span>
            <span className="text-xl font-extrabold block mt-1 text-slate-100">$612.40 / T</span>
            <span className="text-[10px] text-emerald-400 block mt-1">✓ Stability Index Stable</span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">FX Exchange Rate</span>
            <span className="text-xl font-extrabold block mt-1 text-slate-100">83.42 INR/USD</span>
            <span className="text-[10px] text-amber-400 block mt-1">⚠ Slight depreciation (INR)</span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Global Bulk Steel Demand</span>
            <span className="text-xl font-extrabold block mt-1 text-slate-100">108.5 pts</span>
            <span className="text-[10px] text-emerald-400 block mt-1">✓ Heavy Q3 industry pull</span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">BDI Dry Index equivalent</span>
            <span className="text-xl font-extrabold block mt-1 text-slate-100">1,842 pts</span>
            <span className="text-[10px] text-rose-400 block mt-1">⚠ 30-day volatility up 4.2%</span>
          </div>
        </div>
      </div>

      {/* Recent Recommendations & Overrides */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" />
            Recent AI Charter Optimization Runs
          </h2>
          <button 
            onClick={() => onNavigate('optimizer')} 
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            New Optimization Run &rarr;
          </button>
        </div>

        {recs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No optimization recommendations found. Go to the "Vessel Optimizer" to generate one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-2">Recommendation ID</th>
                  <th className="py-3 px-2">Created Timestamp</th>
                  <th className="py-3 px-2">Recommended Vessel</th>
                  <th className="py-3 px-2">Charter Window</th>
                  <th className="py-3 px-2">Estimated Cost</th>
                  <th className="py-3 px-2">Risk Score</th>
                  <th className="py-3 px-2">Score</th>
                  <th className="py-3 px-2">Feasibility</th>
                  <th className="py-3 px-2">Override Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {recs.map((r) => {
                  const matchingVessel = vessels.find(v => v.id === r.vessel_id);
                  const overrideVessel = r.is_overridden ? vessels.find(v => v.id === r.override_vessel_id) : null;
                  
                  return (
                    <tr key={r.id} className="hover:bg-slate-900/30 transition">
                      <td className="py-3 px-2 font-mono text-slate-300">#REC-{r.id.toString().padStart(4, '0')}</td>
                      <td className="py-3 px-2 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="py-3 px-2 font-medium text-slate-200">
                        {matchingVessel ? matchingVessel.vessel_name : 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-slate-300">
                        {new Date(r.charter_window_start).toLocaleDateString()} - {new Date(r.charter_window_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-300">${r.estimated_cost.toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          r.risk_score > 60 ? 'bg-red-950 text-red-400 border border-red-900' :
                          r.risk_score > 40 ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                          'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        }`}>
                          {r.risk_score.toFixed(0)}/100
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-slate-100">{r.recommendation_score.toFixed(1)}</td>
                      <td className="py-3 px-2 text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
                        ✓ {r.feasibility_status}
                      </td>
                      <td className="py-3 px-2">
                        {r.is_overridden ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded w-max">
                              ⚠️ OVERRIDE
                            </span>
                            <span className="text-[9px] text-slate-500">To: {overrideVessel?.vessel_name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                            Standard AI Recommend
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
