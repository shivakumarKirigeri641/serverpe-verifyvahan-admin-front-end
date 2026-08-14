/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#075E54', light: '#0A9E8E', accent: '#00A884', deep: '#053F38' },
        blue: { DEFAULT: '#2563EB', soft: '#EFF6FF' },
        ink: '#0F172A', body: '#334155', muted: '#64748B', line: '#E2E8F0',
        panel: '#F6F8F9', ok: '#16A34A', warn: '#B45309', bad: '#DC2626',
      },
      fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] },
      boxShadow: { soft: '0 1px 2px rgba(15,23,42,.04), 0 8px 30px rgba(15,23,42,.06)' },
    },
  },
  plugins: [],
};
