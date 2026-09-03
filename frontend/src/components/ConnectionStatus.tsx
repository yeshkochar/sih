import React from 'react';
import { Wifi, RefreshCw, Activity, AlertOctagon } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
  lastSyncTime: string | null;
  systemMode?: 'LIVE' | 'DEMO' | string;
}

export default function ConnectionStatus({
  status,
  lastSyncTime,
  systemMode = 'DEMO'
}: ConnectionStatusProps) {
  if (status === 'reconnecting' || status === 'disconnected') {
    return (
      <div className="bg-amber-950/80 border border-amber-800 text-amber-300 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse">
        <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
        <span>RECONNECTING LIVE STREAM...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-400">
          {systemMode === 'LIVE' ? 'LIVE DATA CONNECTED' : 'DEMO STREAM CONNECTED'}
        </span>
      </div>

      {lastSyncTime && (
        <>
          <span className="text-slate-700">|</span>
          <span className="text-[9px] font-mono text-slate-400">
            Sync: {lastSyncTime}
          </span>
        </>
      )}
    </div>
  );
}
