/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0c10', // Darker background
        fg: '#e2e8f0', // Lighter text
        muted: '#94a3b8',
        card: '#1e293b', // Slate-800
        accent: '#38bdf8', // Sky-400
        line: '#34d399', // Emerald-400
        'line-intra': '#fbbf24', // Amber-400
        border: '#334155', // Slate-700
        panel: '#0f172a', // Slate-900
        'primary-color': '#38bdf8',
      },
      animation: {
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
