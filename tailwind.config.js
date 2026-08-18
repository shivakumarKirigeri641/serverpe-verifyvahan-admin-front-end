/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#075E54', light: '#13B48F', accent: '#00A884', deep: '#053F38' },
        blue: { DEFAULT: '#2563EB', soft: '#EFF6FF' },
        ink: '#0F172A', body: '#334155', muted: '#64748B', line: '#E2E8F0',
        panel: '#F6F8F9', ok: '#16A34A', warn: '#B45309', bad: '#DC2626',
        // Validated categorical ramp for charts (CVD-safe; see dataviz validator).
        // Used in fixed order, never cycled; always with a legend + direct labels.
        cat: { 1: '#00A884', 2: '#2563EB', 3: '#DB2777', 4: '#CA8A04' },
      },
      fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,.04), 0 8px 30px rgba(15,23,42,.06)',
        card: '0 1px 3px rgba(16,24,40,.06), 0 6px 20px rgba(16,24,40,.06)',
        lift: '0 2px 4px rgba(16,24,40,.05), 0 12px 32px rgba(16,24,40,.10)',
      },
    },
  },
  plugins: [],
};
