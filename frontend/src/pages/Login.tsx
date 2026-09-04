import React, { useState } from 'react';
import { Ship, Lock, User, AlertCircle } from 'lucide-react';
import MaritimeBackground from '../components/MaritimeBackground';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('demo@sail.in');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response: Response;
      try {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      } catch (networkErr) {
        response = await fetch('http://127.0.0.1:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      }

      if (!response.ok && (response.status === 500 || response.status === 502)) {
        try {
          const directRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (directRes.ok || directRes.status === 400) {
            response = directRes;
          }
        } catch (_) {}
      }

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.detail || `Login failed (${response.status})`);
      }

      if (!data.user || !data.access_token) {
        throw new Error('Invalid authentication response structure');
      }

      onLoginSuccess(data.user, data.access_token);
    } catch (err: any) {
      setError(err.message || 'Server error. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 overflow-hidden font-sans select-none">
      
      {/* Animated Ship & Maritime Background */}
      <MaritimeBackground />

      <div className="w-full max-w-md card-slate-navy p-8 relative z-10 animate-fade-in-up border border-slate-800 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-navy-900 border border-slate-700 rounded-xl flex items-center justify-center mb-3 text-sky-400 font-black text-sm shadow-md">
            SA
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase text-center">
            SAIL FREIGHT AI
          </h1>
          <p className="text-xs text-slate-400 mt-1 text-center font-medium">
            Steel Authority of India Limited • Maritime Bulk Procurement Portal
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3.5 rounded-lg mb-6 flex items-start gap-3 text-xs">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Official Enterprise Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@sail.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-navy-primary text-xs font-semibold uppercase tracking-wider py-3 mt-2 shadow-lg active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING COMMAND CREDENTIALS...' : 'SECURE ENTERPRISE LOGIN'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Ministry of Steel • Bulk Freight Command Platform
          </p>
          <div className="mt-2 text-[11px] text-sky-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
            Demo Credentials: <span className="text-slate-100 font-bold">demo@sail.in</span> / <span className="text-slate-100 font-bold">demo123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
