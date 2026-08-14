import { api, inr, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, StatCard, Table, Badge, Empty } from '../components/ui.jsx';

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => api.dashboard(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const d = data.data;
  const maxRev = Math.max(1, ...d.series.map((s) => Number(s.revenue)));

  return (
    <>
      <PageHead title="Dashboard" sub="Live view of revenue, reports and support." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (captured)" value={inr(d.revenue)} sub={`${d.payments} payments`} accent="text-brand" />
        <StatCard label="ULIP cost" value={inr(d.ulip_cost)} sub={`${d.ulip_calls} calls · ${inr(d.ulip_cost_today)} today`} accent={d.ulip_cost > 0 ? 'text-warn' : 'text-muted'} />
        <StatCard label="Net margin" value={inr(d.net)} sub="Revenue − ULIP cost" accent={d.net >= 0 ? 'text-ok' : 'text-bad'} />
        <StatCard label="Today" value={inr(d.revenue_today)} sub={`${d.payments_today} paid · ${d.reports_today} reports · ${d.users_today} new`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Full reports" value={d.full_reports} sub={`${d.vehicles} vehicles cached`} />
        <StatCard label="Users" value={d.users} sub={`${d.users_today} joined today`} />
        <StatCard label="Open tickets" value={d.open_tickets} accent={d.open_tickets ? 'text-warn' : 'text-ink'} />
        <StatCard label="ULIP calls today" value={d.ulip_calls_today} sub="VAHAN · eChallan · FASTag" />
      </div>

      <div className="mt-6 card p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Revenue · last 14 days</div>
        <div className="mt-4 flex h-40 items-end gap-1.5">
          {d.series.map((s) => (
            <div key={s.day} className="group flex flex-1 flex-col items-center justify-end gap-1.5" title={`${day(s.day)} · ${inr(s.revenue)}`}>
              <div className="w-full rounded-t bg-brand/85 transition group-hover:bg-brand"
                   style={{ height: `${(Number(s.revenue) / maxRev) * 100}%`, minHeight: Number(s.revenue) > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-muted">{day(s.day).split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-muted">Recent payments</h2>
      {d.recent.length === 0 ? <Empty>No payments yet.</Empty> : (
        <Table cols={['Customer', 'Amount', 'Method', 'Status', 'When']}>
          {d.recent.map((p) => (
            <tr key={p.id}>
              <td className="td font-semibold text-ink">{p.full_name || p.profile_name || p.wa_id || '—'}</td>
              <td className="td font-bold">{inr(p.amount)}</td>
              <td className="td uppercase">{p.method || '—'}</td>
              <td className="td"><Badge value={p.status} /></td>
              <td className="td text-muted">{dt(p.paid_at || p.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
