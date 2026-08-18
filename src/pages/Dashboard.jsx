import { api, inr, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Badge, Empty } from '../components/ui.jsx';
import { KpiTile, TrendPill, AreaChart, Donut, Panel, SectionHeader } from '../components/charts.jsx';

const inrK = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(v >= 1e6 ? 0 : 1) + 'L';
  if (v >= 1e3) return '₹' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + 'k';
  return '₹' + v.toFixed(0);
};

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => api.dashboard(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const d = data.data;

  const rev = d.series.map((s) => Number(s.revenue) || 0);
  const last7 = rev.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = rev.slice(-14, -7).reduce((a, b) => a + b, 0);
  const revDelta = prev7 ? ((last7 - prev7) / prev7) * 100 : (last7 > 0 ? 100 : null);
  const marginPct = d.revenue > 0 ? Math.round((d.net / d.revenue) * 100) : null;

  return (
    <>
      <PageHead
        title="Dashboard"
        sub="Live revenue, reports and support at a glance."
        right={<button onClick={reload} className="btn-ghost text-sm">↻ Refresh</button>} />

      {/* Headline KPIs */}
      <SectionHeader title="Money" sub="Revenue, margin and cost" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Revenue captured" value={inr(d.revenue)} sub={`${d.payments} payments`}
          tone="text-brand" trend={<TrendPill delta={revDelta} />} spark={rev} />
        <KpiTile label="Net margin" value={inr(d.net)} sub={marginPct != null ? `${marginPct}% of revenue` : 'Revenue − ULIP cost'}
          tone={d.net >= 0 ? 'text-ok' : 'text-bad'} />
        <KpiTile label="ULIP cost" value={inr(d.ulip_cost)} sub={`${d.ulip_calls} calls · ${inr(d.ulip_cost_today)} today`}
          tone={d.ulip_cost > 0 ? 'text-warn' : 'text-muted'} />
        <KpiTile label="Today" value={inr(d.revenue_today)}
          sub={`${d.payments_today} paid · ${d.reports_today} reports · ${d.users_today} new`} />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Revenue" sub="Captured payments · last 14 days"
          right={<TrendPill delta={revDelta} />}>
          <AreaChart data={d.series} xKey="day" yKey="revenue" format={inr} labelOf={day} />
        </Panel>
        <Panel title="Where revenue goes" sub="Cost of data vs. profit">
          <Donut centerLabel="Revenue" format={inrK}
            segments={[
              { label: 'Net margin', value: Math.max(0, d.net), color: '#00A884' },
              { label: 'ULIP cost', value: d.ulip_cost, color: '#2563EB' },
            ]} />
        </Panel>
      </div>

      {/* Secondary KPIs */}
      <SectionHeader className="mt-8" title="Operations" sub="Reports, users and support" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Full reports" value={d.full_reports} sub={`${d.vehicles} vehicles cached`} />
        <KpiTile label="Users" value={d.users} sub={`${d.users_today} joined today`} />
        <KpiTile label="Open tickets" value={d.open_tickets} tone={d.open_tickets ? 'text-warn' : 'text-ink'}
          sub={d.open_tickets ? 'Awaiting reply' : 'All clear'} />
        <KpiTile label="ULIP calls today" value={d.ulip_calls_today} sub="VAHAN · eChallan · FASTag" />
      </div>

      {/* Recent payments */}
      <Panel className="mt-6" title="Recent payments" sub="Latest captured transactions">
        {d.recent.length === 0 ? <Empty>No payments yet.</Empty> : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="tbl w-full min-w-[560px]">
              <thead className="border-y border-line bg-panel">
                <tr>{['Customer', 'Amount', 'Method', 'Status', 'When'].map((c) => <th key={c} className="th">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {d.recent.map((p) => (
                  <tr key={p.id}>
                    <td className="td font-semibold text-ink">{p.full_name || p.profile_name || p.wa_id || '—'}</td>
                    <td className="td font-bold nums">{inr(p.amount)}</td>
                    <td className="td uppercase text-muted">{p.method || '—'}</td>
                    <td className="td"><Badge value={p.status} /></td>
                    <td className="td text-muted">{dt(p.paid_at || p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
