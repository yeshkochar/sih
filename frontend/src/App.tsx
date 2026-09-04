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
  Home,
  ChevronDown,
  Layers,
  Menu,
  X
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
import SAILLogo from './components/SAILLogo';
import { useWebSocket, WebSocketEvent } from './hooks/useWebSocket';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
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

  return (
    <div className={`relative min-h-screen flex flex-col font-sans select-none transition-colors duration-300 ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-black text-slate-100'
    }`}>
      
      {/* Executive Dynamic Canvas Background */}
      <MaritimeBackground />

      {/* ARCHITECTURAL TOP HEADER: BRAND → PRIMARY NAV → FLEXIBLE SPACE → STATUS → UTILITIES → ACCOUNT */}
      <header className={`sticky top-0 z-40 h-14 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors duration-200 backdrop-blur-xl ${
        isLight ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-[#0B0F17]/95 border-slate-800/80 shadow-lg'
      }`}>
        
        {/* BRAND */}
        <div 
          onClick={() => { setActiveTab('dashboard'); setMoreMenuOpen(false); }}
          className="cursor-pointer flex items-center gap-3 shrink-0 mr-2"
        >
          <SAILLogo />
        </div>

        <div className="h-4 w-px bg-slate-800/80 hidden xl:block mx-1" />

        {/* PRIMARY NAVIGATION (Architectural Text Links with Bottom Accent Lines) */}
        <nav className="hidden lg:flex items-center gap-0.5 font-mono text-xs">
          {/* Command Center */}
          <button
            onClick={() => { setActiveTab('dashboard'); setMoreMenuOpen(false); }}
            className={activeTab === 'dashboard' ? 'nav-link-active-architectural' : 'nav-link-architectural'}
          >
            <div className="flex items-center gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Command Center</span>
            </div>
          </button>

          {/* Freight Forecast */}
          <button
            onClick={() => { setActiveTab('forecast'); setMoreMenuOpen(false); }}
            className={activeTab === 'forecast' ? 'nav-link-active-architectural' : 'nav-link-architectural'}
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Freight Forecast</span>
            </div>
          </button>

          {/* Charter Optimizer */}
          <button
            onClick={() => { setActiveTab('optimizer'); setMoreMenuOpen(false); }}
            className={activeTab === 'optimizer' ? 'nav-link-active-architectural' : 'nav-link-architectural'}
          >
            <div className="flex items-center gap-1.5">
              <Ship className="h-3.5 w-3.5" />
              <span>Charter Optimizer</span>
            </div>
          </button>

          {/* Port Intelligence */}
          <button
            onClick={() => { setActiveTab('ports'); setMoreMenuOpen(false); }}
            className={activeTab === 'ports' ? 'nav-link-active-architectural' : 'nav-link-architectural'}
          >
            <div className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" />
              <span>Port Intelligence</span>
            </div>
          </button>

          {/* Scenario Simulator */}
          <button
            onClick={() => { setActiveTab('scenarios'); setMoreMenuOpen(false); }}
            className={activeTab === 'scenarios' ? 'nav-link-active-architectural' : 'nav-link-architectural'}
          >
            <div className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>Scenario Simulator</span>
            </div>
          </button>

          {/* More / Intelligence Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={(activeTab === 'health' || activeTab === 'audit' || activeTab === 'home') ? 'nav-link-active-architectural flex items-center gap-1' : 'nav-link-architectural flex items-center gap-1'}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>More</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreMenuOpen && (
              <div className={`absolute top-full mt-1.5 left-0 w-60 p-2 rounded-xl border shadow-xl z-50 backdrop-blur-xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40' : 'bg-[#0F172A] border-slate-800 text-slate-100 shadow-black/80'
              }`}>
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/40 mb-1">
                  ANALYTICS & AUDIT
                </div>
                
                <button
                  onClick={() => { setActiveTab('health'); setMoreMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-left transition ${
                    activeTab === 'health' ? (isLight ? 'bg-blue-50 text-blue-900 font-bold' : 'bg-slate-800 text-sky-300 font-bold') : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-300')
                  }`}
                >
                  <Activity className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <div>
                    <span className="block">Data Telemetry Matrix</span>
                    <span className="text-[9px] text-slate-400 block font-normal">AIS & API pipeline status</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('audit'); setMoreMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-left transition ${
                    activeTab === 'audit' ? (isLight ? 'bg-blue-50 text-blue-900 font-bold' : 'bg-slate-800 text-sky-300 font-bold') : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-300')
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block">Decision Audit Trail</span>
                    <span className="text-[9px] text-slate-400 block font-normal">Historical fixture log</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('home'); setMoreMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold text-left transition ${
                    activeTab === 'home' ? (isLight ? 'bg-blue-50 text-blue-900 font-bold' : 'bg-slate-800 text-sky-300 font-bold') : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-300')
                  }`}
                >
                  <Home className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <div>
                    <span className="block">Parallax Portal Home</span>
                    <span className="text-[9px] text-slate-400 block font-normal">Landing showcase page</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* FLEXIBLE SPACE */}
        <div className="flex-1" />

        {/* SYSTEM STATUS → MARKET/UTILITY → ACCOUNT */}
        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
          
          {/* SYSTEM STATUS */}
          <ConnectionStatus status={connectionStatus} lastSyncTime={lastSyncTime} />

          <div className="h-4 w-px bg-slate-800/80 hidden sm:block" />

          {/* MARKET / UTILITY CONTROLS */}
          <div className="hidden sm:flex items-center gap-2">
            {showResetSuccess && (
              <div className="badge-slate-emerald px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>RESEEDED</span>
              </div>
            )}

            {/* Scenario Selector */}
            <div className={`flex items-center rounded border px-2 py-1 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <span className="text-[9px] font-bold text-slate-400 mr-1.5 uppercase">SCENARIO:</span>
              <select
                value={resetScenario}
                onChange={(e) => setResetScenario(e.target.value)}
                className="bg-transparent text-xs focus:outline-none cursor-pointer font-bold"
              >
                <option value="normal" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Normal Market</option>
                <option value="freight_spike" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Freight Spike</option>
                <option value="port_congestion" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Port Congestion</option>
                <option value="fuel_price_shock" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Fuel Price Shock</option>
                <option value="vessel_shortage" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>Vessel Shortage</option>
              </select>
              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="ml-1.5 p-0.5 rounded hover:bg-slate-800/50 text-sky-400 transition"
                title="Reseed market scenario"
              >
                <RefreshCw className={`h-3 w-3 ${resetting ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded border text-xs transition cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-300 text-amber-700 hover:bg-slate-100' : 'bg-slate-900/80 border-slate-800 text-sky-400 hover:bg-slate-800'
              }`}
              title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            >
              {isLight ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800/80 hidden sm:block" />

          {/* ACCOUNT CONTROL */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-semibold transition cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900' 
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-100'
              }`}
            >
              <div className={`h-5 w-5 rounded flex items-center justify-center text-[10px] font-black ${
                isLight ? 'bg-blue-900 text-white' : 'bg-sky-500/20 text-sky-400'
              }`}>
                <User className="h-3 w-3" />
              </div>
              <span className="hidden md:inline font-extrabold">{user.username}</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className={`absolute top-full mt-1.5 right-0 w-52 p-3 rounded-xl border shadow-xl z-50 backdrop-blur-xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-[#0F172A] border-slate-800 text-slate-100 shadow-black/80'
              }`}>
                <div className="pb-2 mb-2 border-b border-slate-800/60 font-mono text-[11px]">
                  <span className="font-extrabold block">{user.username}</span>
                  <span className="text-[9px] text-slate-400 uppercase">{user.role} • SAIL Operations</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition text-left cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Drawer Hamburger Button */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden p-1.5 rounded border border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            {mobileDrawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

        </div>
      </header>

      {/* MOBILE / TABLET SLIDE-OVER COMMAND DRAWER */}
      {mobileDrawerOpen && (
        <div className={`lg:hidden border-b p-4 space-y-3 z-30 font-mono text-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-slate-100'
        }`}>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            SAIL FREIGHT DESK MODULES
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Command Center</span>
            </button>

            <button
              onClick={() => { setActiveTab('forecast'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'forecast' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <Calendar className="h-4 w-4" />
              <span>Freight Forecast</span>
            </button>

            <button
              onClick={() => { setActiveTab('optimizer'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'optimizer' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <Ship className="h-4 w-4" />
              <span>Charter Optimizer</span>
            </button>

            <button
              onClick={() => { setActiveTab('ports'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'ports' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <Compass className="h-4 w-4" />
              <span>Port Intelligence</span>
            </button>

            <button
              onClick={() => { setActiveTab('scenarios'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'scenarios' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <Sliders className="h-4 w-4" />
              <span>Scenario Simulator</span>
            </button>

            <button
              onClick={() => { setActiveTab('health'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'health' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <Activity className="h-4 w-4" />
              <span>Data Matrix</span>
            </button>

            <button
              onClick={() => { setActiveTab('audit'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'audit' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <FileText className="h-4 w-4" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => { setActiveTab('home'); setMobileDrawerOpen(false); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'home' ? 'bg-blue-600 text-white font-bold border-blue-500' : 'border-slate-800'}`}
            >
              <Home className="h-4 w-4" />
              <span>Parallax Home</span>
            </button>
          </div>
        </div>
      )}

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
