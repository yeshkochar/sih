import React, { useState, useEffect } from 'react';
import { Ship, LayoutDashboard, Calendar, Compass, Sliders, FileText, LogOut, RefreshCw, User, CheckCircle2 } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Optimizer from './pages/Optimizer';
import PortIntel from './pages/PortIntel';
import ScenarioAnalysis from './pages/ScenarioAnalysis';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Data lists shared across pages
  const [ports, setPorts] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Reset Scenario states
  const [resetScenario, setResetScenario] = useState('normal');
  const [resetting, setResetting] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  // Restore session from localStorage if present
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

  // Fetch Ports & Vessels on user authentication
  const fetchSharedData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const portsRes = await fetch('/api/ports');
      const portsData = await portsRes.json();
      setPorts(portsData);

      const vesselsRes = await fetch('/api/vessels');
      const vesselsData = await vesselsRes.json();
      setVessels(vesselsData);
    } catch (e) {
      console.error("Error loading ports/vessels list", e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSharedData();
  }, [user]);

  // DB Reseeder
  const handleResetDemoData = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: resetScenario })
      });
      if (res.ok) {
        // Reload ports & vessels data
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
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-950 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo brand area */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-950 bg-slate-950/20">
            <div className="h-8 w-8 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/20">
              <Ship className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-200">
                FREIGHTSENSE AI
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">SAIL DECISION HUB</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'dashboard', label: 'Intelligence Tower', icon: LayoutDashboard },
              { id: 'forecast', label: 'Freight Forecasting', icon: Calendar },
              { id: 'optimizer', label: 'Vessel Optimizer', icon: Ship },
              { id: 'ports', label: 'Port Intelligence', icon: Compass },
              { id: 'scenarios', label: 'Scenario Simulator', icon: Sliders },
              { id: 'audit', label: 'System Audit Trail', icon: FileText }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info / Logout */}
        <div className="p-4 border-t border-slate-950 bg-slate-950/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
              <User className="h-4 w-4" />
            </div>
            <div className="text-[10px] tracking-wide">
              <span className="font-bold text-slate-300 block">{user.username}</span>
              <span className="text-slate-500 block uppercase font-semibold text-[8px] tracking-wider">{user.role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-950 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-900 hover:border-red-900/30 rounded-xl text-xs font-medium transition active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-950 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
              SIH 2026 - SAIL / MINISTRY OF STEEL
            </span>
          </div>

          {/* Demo Data Reset Trigger */}
          <div className="flex items-center gap-2.5 relative z-50">
            {showResetSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-900 text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 mr-2 animate-bounce">
                <CheckCircle2 className="h-3.5 w-3.5" />
                DEMO ENVIRONMENT RESET COMPLETED
              </div>
            )}
            
            <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-0.5">
              <select
                value={resetScenario}
                onChange={(e) => setResetScenario(e.target.value)}
                className="bg-transparent text-slate-300 text-xs px-3 py-1.5 focus:outline-none focus:ring-0 font-medium"
              >
                <option value="normal" className="bg-slate-900 text-slate-300">Normal Market</option>
                <option value="freight_spike" className="bg-slate-900 text-slate-300">Freight Spike Spike</option>
                <option value="port_congestion" className="bg-slate-900 text-slate-300">Port Congestion</option>
                <option value="fuel_price_shock" className="bg-slate-900 text-slate-300">Fuel price shock</option>
                <option value="vessel_shortage" className="bg-slate-900 text-slate-300">Vessel shortage</option>
              </select>
              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-1 disabled:opacity-50"
              >
                {resetting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Reset Demo
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic page component viewport */}
        <main className="flex-1 overflow-y-auto p-8">
          {loadingData ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400">Syncing port limits and fleet database...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard ports={ports} vessels={vessels} onNavigate={setActiveTab} />}
              {activeTab === 'forecast' && <Forecast ports={ports} />}
              {activeTab === 'optimizer' && <Optimizer ports={ports} vessels={vessels} user={user} />}
              {activeTab === 'ports' && <PortIntel ports={ports} />}
              {activeTab === 'scenarios' && <ScenarioAnalysis />}
              {activeTab === 'audit' && <AuditLogs />}
            </>
          )}
        </main>
      </div>

    </div>
  );
}
