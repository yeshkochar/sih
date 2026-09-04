import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Ship, Calendar, RefreshCw, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForecastProps {
  ports: any[];
}

export default function Forecast({ ports }: ForecastProps) {
  const [origin, setOrigin] = useState('Newcastle');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [commodity, setCommodity] = useState('Coking Coal');
  const [vesselType, setVesselType] = useState('Panamax');
  const [horizon, setHorizon] = useState<30 | 90>(90);

  const [history, setHistory] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [bestModel, setBestModel] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const histRes = await fetch(`/api/freight/history?origin=${origin}&destination=${destination}&vessel_type=${vesselType}&commodity=${commodity}`);
      if (!histRes.ok) throw new Error('Failed to load rate history');
      const histData = await histRes.json();
      
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
      
      const formattedHistory = histData.slice(-24).map((h: any) => ({
        dateStr: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rate: h.freight_rate,
        type: 'Historical'
      }));

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
    } flex: {
      setLoading(false);
    }
  };

  const chartData = [
    ...history.map(h => ({
      name: h.dateStr,
      'Historical Rate': h.rate,
      'Forecasted Rate': null,
      'Upper Bound': null,
      'Lower Bound': null
    })),
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

  const lastHistRate = history.length > 0 ? history[history.length - 1].rate : null;
  const targetForecastPoint = forecast.length > 0 ? (horizon === 30 ? forecast[3] : forecast[forecast.length - 1]) : null;
  const forecastedRate = targetForecastPoint ? targetForecastPoint.forecastRate : null;
  const expectedChange = lastHistRate && forecastedRate ? ((forecastedRate - lastHistRate) / lastHistRate) * 100 : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase flex items-center gap-3">
          <Ship className="h-6 w-6 text-sky-400" />
          Advanced Freight Rate Forecasting Desk
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Steel Authority of India Limited • Quantitative Cost Prediction & Volatility Bounds
        </p>
      </div>

      {/* Input Form Panel */}
      <div className="card-slate-navy p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Ship className="h-4 w-4" />
          Voyage & Cargo Parameter Specification
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Origin Port</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
            >
              {origins.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Destination Port</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
            >
              {destinations.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Commodity Class</label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
            >
              {commodities.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Vessel Category</label>
            <select
              value={vesselType}
              onChange={(e) => setVesselType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer font-mono"
            >
              {vesselTypes.map(vt => <option key={vt} value={vt} className="bg-slate-900">{vt}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold uppercase">Horizon Focus:</span>
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setHorizon(30)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                  horizon === 30 ? 'bg-navy-900 text-sky-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setHorizon(90)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                  horizon === 90 ? 'bg-navy-900 text-sky-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerateForecast}
            disabled={loading}
            className="btn-navy-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
            Generate Forecast Model
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3.5 rounded-lg flex gap-3 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Main Results Panel */}
      {forecast.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-slate-navy p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-tight">Historical vs Forecast Projection</h3>
              <span className="text-[11px] font-mono font-bold text-sky-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-md">
                MODEL: <span className="text-slate-100">{bestModel}</span>
              </span>
            </div>

            <div className="h-[320px] w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '0.5rem' }}
                    labelStyle={{ fontWeight: 'bold', color: '#38BDF8' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="Historical Rate" 
                    stroke="#38BDF8" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5, fill: '#38BDF8' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Forecasted Rate" 
                    stroke="#F59E0B" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5" 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Upper Bound" 
                    stroke="#F43F5E" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3" 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Lower Bound" 
                    stroke="#10B981" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3" 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[11px] text-slate-400 font-mono italic mt-2.5 text-center">
              Dotted bounds represent 95% confidence intervals based on backtesting residuals.
            </p>
          </div>

          <div className="space-y-6">
            <div className="card-slate-navy p-5 space-y-3 font-mono">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Forecast Summary Metrics
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="inset-slate-container p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Spot Rate</span>
                  <span className="text-base font-black text-slate-100 block mt-0.5">${lastHistRate ? lastHistRate.toFixed(2) : '--'}</span>
                </div>
                <div className="inset-slate-container p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{horizon}-Day Prediction</span>
                  <span className="text-base font-black text-slate-100 block mt-0.5">${forecastedRate ? forecastedRate.toFixed(2) : '--'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="inset-slate-container p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected Delta</span>
                  <span className={`text-sm font-black block mt-0.5 ${expectedChange && expectedChange >= 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                    {expectedChange ? (expectedChange >= 0 ? '+' : '') + expectedChange.toFixed(1) + '%' : '--'}
                  </span>
                </div>
                <div className="inset-slate-container p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Confidence Index</span>
                  <span className="text-sm font-black text-sky-400 block mt-0.5">{confidence}%</span>
                </div>
              </div>
            </div>

            {metrics && (
              <div className="card-slate-navy p-5 flex flex-col">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3 flex items-center gap-2 font-mono">
                  <BarChart2 className="h-4 w-4 text-sky-400" />
                  Model Backtest Evaluation
                </h3>
                
                <div className="space-y-3">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase">
                        <th className="pb-2">Model</th>
                        <th className="pb-2">MAE</th>
                        <th className="pb-2">RMSE</th>
                        <th className="pb-2">MAPE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Object.keys(metrics).map((modelName) => (
                        <tr 
                          key={modelName} 
                          className={`hover:bg-slate-800/40 ${modelName === bestModel ? 'text-sky-400 font-bold' : 'text-slate-300'}`}
                        >
                          <td className="py-2 flex items-center gap-1">
                            {modelName === bestModel && <CheckCircle2 className="h-3 w-3 text-sky-400" />}
                            {modelName}
                          </td>
                          <td className="py-2">${metrics[modelName].MAE.toFixed(2)}</td>
                          <td className="py-2">${metrics[modelName].RMSE.toFixed(2)}</td>
                          <td className="py-2">{metrics[modelName].MAPE.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="text-[11px] text-slate-400 inset-slate-container p-3 leading-normal font-sans">
                    💡 <strong className="text-sky-400">Evaluation Standard</strong>: Models are evaluated on held-out test blocks to avoid lookahead bias.
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
