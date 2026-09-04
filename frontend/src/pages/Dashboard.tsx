import React, { useEffect, useState } from 'react';
import { Ship, AlertTriangle, TrendingUp, TrendingDown, Clock, ShieldAlert, Award, Compass, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import PortMap from '../components/PortMap';
import Globe3D, { GlobalLocationNode } from '../components/Globe3D';
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
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/summary');
      const d = await res.json();
      setData(d);

      const resRecs = await fetch('/api/recommendations');
      const r = await resRecs.json();
      setRecs(r.slice(0, 5));
    } catch (e) {
      console.error("Error loading dashboard metrics", e);
    } flex: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="card-slate-navy p-8 flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-xs font-mono font-bold text-slate-300">Loading SAIL Command Center Telemetry...</p>
        </div>
      </div>
    );
  }

  const rateIndex = data?.current_freight_index ?? 34.80;
  const forecastIndex = data?.forecasted_30d_index ?? 34.44;
  const indexChange = data?.index_change_pct ?? -1.0;
  const riskScore = data?.market_risk_score ?? 42;
  const portCongestion = data?.average_port_congestion ?? 29.4;

  return (
    <div className="space-y-6 font-sans">

      {/* Top 4 KPI Metrics Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: BENCHMARK RATE INDEX */}
        <div className="card-slate-navy card-slate-navy-hover p-5 relative">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">BENCHMARK RATE INDEX</span>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-3xl font-black text-slate-50">${rateIndex.toFixed(2)}</span>
            <span className="text-xs font-bold text-slate-400">$/MT</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              ▲ 3.2% <span className="text-slate-400 font-normal">vs last week</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium truncate">Newcastle &rarr; Visakhapatnam • Panamax</span>
        </div>

        {/* KPI 2: 30-DAY FORECAST */}
        <div className="card-slate-navy card-slate-navy-hover p-5 relative">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">30-DAY RATE FORECAST</span>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-3xl font-black text-slate-50">${forecastIndex.toFixed(2)}</span>
            <span className="text-xs font-bold text-slate-400">$/MT</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ▼ {Math.abs(indexChange).toFixed(1)}% <span className="text-slate-400 font-normal">expected</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium truncate">Quantitative Model • 94% confidence</span>
        </div>

        {/* KPI 3: LOGISTICS RISK SCORE */}
        <div className="card-slate-navy card-slate-navy-hover p-5 relative">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">LOGISTICS RISK INDEX</span>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-3xl font-black text-slate-50">{riskScore.toFixed(0)}</span>
            <span className="text-xs font-bold text-slate-400">/100</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-200 font-bold">Moderate exposure</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium truncate">Composite • 12 live telemetry signals</span>
        </div>

        {/* KPI 4: AVG PORT CONGESTION */}
        <div className="card-slate-navy card-slate-navy-hover p-5 relative">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">EAST COAST PORT CONGESTION</span>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-3xl font-black text-slate-50">{portCongestion.toFixed(1)}%</span>
            <span className="text-xs font-bold text-slate-400">queue</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono">
            <span className="text-amber-400 font-bold">▲ 8.1 pts</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium truncate">6 East Coast Indian Discharge Ports</span>
        </div>

      </div>

      {/* Main Grid: 3D Command Globe Hero + Active Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 3D Command Globe Canvas Box */}
        <div className="lg:col-span-2 card-slate-navy p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-tight">
                SAIL Global Trade Maritime Projection
              </h2>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                <span className="text-emerald-400 font-bold">LIVE TELEMETRY</span>
                <span>• 15 GLOBAL NATIONS</span>
                <span>• 6 CORRIDORS</span>
              </div>
            </div>

            {/* Toggle Button */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
              <button
                onClick={() => setViewMode('3D')}
                className={`px-3 py-1 rounded-md transition font-bold ${
                  viewMode === '3D' ? 'bg-navy-900 text-sky-400 border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3D Command Globe
              </button>
              <button
                onClick={() => setViewMode('2D')}
                className={`px-3 py-1 rounded-md transition font-bold ${
                  viewMode === '2D' ? 'bg-navy-900 text-sky-400 border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lane Table
              </button>
            </div>
          </div>

          <div className="h-[430px] rounded-lg overflow-hidden border border-slate-800 relative">
            {viewMode === '3D' ? (
              <Globe3D onSelectNode={(node) => console.log('Node selected:', node.name, node.country)} />
            ) : (
              <PortMap ports={ports} vessels={vessels} />
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-3">
            <span>CLICK ANY COUNTRY OR PORT NODE TO INSPECT LIVE MARITIME METRICS</span>
            <span>Verified • 12:00 IST sync</span>
          </div>
        </div>

        {/* Active Logistical Alerts Card */}
        <div className="card-slate-navy p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-tight">
                Active Logistical Alerts
              </h2>
              <span className="text-[10px] font-mono text-slate-400">3 open</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Paradip congestion at 54%</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-normal">Just now</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-4">
                  Berth 3 nearing capacity; two Panamax vessels queued for discharge slot.
                </p>
                <span className="text-[10px] font-mono text-slate-500 block pl-4">Port API • Ref 8834</span>
              </div>

              <div className="space-y-1 pb-3 border-b border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Krishnapatnam dredging window</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-normal">42m</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-4">
                  Routine dredging near channel entrance; minimal impact on laden departures.
                </p>
                <span className="text-[10px] font-mono text-slate-500 block pl-4">IWAI advisory • Ref 2290</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>Baltic Dry above tolerance band</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-normal">2h</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-4">
                  Index +6.8% against a 5% threshold; review open contract book before fixture.
                </p>
                <span className="text-[10px] font-mono text-slate-500 block pl-4">FreightRateFeed • Ref 4471</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Escalation policy: SAIL Enterprise Desk • Ministry of Steel
          </div>
        </div>

      </div>

      {/* Charter Book • Next Departures Table */}
      <div className="card-slate-navy p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-tight">
              Charter Book • Vessel Fixture Schedule
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Active fixtures for SAIL raw material import corridors</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500">Source: Baltic Exchange • CCRIS</span>
            <button 
              onClick={() => onNavigate('optimizer')}
              className="btn-navy-primary px-3.5 py-1.5 text-xs font-semibold"
            >
              Open Optimizer &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px] bg-slate-950/60">
                <th className="py-3 px-3">TRADE CORRIDOR</th>
                <th className="py-3 px-3">VESSEL</th>
                <th className="py-3 px-3">CARGO SPECIFICATION</th>
                <th className="py-3 px-3">ETA</th>
                <th className="py-3 px-3">RATE ($/MT)</th>
                <th className="py-3 px-3">RISK</th>
                <th className="py-3 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {vessels.slice(0, 5).map((v, idx) => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-sky-400">
                    {idx % 2 === 0 ? 'Newcastle → Visakhapatnam' : 'Richards Bay → Paradip'}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-100 flex items-center gap-2">
                    <Ship className="h-3.5 w-3.5 text-slate-400" />
                    {v.vessel_name}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {idx % 2 === 0 ? 'Coking Coal (75,000 MT)' : 'Thermal Coal (65,000 MT)'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    Sep {12 + idx}, 2026
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-100">
                    ${(32.50 + idx * 1.40).toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      idx === 1 ? 'badge-slate-amber' : 'badge-slate-emerald'
                    }`}>
                      {idx === 1 ? 'MODERATE' : 'LOW'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="badge-slate-blue font-mono font-bold text-[10px] uppercase">
                      ● IN TRANSIT
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
