import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function MaritimeBackground() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300 ${isLight ? 'bg-slate-100' : 'bg-black'}`}>
      {/* Base Canvas */}
      <div className={`absolute inset-0 transition-colors duration-300 ${isLight ? 'bg-slate-100' : 'bg-black'}`} />

      {/* Subtle Coordinate Grid Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${isLight ? 'opacity-[0.08]' : 'opacity-[0.05]'}`}
        style={{
          backgroundImage: isLight
            ? `
              linear-gradient(rgba(15, 23, 42, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15, 23, 42, 0.3) 1px, transparent 1px)
            `
            : `
              linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
            `,
          backgroundSize: '64px 64px'
        }}
      />

      {/* PROMINENT VISIBLE SAIL BULK CARRIER SHIP WATERMARK */}
      <div className={`absolute -bottom-6 -right-10 pointer-events-none w-[900px] h-[320px] max-w-full transition-opacity duration-300 ${isLight ? 'opacity-[0.22]' : 'opacity-30'}`}>
        <svg width="100%" height="100%" viewBox="0 0 900 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main Hull */}
          <path d="M40 180 L120 270 L780 270 L870 160 L810 180 Z" fill={isLight ? '#CBD5E1' : '#1E293B'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="3" />
          <path d="M120 270 L780 270 L830 220 L100 220 Z" fill={isLight ? '#94A3B8' : '#0F172A'} stroke={isLight ? '#0284C7' : '#38BDF8'} strokeWidth="2" />
          
          {/* Superstructure & Bridge Tower */}
          <rect x="660" y="90" width="110" height="90" rx="4" fill={isLight ? '#E2E8F0' : '#1E293B'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2.5" />
          <rect x="680" y="60" width="70" height="30" rx="3" fill={isLight ? '#CBD5E1' : '#334155'} stroke={isLight ? '#0284C7' : '#93C5FD'} strokeWidth="2" />
          <rect x="695" y="30" width="40" height="30" rx="2" fill={isLight ? '#E2E8F0' : '#1E293B'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          
          {/* Radar Mast & Funnel Tower */}
          <line x1="715" y1="5" x2="715" y2="30" stroke={isLight ? '#0284C7' : '#38BDF8'} strokeWidth="4" />
          <line x1="700" y1="12" x2="730" y2="12" stroke={isLight ? '#0284C7' : '#38BDF8'} strokeWidth="3" />
          <rect x="740" y="50" width="22" height="40" fill={isLight ? '#1D4ED8' : '#2563EB'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          
          {/* Deck Cargo Hatches */}
          <rect x="150" y="130" width="85" height="50" fill={isLight ? '#CBD5E1' : '#334155'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          <rect x="255" y="130" width="85" height="50" fill={isLight ? '#94A3B8' : '#1E293B'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          <rect x="360" y="130" width="85" height="50" fill={isLight ? '#CBD5E1' : '#334155'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          <rect x="465" y="130" width="85" height="50" fill={isLight ? '#94A3B8' : '#1E293B'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          <rect x="570" y="130" width="75" height="50" fill={isLight ? '#CBD5E1' : '#334155'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />

          {/* Deck Cranes & Loading Rig Towers */}
          <line x1="240" y1="100" x2="240" y2="130" stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="3" />
          <line x1="220" y1="100" x2="260" y2="100" stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          <line x1="450" y1="100" x2="450" y2="130" stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="3" />
          <line x1="430" y1="100" x2="470" y2="100" stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />

          {/* BOLD PROMINENT SAIL LOGISTICS INSIGNIA WATERMARK */}
          <text x="310" y="245" fill={isLight ? '#1E3A8A' : '#60A5FA'} fontSize="24" fontFamily="sans-serif" fontWeight="900" letterSpacing="6" opacity={isLight ? '0.95' : '0.9'}>
            SAIL FREIGHT MARITIME
          </text>
          <text x="280" y="210" fill={isLight ? '#0369A1' : '#93C5FD'} fontSize="14" fontFamily="sans-serif" fontWeight="800" letterSpacing="4" opacity={isLight ? '0.9' : '0.8'}>
            STEEL AUTHORITY OF INDIA LIMITED
          </text>

          {/* Dynamic Ocean Wave Vectors */}
          <path d="M0 270 Q 110 250, 220 270 T 440 270 T 660 270 T 880 270" stroke={isLight ? '#0284C7' : '#38BDF8'} strokeWidth="3" strokeDasharray="8 8" />
          <path d="M40 285 Q 150 265, 260 285 T 480 285 T 700 285 T 900 285" stroke={isLight ? '#1D4ED8' : '#2563EB'} strokeWidth="2" strokeDasharray="6 6" />
        </svg>
      </div>

      {/* Secondary Top Left SAIL Ship Watermark Accent */}
      <div className="absolute top-12 -left-16 opacity-20 pointer-events-none w-[600px] h-[200px] hidden lg:block">
        <svg width="100%" height="100%" viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 120 L80 170 L500 170 L560 100 L530 120 Z" fill={isLight ? '#E2E8F0' : '#1E293B'} stroke={isLight ? '#0284C7' : '#38BDF8'} strokeWidth="2" />
          <rect x="420" y="60" width="70" height="60" fill={isLight ? '#CBD5E1' : '#334155'} stroke={isLight ? '#1E3A8A' : '#60A5FA'} strokeWidth="2" />
          <text x="180" y="155" fill={isLight ? '#0369A1' : '#38BDF8'} fontSize="16" fontFamily="sans-serif" fontWeight="900" letterSpacing="5">
            SAIL BULK CARRIER
          </text>
        </svg>
      </div>
    </div>
  );
}
