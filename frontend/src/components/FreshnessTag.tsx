import React from 'react';
import { Clock, Database, Radio, AlertTriangle } from 'lucide-react';

interface FreshnessTagProps {
  status?: 'LIVE' | 'CACHED' | 'DEMO' | string;
  source?: string;
  lastUpdated?: string | Date;
  staleThresholdMinutes?: number;
  compact?: boolean;
}

export default function FreshnessTag({
  status = 'DEMO',
  source = 'FreightSense System Feed',
  lastUpdated,
  staleThresholdMinutes = 15,
  compact = false
}: FreshnessTagProps) {
  // Compute age in minutes
  const updatedDate = lastUpdated ? new Date(lastUpdated) : new Date();
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - updatedDate.getTime());
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  const isStale = diffMins >= staleThresholdMinutes;

  const renderBadge = () => {
    if (isStale) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-red-950/60 text-red-400 border border-red-900/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          STALE DATA
        </span>
      );
    }

    if (status === 'LIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          LIVE
        </span>
      );
    }

    if (status === 'CACHED') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-amber-950/60 text-amber-400 border border-amber-900/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
          <Clock className="h-3 w-3 text-amber-400" />
          CACHED
        </span>
      );
    }

    // Default DEMO Mode
    return (
      <span className="inline-flex items-center gap-1.5 bg-indigo-950/60 text-indigo-300 border border-indigo-900/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
        <Radio className="h-3 w-3 text-indigo-400" />
        DEMO MODE
      </span>
    );
  };

  const timeAgoStr = diffSecs < 10
    ? 'Just now'
    : diffSecs < 60
    ? `${diffSecs}s ago`
    : `${diffMins}m ago`;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {renderBadge()}
        <span className="text-[10px] text-slate-500 font-mono">{timeAgoStr}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 text-slate-400 text-[11px]">
      <div className="flex items-center gap-2">
        {renderBadge()}
        <span className="text-slate-400 font-medium truncate max-w-[180px]">
          {source}
        </span>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono shrink-0">
        <Clock className="h-3 w-3 text-slate-500" />
        <span>Updated {timeAgoStr}</span>
      </div>
    </div>
  );
}
