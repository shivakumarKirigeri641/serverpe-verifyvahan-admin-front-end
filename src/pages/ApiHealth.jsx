import { api, day, inr } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, StatCard, Table, Empty } from '../components/ui.jsx';

const pct = (ok, calls) => (calls ? Math.round((ok / calls) * 100) : 100);
const when = (t) => new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function ApiHealth() {
  const { data, loading, error, reload } = useAsync(() => api.ulip(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const t = data.totals || {};
  const endpoints = data.byEndpoint || [];
  const failures = (data.recent || []).filter((r) => !r.ok);
  const okRate = pct(t.ok_calls, t.calls);
  const series = data.series || [];
  const maxCalls = Math.max(1, ...series.map((s) => Number(s.calls)));

  return (
    <>
      <PageHead
        title="ULIP / API health"
        sub="Success & failure per ULIP endpoint, with the most recent errors."
        right={<button className="btn-ghost text-sm" onClick={reload}>Refresh</button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total ULIP calls" value={t.calls || 0} />
        <StatCard label="Success rate" value={`${okRate}%`}
          accent={okRate >= 95 ? 'text-ok' : okRate >= 70 ? 'text-warn' : 'text-bad'} />
        <StatCard label="Failures" value={(t.calls || 0) - (t.ok_calls || 0)}
          sub="all-time" accent={(t.calls || 0) - (t.ok_calls || 0) > 0 ? 'text-bad' : 'text-muted'} />
      </div>

      <div className="mt-6 card p-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">ULIP calls · last 14 days</div>
          <div className="text-xs text-muted">{inr(t.cost || 0)} total cost</div>
        </div>
        <div className="mt-4 flex h-32 items-end gap-1.5">
          {series.map((s) => (
            <div key={s.day} className="group flex flex-1 flex-col items-center justify-end"
                 title={`${day(s.day)} · ${s.calls} calls · ${inr(s.cost)}`}>
              <div className="w-full rounded-t bg-brand/85 transition group-hover:bg-brand"
                   style={{ height: `${(Number(s.calls) / maxCalls) * 100}%`, minHeight: Number(s.calls) > 0 ? 4 : 0 }} />
            </div>
          ))}
        </div>
      </div>

      <h3 className="mt-7 mb-2 font-bold text-ink">By endpoint</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {endpoints.length ? endpoints.map((e) => {
          const p = pct(e.ok_calls, e.calls);
          const healthy = e.fail_calls === 0;
          const dead = e.ok_calls === 0 && e.calls > 0;
          const dot = healthy ? 'bg-ok' : dead ? 'bg-bad' : 'bg-warn';
          const tone = healthy ? 'text-ok' : dead ? 'text-bad' : 'text-warn';
          return (
            <div key={e.endpoint} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <span className={`h-2.5 w-2.5 rounded-full ${dot}`} /> {e.endpoint}
                </div>
                <span className={`font-extrabold ${tone}`}>{p}%</span>
              </div>
              <div className="mt-2 text-sm text-muted">
                {e.calls} calls · {e.ok_calls} ok ·{' '}
                <span className={e.fail_calls ? 'font-semibold text-bad' : ''}>{e.fail_calls} failed</span>
              </div>
              {e.last_error && (
                <div className="mt-1 truncate text-xs text-bad" title={e.last_error}>
                  last error: {e.last_error}{e.last_fail ? ` · ${when(e.last_fail)}` : ''}
                </div>
              )}
            </div>
          );
        }) : <Empty>No ULIP calls recorded yet.</Empty>}
      </div>

      <h3 className="mt-7 mb-2 font-bold text-ink">Recent failures</h3>
      {failures.length ? (
        <Table cols={['When', 'Endpoint', 'Vehicle', 'HTTP', 'Error']}>
          {failures.map((r, i) => (
            <tr key={i}>
              <td className="td text-muted">{when(r.created_at)}</td>
              <td className="td font-semibold text-ink">{r.endpoint || r.dataset}</td>
              <td className="td">{r.reg_no || '—'}</td>
              <td className="td">{r.http_status || '—'}</td>
              <td className="td text-bad">{r.error_code || '—'}</td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No failures in the recent calls. 🎉</Empty>}
    </>
  );
}
