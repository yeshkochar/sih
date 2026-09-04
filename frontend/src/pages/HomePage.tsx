import React, { useEffect, useState, useRef } from 'react';
import { 
  Ship, 
  LayoutDashboard, 
  Calendar, 
  Compass, 
  Sliders, 
  FileText, 
  Activity, 
  ArrowRight, 
  TrendingUp, 
  Anchor, 
  Globe, 
  ShieldCheck, 
  Zap, 
  ChevronDown,
  Layers,
  Award
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HomePageProps {
  onNavigate: (tabId: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollY(containerRef.current.scrollTop);
      }
    };

    const containerEl = containerRef.current;
    if (containerEl) {
      containerEl.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (containerEl) {
        containerEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const features = [
    {
      id: 'dashboard',
      index: '01',
      title: 'Real-Time Maritime Command Center',
      tagline: 'Global Telemetry & Interactive 3D Fleet Globe',
      description: 'Continuous satellite tracking of SAIL bulk carriers across 15+ international maritime trading nations with live berth congestion indicators.',
      icon: LayoutDashboard,
      highlight: '3D WebGL Globe',
      accent: 'border-blue-500/40 text-blue-400'
    },
    {
      id: 'forecast',
      index: '02',
      title: 'Freight Rate Forecasting Engine',
      tagline: 'Predictive Spot Rate & Charter Trend Analysis',
      description: 'Algorithmic Baltic Dry Index projections enabling raw material procurement teams to lock fixtures at optimal market troughs.',
      icon: Calendar,
      highlight: 'Baltic Index Analytics',
      accent: 'border-sky-500/40 text-sky-400'
    },
    {
      id: 'optimizer',
      index: '03',
      title: 'Vessel Charter Strategy Optimizer',
      tagline: 'Capesize & Supramax Charter Party Recommendation',
      description: 'Matches cargo laycan dates with candidate fleet positions, minimizing demurrage risk and total voyage freight cost per metric ton.',
      icon: Ship,
      highlight: 'Algorithmic Fixture Rank',
      accent: 'border-emerald-500/40 text-emerald-400'
    },
    {
      id: 'ports',
      index: '04',
      title: 'Port Intelligence & Draft Matrix',
      tagline: 'Deep-Draft Terminal & Anchorage Monitoring',
      description: 'Live draft depth metrics, waiting time telemetry, and discharge rate tracking at Visakhapatnam, Paradip, Haldia, and overseas origin ports.',
      icon: Compass,
      highlight: 'Turnaround Optimization',
      accent: 'border-amber-500/40 text-amber-400'
    },
    {
      id: 'scenarios',
      index: '05',
      title: 'Market Scenario & Risk Simulator',
      tagline: 'Stress-Testing Bulk Supply Chain Resilience',
      description: 'Simulate fuel price shocks, extreme weather delays, and bunker price volatility before committing to charter party contracts.',
      icon: Sliders,
      highlight: 'Monte Carlo Stress Test',
      accent: 'border-purple-500/40 text-purple-400'
    },
    {
      id: 'health',
      index: '06',
      title: 'Data Telemetry Matrix',
      tagline: 'High-Frequency AIS & Sensor Pipeline Monitor',
      description: 'Real-time telemetry verification ensuring uninterrupted data feeds from satellite AIS, port authorities, and Baltic Exchange benchmarks.',
      icon: Activity,
      highlight: '99.9% Uptime Verified',
      accent: 'border-indigo-500/40 text-indigo-400'
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scroll-smooth relative"
    >
      {/* Dynamic Animated Video/Canvas Parallax Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-12 pb-20 overflow-hidden">
        
        {/* Parallax Background Canvas Layer */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-transform duration-75 ease-out"
          style={{ transform: `translateY(${scrollY * 0.4}px)` }}
        >
          {/* Animated Radar Circle Grids */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-blue-500/10 animate-ping opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-sky-500/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border stroke-dasharray-4 border-blue-400/20" />
          
          {/* Layered Vessel Vector Silhouette */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-15 w-[1000px] h-[260px]">
            <svg width="100%" height="100%" viewBox="0 0 1000 260" fill="none">
              <path d="M50 160 L150 240 L850 240 L950 140 L880 160 Z" fill={isLight ? '#1E3A8A' : '#38BDF8'} />
              <rect x="730" y="80" width="120" height="80" fill={isLight ? '#0284C7' : '#60A5FA'} />
              <rect x="180" y="120" width="90" height="40" fill={isLight ? '#1E3A8A' : '#38BDF8'} />
              <rect x="300" y="120" width="90" height="40" fill={isLight ? '#0284C7' : '#60A5FA'} />
              <rect x="420" y="120" width="90" height="40" fill={isLight ? '#1E3A8A' : '#38BDF8'} />
              <rect x="540" y="120" width="90" height="40" fill={isLight ? '#0284C7' : '#60A5FA'} />
            </svg>
          </div>
        </div>

        {/* Hero Content Layer */}
        <div 
          className="relative z-10 max-w-4xl mx-auto space-y-6 transition-transform duration-75 ease-out"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          {/* Government / Enterprise Crest Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-lg border-blue-500/30 bg-blue-500/10 text-blue-400">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>MINISTRY OF STEEL • STEEL AUTHORITY OF INDIA LIMITED</span>
          </div>

          {/* Main Cinematic Title */}
          <h1 className={`text-4xl md:text-6xl font-black tracking-tight leading-tight ${
            isLight ? 'text-slate-900' : 'text-slate-100'
          }`}>
            SAIL Enterprise <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
              Maritime Freight Command Center
            </span>
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className={`text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            Empowering SAIL’s raw material procurement ecosystem with real-time AIS vessel telemetry, algorithmic Baltic freight rate forecasting, and Capesize charter party optimization.
          </p>

          {/* Action Button CTA Group */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-navy-primary px-7 py-3.5 rounded-xl text-sm font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-all group"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('optimizer')}
              className={`px-6 py-3.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 backdrop-blur-md ${
                isLight 
                  ? 'bg-white/80 border-slate-300 text-slate-800 hover:bg-slate-100' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Ship className="h-4 w-4 text-sky-400" />
              <span>Charter Optimizer</span>
            </button>
          </div>
        </div>

        {/* Scroll Indicator Icon */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60 animate-bounce">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">SCROLL TO EXPLORE</span>
          <ChevronDown className="h-4 w-4 text-sky-400" />
        </div>
      </section>

      {/* Live Enterprise Ticker & Key Indicators */}
      <section className="relative z-10 py-8 px-6 border-y border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="flex items-center gap-2 text-sky-400 font-mono text-2xl font-black">
              <Anchor className="h-5 w-5" />
              <span>24.5M MT</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ANNUAL BULK FREIGHT</span>
          </div>

          <div className="flex flex-col items-center text-center space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-2xl font-black">
              <TrendingUp className="h-5 w-5" />
              <span>$1,840/day</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">BALTIC CAPESIZE BENCHMARK</span>
          </div>

          <div className="flex flex-col items-center text-center space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-2xl font-black">
              <Globe className="h-5 w-5" />
              <span>42 VESSELS</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ACTIVE FLEET TRACKED</span>
          </div>

          <div className="flex flex-col items-center text-center space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-2xl font-black">
              <Zap className="h-5 w-5" />
              <span>18.4%</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">DEMURRAGE COST SAVED</span>
          </div>

        </div>
      </section>

      {/* Parallax Feature Modules Showcase Grid */}
      <section className="relative z-10 max-w-6xl mx-auto py-20 px-6 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 border border-sky-400/20">
            <Layers className="h-3.5 w-3.5" />
            INTELLIGENCE MODULES
          </div>
          <h2 className={`text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            End-to-End Maritime Freight Architecture
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Integrated decision support systems engineered specifically for SAIL raw material importing and coastwise distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="card-slate-navy card-slate-navy-hover p-6 rounded-2xl flex flex-col justify-between cursor-pointer space-y-4 group transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border bg-slate-900/60 ${item.accent}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {item.index}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-base font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'} group-hover:text-blue-400 transition-colors`}>
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-sky-400 font-mono mt-0.5">
                      {item.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.highlight}</span>
                  <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SAIL Enterprise Heritage & Reliability Footer Banner */}
      <section className="relative z-10 max-w-6xl mx-auto mb-16 px-6">
        <div className="card-black-translucent p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400">
              <Award className="h-4 w-4" />
              <span>STEEL AUTHORITY OF INDIA LIMITED</span>
            </div>
            <h3 className={`text-xl font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Ready to optimize SAIL bulk charter strategy?
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Access real-time vessel fixture recommendations, spot rate projections, and port congestion analytics now.
            </p>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="btn-navy-primary px-6 py-3 rounded-xl text-xs font-bold whitespace-nowrap shadow-lg flex items-center gap-2"
          >
            <span>Enter Operations Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

    </div>
  );
}
