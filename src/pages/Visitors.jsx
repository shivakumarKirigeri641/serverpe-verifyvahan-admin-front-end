import { api, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, StatCard, Empty } from '../components/ui.jsx';

export default function Visitors() {
  const { data, loading, error, reload } = useAsync(() => api.visitors(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { totals, today, series, byState } = data;
  const maxV = Math.max(1, ...series.map((s) => s.visits));

  return (
    <>
      <PageHead title="Visitors" sub="Who reached the marketing site, and who tapped WhatsApp." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visits" value={totals.visits} sub={`${today.visits} today`} accent="text-brand" />
        <StatCard label="Unique visitors" value={totals.uniques} sub={`${today.uniques} today`} />
        <StatCard label="WhatsApp taps" value={totals.wa_clicks} sub={`${today.wa_clicks} today`} accent="text-ok" />
        <StatCard label="Tap rate" value={totals.visits ? Math.round((totals.wa_clicks / totals.visits) * 100) + '%' : '—'} sub="taps ÷ visits" />
      </div>

      <div className="mt-6 card p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Visits · last 14 days</div>
        <div className="mt-4 flex h-40 items-end gap-1.5">
          {series.map((s) => (
            <div key={s.day} className="group flex flex-1 flex-col items-center justify-end gap-1.5" title={`${day(s.day)} · ${s.visits} visits · ${s.wa_clicks} taps`}>
              <div className="w-full rounded-t bg-brand/85 group-hover:bg-brand" style={{ height: `${(s.visits / maxV) * 100}%`, minHeight: s.visits > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-muted">{day(s.day).split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-muted">By state</h2>
      {byState.length === 0 ? <Empty>No visits recorded yet.</Empty> : (
        <div className="card divide-y divide-line">
          {byState.map((s) => (
            <div key={s.state} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-semibold text-ink">{s.state}</span>
              <span className="text-muted">{s.visits}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
