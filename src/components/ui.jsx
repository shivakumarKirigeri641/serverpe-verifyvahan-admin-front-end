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
