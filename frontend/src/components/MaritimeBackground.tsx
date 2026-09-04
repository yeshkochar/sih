import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function MaritimeBackground() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300 ${isLight ? 'bg-[#EBF0F3]' : 'bg-[#070A0D]'}`}>
      {/* Base Canvas */}
      <div className={`absolute inset-0 transition-colors duration-300 ${isLight ? 'bg-[#EBF0F3]' : 'bg-[#070A0D]'}`} />

      {/* Engineering Precision Grid Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${isLight ? 'opacity-[0.06]' : 'opacity-[0.04]'}`}
        style={{
          backgroundImage: isLight
            ? `
              linear-gradient(rgba(27, 37, 44, 0.25) 1px, transparent 1px),
              linear-gradient(90deg, rgba(27, 37, 44, 0.25) 1px, transparent 1px)
            `
            : `
              linear-gradient(rgba(168, 178, 183, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 178, 183, 0.3) 1px, transparent 1px)
            `,
          backgroundSize: '64px 64px'
        }}
      />

      {/* SAIL INDUSTRIAL STEEL & OCEAN MARITIME WATERMARK */}
      <div className={`absolute -bottom-6 -right-10 pointer-events-none w-[920px] h-[330px] max-w-full transition-opacity duration-300 ${isLight ? 'opacity-[0.18]' : 'opacity-[0.22]'}`}>
        <svg width="100%" height="100%" viewBox="0 0 900 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main Hull */}
          <path d="M40 180 L120 270 L780 270 L870 160 L810 180 Z" fill={isLight ? '#CBD5E1' : '#10161B'} stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="2.5" />
          <path d="M120 270 L780 270 L830 220 L100 220 Z" fill={isLight ? '#94A3B8' : '#1B252C'} stroke={isLight ? '#3B7189' : '#3B7189'} strokeWidth="1.5" />
          
          {/* Superstructure & Bridge Tower */}
          <rect x="660" y="90" width="110" height="90" rx="2" fill={isLight ? '#E2E8F0' : '#1B252C'} stroke={isLight ? '#168C8A' : '#A8B2B7'} strokeWidth="2" />
          <rect x="680" y="60" width="70" height="30" rx="2" fill={isLight ? '#CBD5E1' : '#10161B'} stroke={isLight ? '#3B7189' : '#3B7189'} strokeWidth="1.5" />
          <rect x="695" y="30" width="40" height="30" rx="1" fill={isLight ? '#E2E8F0' : '#1B252C'} stroke={isLight ? '#168C8A' : '#A8B2B7'} strokeWidth="1.5" />
          
          {/* Radar Mast & Funnel Tower with Industrial Copper */}
          <line x1="715" y1="5" x2="715" y2="30" stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="3" />
          <line x1="700" y1="12" x2="730" y2="12" stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="2" />
          <rect x="740" y="50" width="22" height="40" fill={isLight ? '#B9783E' : '#B9783E'} stroke={isLight ? '#168C8A' : '#A8B2B7'} strokeWidth="1.5" />
          
          {/* Deck Cargo Hatches */}
          <rect x="150" y="130" width="85" height="50" fill={isLight ? '#CBD5E1' : '#10161B'} stroke={isLight ? '#3B7189' : '#23303A'} strokeWidth="1.5" />
          <rect x="255" y="130" width="85" height="50" fill={isLight ? '#94A3B8' : '#1B252C'} stroke={isLight ? '#3B7189' : '#23303A'} strokeWidth="1.5" />
          <rect x="360" y="130" width="85" height="50" fill={isLight ? '#CBD5E1' : '#10161B'} stroke={isLight ? '#3B7189' : '#23303A'} strokeWidth="1.5" />
          <rect x="465" y="130" width="85" height="50" fill={isLight ? '#94A3B8' : '#1B252C'} stroke={isLight ? '#3B7189' : '#23303A'} strokeWidth="1.5" />
          <rect x="570" y="130" width="75" height="50" fill={isLight ? '#CBD5E1' : '#10161B'} stroke={isLight ? '#3B7189' : '#23303A'} strokeWidth="1.5" />

          {/* Deck Cranes */}
          <line x1="240" y1="100" x2="240" y2="130" stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="2" />
          <line x1="220" y1="100" x2="260" y2="100" stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="1.5" />
          <line x1="450" y1="100" x2="450" y2="130" stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="2" />
          <line x1="430" y1="100" x2="470" y2="100" stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="1.5" />

          {/* SAIL FREIGHT MARITIME TEXT WATERMARK */}
          <text x="310" y="245" fill={isLight ? '#168C8A' : '#A8B2B7'} fontSize="22" fontFamily="sans-serif" fontWeight="900" letterSpacing="6" opacity={isLight ? '0.85' : '0.75'}>
            SAIL FREIGHT MARITIME
          </text>
          <text x="280" y="210" fill={isLight ? '#3B7189' : '#3B7189'} fontSize="13" fontFamily="sans-serif" fontWeight="800" letterSpacing="4" opacity={isLight ? '0.8' : '0.7'}>
            STEEL AUTHORITY OF INDIA LIMITED
          </text>

          {/* Ocean Teal Wave Vectors */}
          <path d="M0 270 Q 110 250, 220 270 T 440 270 T 660 270 T 880 270" stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="2" strokeDasharray="6 6" />
          <path d="M40 285 Q 150 265, 260 285 T 480 285 T 700 285 T 900 285" stroke={isLight ? '#3B7189' : '#3B7189'} strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Secondary Top Left SAIL Ship Watermark Accent */}
      <div className="absolute top-12 -left-16 opacity-15 pointer-events-none w-[600px] h-[200px] hidden lg:block">
        <svg width="100%" height="100%" viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 120 L80 170 L500 170 L560 100 L530 120 Z" fill={isLight ? '#E2E8F0' : '#10161B'} stroke={isLight ? '#168C8A' : '#168C8A'} strokeWidth="1.5" />
          <rect x="420" y="60" width="70" height="60" fill={isLight ? '#CBD5E1' : '#1B252C'} stroke={isLight ? '#3B7189' : '#A8B2B7'} strokeWidth="1.5" />
          <text x="180" y="155" fill={isLight ? '#3B7189' : '#A8B2B7'} fontSize="15" fontFamily="sans-serif" fontWeight="900" letterSpacing="5">
            SAIL BULK CARRIER
          </text>
        </svg>
      </div>
    </div>
  );
}
