/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        knx: {
          bg: '#0a0e1a',
          surface: '#111827',
          card: '#1a2236',
          border: '#2a3451',
          accent: '#3b82f6',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-on': 'glow-on 2s ease-in-out infinite alternate',
        'glow-off': 'glow-off 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-on': {
          '0%': { boxShadow: '0 0 4px 1px rgba(34,197,94,0.3)' },
          '100%': { boxShadow: '0 0 12px 3px rgba(34,197,94,0.6)' },
        },
        'glow-off': {
          '0%': { boxShadow: '0 0 4px 1px rgba(239,68,68,0.2)' },
          '100%': { boxShadow: '0 0 8px 2px rgba(239,68,68,0.4)' },
        },
      },
    },
  },
  plugins: [],
};
