import { api, inr, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead } from '../components/ui.jsx';

const num = (n) => Number(n || 0).toLocaleString('en-IN');
const delta = (cur, prev) => {
  cur = Number(cur || 0); prev = Number(prev || 0);
  if (prev === 0) return { txt: cur > 0 ? '▲ new' : '—', tone: cur > 0 ? 'text-ok' : 'text-muted' };
  const p = Math.round(((cur - prev) / prev) * 100);
  return { txt: `${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%`, tone: p >= 0 ? 'text-ok' : 'text-bad' };
};

function Metric({ label, value, cur, prev, note = 'vs prev' }) {
  const d = delta(cur, prev);
  return (
    <div className="card p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-ink">{value}</div>
      <div className={`mt-0.5 text-xs font-semibold ${d.tone}`}>{d.txt} <span className="font-normal text-muted">{note}</span></div>
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-brand/80' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 truncate text-sm text-body">{label}</div>
      <div className="h-6 flex-1 overflow-hidden rounded-md bg-panel">
        <div className={`h-full rounded-md ${color}`} style={{ width: `${(Number(value || 0) / max) * 100}%`, minWidth: Number(value || 0) > 0 ? 6 : 0 }} />
      </div>
      <div className="w-14 shrink-0 text-right text-sm font-bold text-ink">{num(value)}</div>
    </div>
  );
}

export default function Analytics() {
  const { data, loading, error, reload } = useAsync(() => api.analytics(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const f = data.funnel || {}, w = data.windows || {}, dy = data.daily || {};
  const trend = data.trend || [], states = data.states || [];
  const maxVisits = Math.max(1, ...trend.map((t) => Number(t.visits)));
  const maxState = Math.max(1, ...states.map((s) => Number(s.visits)));
  const steps = [
    ['Site visits', f.visits], ['WhatsApp taps', f.wa_taps], ['Users', f.users],
    ['Basic reports', f.basic_reports], ['Paid reports', f.paid_reports],
  ];
  const funnelMax = Math.max(1, ...steps.map((s) => Number(s[1] || 0)));

  return (
    <>
      <PageHead title="Analytics" sub="Funnel, daily growth and 14-day trends."
        right={<button className="btn-ghost text-sm" onClick={reload}>Refresh</button>} />

      {/* last 7 days vs the 7 before */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Visits · 7d" value={num(w.visits_cur)} cur={w.visits_cur} prev={w.visits_prev} />
        <Metric label="New users · 7d" value={num(w.users_cur)} cur={w.users_cur} prev={w.users_prev} />
        <Metric label="Reports · 7d" value={num(w.reports_cur)} cur={w.reports_cur} prev={w.reports_prev} />
        <Metric label="Revenue · 7d" value={inr(w.revenue_cur)} cur={w.revenue_cur} prev={w.revenue_prev} />
      </div>

      {/* totals with today-vs-yesterday deltas */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Metric label="Total users" value={num(f.users)} cur={dy.users_today} prev={dy.users_yesterday} note="today vs yesterday" />
        <Metric label="Total vehicles" value={num(f.vehicles)} cur={dy.vehicles_today} prev={dy.vehicles_yesterday} note="today vs yesterday" />
        <Metric label="Reports today" value={num(dy.reports_today)} cur={dy.reports_today} prev={dy.reports_yesterday} note="today vs yesterday" />
      </div>

      {/* funnel */}
      <div className="mt-6 card p-5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">Conversion funnel (all-time)</div>
        <div className="space-y-2">
          {steps.map(([label, val]) => <BarRow key={label} label={label} value={val} max={funnelMax} />)}
        </div>
      </div>

      {/* 14-day visits trend */}
      <div className="mt-6 card p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Site visits · last 14 days</div>
        <div className="mt-4 flex h-36 items-end gap-1.5">
          {trend.map((t) => (
            <div key={t.day} className="group flex flex-1 flex-col items-center justify-end"
              title={`${day(t.day)} · ${t.visits} visits · ${t.users} users · ${inr(t.revenue)}`}>
              <div className="w-full rounded-t bg-brand/85 transition group-hover:bg-brand"
                style={{ height: `${(Number(t.visits) / maxVisits) * 100}%`, minHeight: Number(t.visits) > 0 ? 4 : 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* top states */}
      {states.length > 0 && (
        <div className="mt-6 card p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">Top states by visits</div>
          <div className="space-y-2">
            {states.map((s) => <BarRow key={s.state} label={s.state} value={s.visits} max={maxState} color="bg-brand-accent/80" />)}
          </div>
        </div>
      )}
    </>
  );
}
