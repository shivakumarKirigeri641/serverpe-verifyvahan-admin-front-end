import { api, inr, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead } from '../components/ui.jsx';
import { KpiTile, TrendPill, AreaChart, HBars, Panel, CAT } from '../components/charts.jsx';

const num = (n) => Number(n || 0).toLocaleString('en-IN');
const pct = (cur, prev) => {
  cur = Number(cur || 0); prev = Number(prev || 0);
  if (prev === 0) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
};

export default function Analytics() {
  const { data, loading, error, reload } = useAsync(() => api.analytics(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const f = data.funnel || {}, w = data.windows || {}, dy = data.daily || {};
  const trend = data.trend || [], states = data.states || [];
  const funnelSteps = [
    { label: 'Site visits', value: f.visits, color: CAT[1] },
    { label: 'WhatsApp taps', value: f.wa_taps, color: CAT[1] },
    { label: 'Users', value: f.users, color: CAT[0] },
    { label: 'Basic reports', value: f.basic_reports, color: CAT[0] },
    { label: 'Paid reports', value: f.paid_reports, color: CAT[2] },
  ];

  return (
    <>
      <PageHead title="Analytics" sub="Funnel, growth and 14-day trends."
        right={<button className="btn-ghost text-sm" onClick={reload}>↻ Refresh</button>} />

      {/* last 7 days vs the 7 before */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Visits · 7d" value={num(w.visits_cur)} sub="vs previous 7d" trend={<TrendPill delta={pct(w.visits_cur, w.visits_prev)} />} />
        <KpiTile label="New users · 7d" value={num(w.users_cur)} sub="vs previous 7d" tone="text-brand" trend={<TrendPill delta={pct(w.users_cur, w.users_prev)} />} />
        <KpiTile label="Reports · 7d" value={num(w.reports_cur)} sub="vs previous 7d" trend={<TrendPill delta={pct(w.reports_cur, w.reports_prev)} />} />
        <KpiTile label="Revenue · 7d" value={inr(w.revenue_cur)} sub="vs previous 7d" tone="text-ok" trend={<TrendPill delta={pct(w.revenue_cur, w.revenue_prev)} />} />
      </div>

      {/* funnel + visits trend */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Conversion funnel" sub="All-time — visit → paid report">
          <HBars data={funnelSteps} format={num} />
        </Panel>
        <Panel title="Site visits" sub="Last 14 days">
          <AreaChart data={trend} xKey="day" yKey="visits" color={CAT[1]} format={num} labelOf={day} />
        </Panel>
      </div>

      {/* totals with today-vs-yesterday */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <KpiTile label="Total users" value={num(f.users)} sub="today vs yesterday" trend={<TrendPill delta={pct(dy.users_today, dy.users_yesterday)} />} />
        <KpiTile label="Total vehicles" value={num(f.vehicles)} sub="today vs yesterday" trend={<TrendPill delta={pct(dy.vehicles_today, dy.vehicles_yesterday)} />} />
        <KpiTile label="Reports today" value={num(dy.reports_today)} sub="today vs yesterday" trend={<TrendPill delta={pct(dy.reports_today, dy.reports_yesterday)} />} />
      </div>

      {/* top states */}
      {states.length > 0 && (
        <Panel className="mt-4" title="Top states by visits">
          <HBars data={states.map((s) => ({ label: s.state, value: s.visits, color: CAT[0] }))} format={num} />
        </Panel>
      )}
    </>
  );
}
