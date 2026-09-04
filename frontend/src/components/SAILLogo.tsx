import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface SAILLogoProps {
  compact?: boolean;
}

export default function SAILLogo({ compact = false }: SAILLogoProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Authentic SAIL Steel Ingot & Maritime Wave Emblem Icon */}
      <div className={`relative h-10 w-10 rounded-md flex items-center justify-center border shadow-md transition-all duration-300 ${
        isLight 
          ? 'bg-[#1B252C] border-[#2C3E4C] text-[#EDF1F0]' 
          : 'bg-[#10161B] border-[#23303A] text-[#168C8A]'
      }`}>
        <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Steel Ingot Hexagonal Geometric Core */}
          <path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" 
                fill={isLight ? '#1B252C' : '#1B252C'} 
                stroke={isLight ? '#168C8A' : '#168C8A'} 
                strokeWidth="2.5" />
          
          {/* Internal Steel Beam Triangles */}
          <path d="M20 4 L20 36" stroke={isLight ? '#3B7189' : '#3B7189'} strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M6 12 L34 28" stroke={isLight ? '#3B7189' : '#3B7189'} strokeWidth="1.5" />
          <path d="M34 12 L6 28" stroke={isLight ? '#3B7189' : '#3B7189'} strokeWidth="1.5" />

          {/* Central Maritime Wave & Copper Ingot Vector */}
          <path d="M12 20 Q 16 16, 20 20 T 28 20" 
                stroke={isLight ? '#EDF1F0' : '#168C8A'} 
                strokeWidth="2.5" 
                strokeLinecap="round" />
          <circle cx="20" cy="20" r="3" fill={isLight ? '#B9783E' : '#B9783E'} />
        </svg>
      </div>

      {/* Brand Text Block */}
      {!compact && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-sm leading-none ${
              isLight ? 'text-slate-900' : 'text-[#EDF1F0]'
            }`}>
              SAIL
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#122B3A] border border-[#168C8A]/40 text-[#168C8A] font-mono">
              FREIGHT
            </span>
          </div>
          <span className={`text-[8.5px] font-bold tracking-widest uppercase truncate mt-0.5 ${
            isLight ? 'text-slate-500' : 'text-[#A8B2B7]'
          }`}>
            STEEL AUTHORITY OF INDIA LIMITED
          </span>
        </div>
      )}
    </div>
  );
}
