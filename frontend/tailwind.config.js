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
          950: '#030712',
          900: '#0b1329',
          800: '#1c2541',
          700: '#3a506b',
          600: '#5c768d',
        },
        slate: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          750: '#253248',
          700: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
