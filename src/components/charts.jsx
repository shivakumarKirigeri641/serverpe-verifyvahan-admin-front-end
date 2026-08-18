import { useState } from 'react';

/**
 * On-brand, dependency-free SVG charts for the admin panel.
 * Palette: brand teal is the primary/sequential hue; the `cat` ramp (teal/blue/
 * rose/gold, CVD-validated) is for categorical series — always with a legend +
 * direct labels. Status colours (ok/warn/bad) are reserved for state, never series.
 */

export const CAT = ['#00A884', '#2563EB', '#DB2777', '#CA8A04'];

/* ── Trend pill: a signed delta with an up/down arrow, coloured by direction ── */
export function TrendPill({ delta, suffix = '%', goodUp = true }) {
  if (delta == null || !isFinite(delta)) return null;
  const flat = Math.abs(delta) < 0.5;
  const up = delta > 0;
  const good = flat ? null : (up === goodUp);
  const cls = flat ? 'bg-line/70 text-muted' : good ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad';
  return (
    <span className={`chip nums ${cls}`}>
      {flat ? '→' : up ? '▲' : '▼'} {Math.abs(Math.round(delta))}{suffix}
    </span>
  );
}

/* ── KPI tile: eyebrow label, big value, sub-line, optional trend + sparkline ── */
export function KpiTile({ label, value, sub, tone = 'text-ink', trend, spark, sparkColor = '#00A884', icon }) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow flex items-center gap-1.5">{icon}{label}</div>
        {trend}
      </div>
      <div className={`mt-1.5 text-[26px] font-black leading-none nums ${tone}`}>{value}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        {sub && <div className="text-xs text-muted">{sub}</div>}
        {spark && <Sparkline data={spark} color={sparkColor} className="ml-auto h-7 w-20" />}
      </div>
    </div>
  );
}

/* ── Sparkline: tiny trend line, no axes ── */
export function Sparkline({ data = [], color = '#00A884', className = 'h-8 w-24' }) {
  const vals = data.map(Number);
  if (vals.length < 2) return <svg className={className} />;
  const max = Math.max(...vals), min = Math.min(...vals);
  const span = max - min || 1;
  const W = 100, H = 32, pad = 2;
  const pts = vals.map((v, i) => [
    pad + (i / (vals.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / span) * (H - pad * 2),
  ]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

/* ── Area chart: single series over time, gradient fill, hover crosshair+tooltip ── */
export function AreaChart({ data = [], xKey, yKey, height = 190, color = '#00A884', format = (v) => v, labelOf }) {
  const [hi, setHi] = useState(null);
  const vals = data.map((d) => Number(d[yKey]) || 0);
  const max = Math.max(1, ...vals);
  const W = 640, H = height, padL = 8, padR = 8, padT = 12, padB = 22;
  const iw = W - padL - padR, ih = H - padT - padB;
  const n = data.length;
  const x = (i) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => padT + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)},${padT + ih} L${x(0).toFixed(1)},${padT + ih} Z`;
  const gid = `ga-${xKey}-${yKey}`;
  const ticks = [0, 0.5, 1].map((t) => padT + ih - t * ih);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} onMouseLeave={() => setHi(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((ty, i) => <line key={i} x1={padL} x2={W - padR} y1={ty} y2={ty} stroke="#E2E8F0" strokeWidth="1" strokeDasharray={i === 2 ? '' : '3 4'} />)}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hi != null && (
          <>
            <line x1={x(hi)} x2={x(hi)} y1={padT} y2={padT + ih} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={x(hi)} cy={y(vals[hi])} r="4" fill="#fff" stroke={color} strokeWidth="2" />
          </>
        )}
        {/* hover hit-areas */}
        {data.map((d, i) => (
          <rect key={i} x={x(i) - iw / n / 2} y={padT} width={iw / n} height={ih} fill="transparent" onMouseEnter={() => setHi(i)} />
        ))}
        {data.map((d, i) => (n <= 10 || i % Math.ceil(n / 8) === 0) && (
          <text key={`t${i}`} x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
            {(labelOf ? labelOf(d[xKey]) : String(d[xKey])).split(' ')[0]}
          </text>
        ))}
      </svg>
      {hi != null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-center shadow-lift"
             style={{ left: `${(x(hi) / W) * 100}%`, top: 0 }}>
          <div className="text-[10px] font-semibold text-white/70">{labelOf ? labelOf(data[hi][xKey]) : String(data[hi][xKey])}</div>
          <div className="text-xs font-bold text-white nums">{format(vals[hi])}</div>
        </div>
      )}
    </div>
  );
}

/* ── Bar chart: vertical bars, rounded tops, gridlines, hover tooltip ── */
export function BarChart({ data = [], xKey, yKey, height = 190, color = '#00A884', format = (v) => v, labelOf }) {
  const [hi, setHi] = useState(null);
  const vals = data.map((d) => Number(d[yKey]) || 0);
  const max = Math.max(1, ...vals);
  const n = data.length;
  const plotH = height - 22;   // leave room for x labels
  return (
    <div className="relative" onMouseLeave={() => setHi(null)}>
      {/* horizontal gridlines behind the bars */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: plotH }}>
        {[0, 0.5, 1].map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-dashed border-line"
               style={{ top: `${t * 100}%`, borderStyle: t === 1 ? 'solid' : 'dashed' }} />
        ))}
      </div>
      <div className="relative flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1.5" onMouseEnter={() => setHi(i)}>
            <div className="w-full rounded-t-md transition-all"
                 style={{ height: `${(vals[i] / max) * plotH}px`, minHeight: vals[i] > 0 ? 3 : 0,
                          background: hi === i ? color : `${color}d9` }} />
            <span className="text-[9px] text-muted">{(labelOf ? labelOf(d[xKey]) : String(d[xKey])).split(' ')[0]}</span>
          </div>
        ))}
      </div>
      {hi != null && (
        <div className="pointer-events-none absolute -top-1 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-center shadow-lift"
             style={{ left: `${((hi + 0.5) / n) * 100}%` }}>
          <div className="text-[10px] font-semibold text-white/70">{labelOf ? labelOf(data[hi][xKey]) : String(data[hi][xKey])}</div>
          <div className="text-xs font-bold text-white nums">{format(vals[hi])}</div>
        </div>
      )}
    </div>
  );
}

/* ── Donut: composition of a whole, with a centre total and a legend ── */
export function Donut({ segments = [], size = 168, thickness = 22, format = (v) => v, centerLabel = 'Total' }) {
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const denom = total || 1;   // divide-by-zero guard for arc fractions only (never displayed)
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F4" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = (Number(s.value) || 0) / denom;
          const dash = frac * C;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness} strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc * C} />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="min-w-0">
        <div className="rotate-0">
          <div className="eyebrow">{centerLabel}</div>
          <div className="text-2xl font-black text-ink nums">{format(total)}</div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {segments.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="text-body">{s.label}</span>
              <span className="ml-auto font-bold text-ink nums">{format(s.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Horizontal funnel/bars: labelled rows with a proportional fill ── */
export function HBars({ data = [], format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-body">{d.label}</span>
            <span className="font-bold text-ink nums">{format(d.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line/60">
            <div className="h-full rounded-full" style={{ width: `${((Number(d.value) || 0) / max) * 100}%`, background: d.color || CAT[i % CAT.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Section header: a labelled divider that groups a page into sections ── */
export function SectionHeader({ title, sub, right, className = '' }) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-3 border-b border-line pb-2 ${className}`}>
      <div>
        <div className="text-[13px] font-bold uppercase tracking-[.06em] text-ink">{title}</div>
        {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* ── Panel: a titled chart/section card ── */
export function Panel({ title, sub, right, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <div className="text-sm font-bold text-ink">{title}</div>}
            {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
