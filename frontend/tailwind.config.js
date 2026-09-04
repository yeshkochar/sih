/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070C14', // Canvas deep background
          900: '#0B121E', // Panel base
          850: '#111A2C', // Card background surface
          800: '#16233B', // Border / elevated surface
          700: '#1F3152', // Soft border / hover surface
          600: '#2A436C', // Muted accent border
          500: '#3B82F6', // Primary Blue accent
          400: '#60A5FA', // Sky Blue text highlight
        },
        slate: {
          950: '#090E17',
          900: '#0F172A',
          850: '#152035',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50:  '#F8FAFC',
        },
        sail: {
          copper: '#D97706',
          amber: '#F59E0B',
          teal: '#06B6D4',
          cyan: '#38BDF8',
          emerald: '#10B981',
          rose: '#F43F5E',
        }
      },
      boxShadow: {
        'navy-card': '0 4px 20px -2px rgba(7, 12, 20, 0.5), 0 1px 2px -1px rgba(7, 12, 20, 0.4)',
        'navy-card-hover': '0 12px 32px -4px rgba(7, 12, 20, 0.7), 0 0 0 1px rgba(59, 130, 246, 0.25)',
        'navy-pill': '0 2px 10px rgba(29, 78, 216, 0.35)',
        'glow-cyan': '0 0 20px rgba(56, 189, 248, 0.25)',
        'glow-blue': '0 0 25px rgba(59, 130, 246, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shipFloat: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-6px) translateX(12px)' },
        },
        waveDrift: {
          '0%': { transform: 'translateX(0px)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBeacon: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.4)', opacity: '0.4' },
        }
      },
      animation: {
        'radar-sweep': 'radarSweep 12s linear infinite',
        'ship-float': 'shipFloat 8s ease-in-out infinite',
        'wave-drift': 'waveDrift 20s linear infinite',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-beacon': 'pulseBeacon 2.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
