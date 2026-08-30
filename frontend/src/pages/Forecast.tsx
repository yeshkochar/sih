import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Ship, Calendar, RefreshCw, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForecastProps {
  ports: any[];
}

export default function Forecast({ ports }: ForecastProps) {
  // Input states
  const [origin, setOrigin] = useState('Newcastle');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [commodity, setCommodity] = useState('Coking Coal');
  const [vesselType, setVesselType] = useState('Panamax');
  const [horizon, setHorizon] = useState<30 | 90>(90);

  // Output states
  const [history, setHistory] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [bestModel, setBestModel] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown lists
  const origins = ['Newcastle', 'Richards Bay', 'Dampier', 'Vancouver'];
  const destinations = ['Visakhapatnam', 'Paradip', 'Gangavaram', 'Kakinada', 'Chennai', 'Krishnapatnam'];
  const commodities = ['Coking Coal', 'Thermal Coal', 'Iron Ore', 'Metallurgical Coal'];
  const vesselTypes = ['Handysize', 'Handymax', 'Supramax', 'Panamax', 'Kamsarmax'];

  const handleGenerateForecast = async () => {
    setLoading(true);
    setError('');
    setForecast([]);
    setHistory([]);
    setMetrics(null);

    try {
      // 1. Fetch History
      const histRes = await fetch(`/api/freight/history?origin=${origin}&destination=${destination}&vessel_type=${vesselType}&commodity=${commodity}`);
      if (!histRes.ok) throw new Error('Failed to load rate history');
      const histData = await histRes.json();
      
      // 2. Fetch Forecast
      const foreRes = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, vessel_type: vesselType, commodity })
      });
      if (!foreRes.ok) {
        const errJson = await foreRes.json();
        throw new Error(errJson.detail || 'Failed to generate forecast model');
      }
      
      const foreData = await foreRes.json();
      
      // Format history for chart (e.g. last 24 weeks for context)
      const formattedHistory = histData.slice(-24).map((h: any) => ({
        dateStr: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rate: h.freight_rate,
        type: 'Historical'
      }));

      // Format forecast
      const formattedForecast = foreData.forecast.map((f: any) => ({
        dateStr: new Date(f.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        forecastRate: f.predicted_rate,
        upperBound: f.upper_bound,
        lowerBound: f.lower_bound,
        horizon: f.horizon_days,
        type: 'Forecast'
      }));

      setHistory(formattedHistory);
      setForecast(formattedForecast);
      setMetrics(foreData.metrics);
      setBestModel(foreData.best_model);
      setConfidence(foreData.confidence_score);
    } catch (e: any) {
      setError(e.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  // Combine history and forecast for chart rendering
  const chartData = [
    ...history.map(h => ({
      name: h.dateStr,
      'Historical Rate': h.rate,
      'Forecasted Rate': null,
      'Upper Bound': null,
      'Lower Bound': null
    })),
    // Link history to forecast by replicating last historical point
    ...(history.length > 0 && forecast.length > 0 ? [{
      name: history[history.length - 1].dateStr,
      'Historical Rate': history[history.length - 1].rate,
      'Forecasted Rate': history[history.length - 1].rate,
      'Upper Bound': history[history.length - 1].rate,
      'Lower Bound': history[history.length - 1].rate
    }] : []),
    ...forecast
      .filter(f => f.horizon <= horizon)
      .map(f => ({
        name: f.dateStr,
        'Historical Rate': null,
        'Forecasted Rate': f.forecastRate,
        'Upper Bound': f.upperBound,
        'Lower Bound': f.lowerBound
      }))
  ];

  // Calculation metrics
  const lastHistRate = history.length > 0 ? history[history.length - 1].rate : null;
  const targetForecastPoint = forecast.length > 0 ? (horizon === 30 ? forecast[3] : forecast[forecast.length - 1]) : null;
  const forecastedRate = targetForecastPoint ? targetForecastPoint.forecastRate : null;
  const expectedChange = lastHistRate && forecastedRate ? ((forecastedRate - lastHistRate) / lastHistRate) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Advanced Freight Rate Forecasting</h1>
        <p className="text-sm text-slate-400 mt-1">
          Predict future shipping costs, benchmark models, and evaluate predictive confidence bounds chronologically.
        </p>
      </div>

      {/* Input Form Panel */}
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Ship className="h-4 w-4 text-blue-400" />
          Route & Commodity Parameters
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Commodity Class</label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vessel Category</label>
            <select
              value={vesselType}
              onChange={(e) => setVesselType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
            >
              {vesselTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-900 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Horizon Focus:</span>
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setHorizon(30)}
                className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition ${
                  horizon === 30 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setHorizon(90)}
                className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition ${
                  horizon === 90 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerateForecast}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl text-xs active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
            Generate Forecast
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-200 p-4 rounded-2xl flex gap-3 text-xs">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Results Panel */}
      {forecast.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Panel (Left, 2 cols) */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Historical vs Forecast Projection</h3>
              <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                Model: <span className="text-blue-400">{bestModel}</span>
              </span>
            </div>

            <div className="h-[320px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    labelStyle={{ fontWeight: 'bold', color: '#3b82f6' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="Historical Rate" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Forecasted Rate" 
                    stroke="#eab308" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5" 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Upper Bound" 
                    stroke="#ef4444" 
                    strokeWidth={1} 
                    strokeDasharray="3 3" 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Lower Bound" 
                    stroke="#10b981" 
                    strokeWidth={1} 
                    strokeDasharray="3 3" 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[10px] text-slate-500 italic mt-3 text-center">
              Dotted lines represent the 95% confidence intervals based on backtesting residuals.
            </p>
          </div>

          {/* Quick Metrics & Info panel (Right, 1 col) */}
          <div className="space-y-6">
            {/* KPI details */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2">
                Forecast Summary
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-medium block">Current Spot Rate</span>
                  <span className="text-lg font-bold block mt-1">${lastHistRate ? lastHistRate.toFixed(2) : '--'}</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-medium block">{horizon}-Day Prediction</span>
                  <span className="text-lg font-bold block mt-1">${forecastedRate ? forecastedRate.toFixed(2) : '--'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-medium block">Expected Delta</span>
                  <span className={`text-base font-bold block mt-1 ${expectedChange && expectedChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {expectedChange ? (expectedChange >= 0 ? '+' : '') + expectedChange.toFixed(1) + '%' : '--'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-medium block">Confidence Index</span>
                  <span className="text-base font-bold text-blue-400 block mt-1">{confidence}%</span>
                </div>
              </div>
            </div>

            {/* Model Evaluation comparison */}
            {metrics && (
              <div className="glass-panel p-5 rounded-2xl flex flex-col">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 mb-3 flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4 text-blue-400" />
                  Chronological Evaluation Metrics
                </h3>
                
                <div className="space-y-2.5">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="pb-1.5">Model</th>
                        <th className="pb-1.5">MAE</th>
                        <th className="pb-1.5">RMSE</th>
                        <th className="pb-1.5">MAPE (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {Object.keys(metrics).map((modelName) => (
                        <tr 
                          key={modelName} 
                          className={`hover:bg-slate-900/20 ${modelName === bestModel ? 'text-blue-400 font-semibold' : 'text-slate-400'}`}
                        >
                          <td className="py-2 flex items-center gap-1">
                            {modelName === bestModel && <CheckCircle2 className="h-3 w-3 text-blue-400" />}
                            {modelName}
                          </td>
                          <td className="py-2 font-mono">${metrics[modelName].MAE.toFixed(2)}</td>
                          <td className="py-2 font-mono">${metrics[modelName].RMSE.toFixed(2)}</td>
                          <td className="py-2 font-mono">{metrics[modelName].MAPE.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="text-[9px] text-slate-500 bg-slate-900/40 p-2 rounded border border-slate-900 leading-normal">
                    💡 **Data Science Principle**: Models are evaluated chronologically on a held-out test block representing the last 20% of history to prevent temporal lookahead leakage.
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
