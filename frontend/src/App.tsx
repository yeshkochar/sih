import React, { useState, useEffect, useCallback } from 'react';
import { 
  Ship, 
  LayoutDashboard, 
  Calendar, 
  Compass, 
  Sliders, 
  FileText, 
  LogOut, 
  RefreshCw, 
  User, 
  CheckCircle2, 
  Activity, 
  Sun, 
  Moon,
  Home
} from 'lucide-react';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Optimizer from './pages/Optimizer';
import PortIntel from './pages/PortIntel';
import ScenarioAnalysis from './pages/ScenarioAnalysis';
import AuditLogs from './pages/AuditLogs';
import DataHealth from './pages/DataHealth';
import ConnectionStatus from './components/ConnectionStatus';
import MaritimeBackground from './components/MaritimeBackground';
import { useWebSocket, WebSocketEvent } from './hooks/useWebSocket';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  
  const [ports, setPorts] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [resetScenario, setResetScenario] = useState('normal');
  const [resetting, setResetting] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('fs_user');
    const savedToken = localStorage.getItem('fs_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const handleLoginSuccess = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('fs_user', JSON.stringify(userData));
    localStorage.setItem('fs_token', userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fs_user');
    localStorage.removeItem('fs_token');
  };

  const fetchSharedData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      let portsRes = await fetch('/api/ports').catch(() => fetch('http://127.0.0.1:8000/api/ports'));
      if (!portsRes.ok) portsRes = await fetch('http://127.0.0.1:8000/api/ports').catch(() => portsRes);
      if (portsRes.ok) {
        const portsData = await portsRes.json();
        setPorts(portsData);
      }

      let vesselsRes = await fetch('/api/vessels').catch(() => fetch('http://127.0.0.1:8000/api/vessels'));
      if (!vesselsRes.ok) vesselsRes = await fetch('http://127.0.0.1:8000/api/vessels').catch(() => vesselsRes);
      if (vesselsRes.ok) {
        const vesselsData = await vesselsRes.json();
        setVessels(vesselsData);
      }
    } catch (e) {
      console.error("Error loading ports/vessels list", e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleWSEvent = useCallback((evt: WebSocketEvent) => {
    if (evt.event === 'data.updated') {
      if (evt.dataType === 'vessel' && Array.isArray(evt.data)) {
        setVessels(evt.data);
      } else if (evt.dataType === 'port' && Array.isArray(evt.data)) {
        setPorts(prev => prev.map(p => {
          const match = evt.data.find((updatedP: any) => updatedP.id === p.id);
          return match ? { ...p, ...match } : p;
        }));
      }
    }
  }, []);

  const { connectionStatus, lastSyncTime } = useWebSocket(handleWSEvent);

  useEffect(() => {
    fetchSharedData();
  }, [user]);

  const handleResetDemoData = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: resetScenario })
      });
      if (res.ok) {
        await fetchSharedData();
        setShowResetSuccess(true);
        setTimeout(() => setShowResetSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
      alert('Reseed failed.');
    } finally {
      setResetting(false);
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const navItems = [
    { id: 'home', index: '00', label: 'Home', icon: Home },
    { id: 'dashboard', index: '01', label: 'Command Center', icon: LayoutDashboard },
    { id: 'forecast', index: '02', label: 'Rate Forecasting', icon: Calendar },
    { id: 'optimizer', index: '03', label: 'Charter Optimizer', icon: Ship },
    { id: 'ports', index: '04', label: 'Port Intelligence', icon: Compass },
    { id: 'scenarios', index: '05', label: 'Scenario Simulator', icon: Sliders },
    { id: 'health', index: '06', label: 'Data Matrix', icon: Activity },
    { id: 'audit', index: '07', label: 'Audit Trail', icon: FileText }
  ];

  return (
    <div className={`relative min-h-screen flex flex-col overflow-x-hidden font-sans select-none transition-colors duration-300 ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-black text-slate-100'}`}>
      
      {/* Executive Dynamic Canvas Background */}
      <MaritimeBackground />

      {/* SLEEK EXECUTIVE TOP FLOATING NAVIGATION DOCK (Replaces Left Sidebar) */}
      <header className={`sticky top-0 z-30 h-16 border-b flex items-center justify-between px-6 shrink-0 transition-colors duration-300 backdrop-blur-xl ${
        isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-slate-950/90 border-slate-800 shadow-xl'
      }`}>
        
        {/* Far Left Brand Logo Emblem */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className={`h-9 w-9 border rounded-xl flex items-center justify-center font-black text-xs shadow-md transition-transform group-hover:scale-105 ${
            isLight ? 'bg-blue-900 border-blue-800 text-white' : 'bg-slate-900 border-slate-700 text-sky-400'
          }`}>
            SA
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`font-extrabold tracking-tight text-xs truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              SAIL Freight Desk
            </span>
            <span className={`text-[9px] font-semibold tracking-wider uppercase truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              STEEL AUTHORITY OF INDIA
            </span>
          </div>
        </div>

        {/* Center Dock: Horizontal Nav Pills */}
        <nav className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'nav-pill-active shadow-md' 
                    : 'nav-pill-inactive'
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Far Right Executive Controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* LIGHT / DARK THEME TOGGLE SWITCH */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all duration-200 shadow-sm cursor-pointer active:scale-95 ${
              isLight 
                ? 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400' 
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
            }`}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
          >
            {isLight ? (
              <>
                <Sun className="h-4 w-4 text-amber-600 fill-amber-500/20" />
                <span className="hidden sm:inline text-[11px] tracking-wide text-amber-900 font-extrabold">LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-sky-400 fill-sky-400/20" />
                <span className="hidden sm:inline text-[11px] tracking-wide text-sky-300 font-extrabold">DARK</span>
              </>
            )}
          </button>

          {showResetSuccess && (
            <div className="badge-slate-emerald px-3 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1.5 animate-fade-in-up">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>RESEEDED</span>
            </div>
          )}
          
          {/* Scenario Reseeder Dropdown */}
          <div className={`hidden sm:flex items-center rounded-lg border p-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
          }`}>
            <select
              value={resetScenario}
              onChange={(e) => setResetScenario(e.target.value)}
              className={`text-xs px-2 py-1 rounded border focus:outline-none font-mono cursor-pointer font-semibold ${
                isLight 
                  ? 'bg-white text-slate-800 border-slate-300' 
                  : 'bg-slate-900 text-slate-200 border-slate-800'
              }`}
            >
              <option value="normal">Normal Market</option>
              <option value="freight_spike">Freight Spike</option>
              <option value="port_congestion">Port Congestion</option>
              <option value="fuel_price_shock">Fuel Price Shock</option>
              <option value="vessel_shortage">Vessel Shortage</option>
            </select>
            <button
              onClick={handleResetDemoData}
              disabled={resetting}
              className="btn-navy-primary text-[10px] font-mono uppercase font-bold px-2 py-1 ml-1 rounded transition flex items-center gap-1.5 disabled:opacity-50"
              title="Reseed demo dataset"
            >
              {resetting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </button>
          </div>

          <ConnectionStatus status={connectionStatus} lastSyncTime={lastSyncTime} />

          {/* User Account / Sign Out Pill */}
          <div className="flex items-center gap-2 border-l border-slate-700/50 pl-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
              isLight ? 'bg-slate-100 text-blue-700 border-slate-300' : 'bg-slate-900 text-sky-400 border-slate-800'
            }`} title={`${user.username} (${user.role})`}>
              <User className="h-4 w-4" />
            </div>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg border text-xs font-semibold transition ${
                isLight 
                  ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-300 hover:border-rose-300' 
                  : 'bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border-slate-800 hover:border-rose-800'
              }`}
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Horizontal Sub-Header Navigation Bar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto p-2 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                isActive ? 'nav-pill-active' : 'nav-pill-inactive'
              }`}
            >
              <IconComponent className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Full-Width Main Viewport Content */}
      <main className="flex-1 min-w-0 z-10">
        {loadingData ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="card-slate-navy p-8 flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 text-sky-400 animate-spin" />
              <p className="text-xs font-mono font-bold">Synchronizing SAIL bulk freight database...</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up h-full">
            {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}
            {activeTab === 'dashboard' && <div className="p-6"><Dashboard ports={ports} vessels={vessels} onNavigate={setActiveTab} /></div>}
            {activeTab === 'forecast' && <div className="p-6"><Forecast ports={ports} /></div>}
            {activeTab === 'optimizer' && <div className="p-6"><Optimizer ports={ports} vessels={vessels} user={user} /></div>}
            {activeTab === 'ports' && <div className="p-6"><PortIntel ports={ports} /></div>}
            {activeTab === 'scenarios' && <div className="p-6"><ScenarioAnalysis /></div>}
            {activeTab === 'health' && <div className="p-6"><DataHealth /></div>}
            {activeTab === 'audit' && <div className="p-6"><AuditLogs /></div>}
          </div>
        )}
      </main>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
