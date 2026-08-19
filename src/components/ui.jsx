import { useEffect, useState, useCallback } from 'react';

/* Tiny data-fetch hook: { data, loading, error, reload }. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const run = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then((d) => alive && setState({ data: d, loading: false, error: null }))
        .catch((e) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(run, [run]);
  return { ...state, reload: run };
}

export const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-brand" />
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="rounded-xl border border-bad/30 bg-bad/5 p-4 text-sm text-bad">
    {message} {onRetry && <button className="ml-2 font-bold underline" onClick={onRetry}>Retry</button>}
  </div>
);

export const Empty = ({ children = 'Nothing here yet.' }) => (
  <div className="py-16 text-center text-sm text-muted">{children}</div>
);

export const PageHead = ({ title, sub, right }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {right}
  </div>
);

export const StatCard = ({ label, value, sub, accent }) => (
  <div className="card p-5">
    <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
    <div className={`mt-1.5 text-3xl font-black ${accent || 'text-ink'}`}>{value}</div>
    {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
  </div>
);

const TONES = {
  OPEN: 'bg-blue-soft text-blue', IN_PROGRESS: 'bg-warn/10 text-warn',
  RESOLVED: 'bg-ok/10 text-ok', CLOSED: 'bg-line text-muted',
  captured: 'bg-ok/10 text-ok', created: 'bg-line text-muted', failed: 'bg-bad/10 text-bad',
  FULL: 'bg-brand/10 text-brand', BASIC: 'bg-line text-muted', GENERATED: 'bg-ok/10 text-ok', EXPIRED: 'bg-warn/10 text-warn',
};
export const Badge = ({ value }) => (
  <span className={`chip ${TONES[value] || 'bg-line text-muted'}`}>{String(value || '—').replace('_', ' ')}</span>
);

export const Table = ({ cols, children }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-line bg-panel"><tr>{cols.map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  </div>
);

/* ───────────────────────────────────────────────────────────────────────────
   QuizPe-parity primitives — the shared look the rebuilt sections use.
   Kept alongside the originals above so existing pages keep working.
   ─────────────────────────────────────────────────────────────────────────── */

export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/* Page header with title, subtitle and optional right-aligned actions. */
export const Page = ({ title, subtitle, actions, children }) => (
  <>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-brand sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
    {children}
  </>
);

/* Headline number with an optional period-over-period delta pill. */
export function Stat({ label, value, delta, sub, tone = 'brand', icon }) {
  const flat = delta === 0 || delta === undefined || delta === null || !isFinite(delta);
  const up = delta > 0;
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
        {icon}{label}
      </div>
      <div className={`mt-1 text-3xl font-extrabold nums ${tone === 'brand' ? 'text-brand' : 'text-ink'}`}>{value}</div>
      <div className="mt-1.5 flex items-center gap-2">
        {!flat && (
          <span className={`pill ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {up ? '▲' : '▼'} {Math.abs(Math.round(delta))}%
          </span>
        )}
        {sub && <span className="text-[11px] text-muted">{sub}</span>}
      </div>
    </div>
  );
}

const PILL_TONES = {
  green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700',
  purple: 'bg-violet-50 text-violet-700', grey: 'bg-line/60 text-muted',
};
export const Pill = ({ tone = 'grey', children }) => (
  <span className={`pill ${PILL_TONES[tone] || PILL_TONES.grey}`}>{children}</span>
);

/* QuizPe-style scrollable table (head labels + rows + empty state). */
export const DataTable = ({ head, children, empty }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead><tr>{head.map((h) => <th key={h} className="th bg-line/30 whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
    {empty && <div className="p-8 text-center text-sm text-muted">{empty}</div>}
  </div>
);

/* Titled section divider — groups a long page into labelled sections. */
export const Section = ({ title, sub, right, className = '' }) => (
  <div className={`mb-3 mt-8 flex items-end justify-between gap-3 border-b border-line pb-2 first:mt-0 ${className}`}>
    <div>
      <div className="text-[13px] font-bold uppercase tracking-[.06em] text-ink">{title}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
    {right}
  </div>
);
