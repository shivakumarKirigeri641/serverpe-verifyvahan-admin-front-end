import { api, inr, day, dt } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Section, Pill, Empty } from '../components/ui.jsx';
import { KpiTile, TrendPill, AreaChart, BarChart, Donut, HBars, Panel, CAT } from '../components/charts.jsx';
import { phone } from '../components/ActivityList.jsx';

const num = (n) => Number(n || 0).toLocaleString('en-IN');
const pct = (cur, prev) => {
  cur = Number(cur || 0); prev = Number(prev || 0);
  if (prev === 0) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
};

export default function Analytics() {
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.analytics(), api.analyticsPlus()]).then(([a, p]) => ({ a, p })), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const { a, p } = data;
  const f = a.funnel || {}, w = a.windows || {}, dy = a.daily || {};
  const trend = a.trend || [], states = a.states || [];

  const funnelSteps = [
    { label: 'Site visits', value: f.visits, color: CAT[1] },
    { label: 'WhatsApp taps', value: f.wa_taps, color: CAT[1] },
    { label: 'Users', value: f.users, color: CAT[0] },
    { label: 'Basic reports', value: f.basic_reports, color: CAT[0] },
    { label: 'Paid reports', value: f.paid_reports, color: CAT[2] },
  ];

  return (
    <>
      <PageHead title="Analytics" sub="Funnel, growth, cohorts and engagement."
        right={<button className="btn-sec" onClick={reload}>↻ Refresh</button>} />

      {/* last 7 days vs the 7 before */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Visits · 7d" value={num(w.visits_cur)} sub="vs previous 7d" trend={<TrendPill delta={pct(w.visits_cur, w.visits_prev)} />} />
        <KpiTile label="New users · 7d" value={num(w.users_cur)} sub="vs previous 7d" tone="text-brand" trend={<TrendPill delta={pct(w.users_cur, w.users_prev)} />} />
        <KpiTile label="Reports · 7d" value={num(w.reports_cur)} sub="vs previous 7d" trend={<TrendPill delta={pct(w.reports_cur, w.reports_prev)} />} />
        <KpiTile label="Revenue · 7d" value={inr(w.revenue_cur)} sub="vs previous 7d" tone="text-ok" trend={<TrendPill delta={pct(w.revenue_cur, w.revenue_prev)} />} />
      </div>

      {/* Last 12 weeks activity */}
      <Section title="Activity" sub="Last 12 weeks" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="New users per week" sub="Last 12 weeks">
          <BarChart data={p.activity} xKey="week" yKey="signups" color={CAT[0]} format={num} />
        </Panel>
        <Panel title="Revenue per week" sub="Captured payments">
          <BarChart data={p.activity} xKey="week" yKey="revenue" color="#00A884" format={inr} />
        </Panel>
      </div>

      {/* Funnel + basic vs full */}
      <Section title="Conversion" sub="Visit → paid report" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Conversion funnel" sub="All-time">
          <HBars data={funnelSteps} format={num} />
        </Panel>
        <Panel title="Basic vs full" sub="Reports generated">
          <Donut centerLabel="Reports" format={num}
            segments={[
              { label: 'Basic (free)', value: f.basic_reports, color: '#CA8A04' },
              { label: 'Full (paid)', value: f.paid_reports, color: '#00A884' },
            ]} />
        </Panel>
      </div>

      {/* Enrolled vs paid + signup-week cohorts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Enrolled vs paid" sub="All users vs those who paid">
          <Donut centerLabel="Users" format={num}
            segments={[
              { label: 'Paid', value: f.paid_reports ? Math.min(f.users, f.paid_reports) : 0, color: '#00A884' },
              { label: 'Not yet paid', value: Math.max(0, f.users - (f.paid_reports || 0)), color: '#94A3B8' },
            ]} />
        </Panel>
        <Panel className="lg:col-span-2" title="Signup-week cohorts" sub="How many of each week's signups have paid">
          {p.cohorts.length === 0 ? <Empty>No cohorts yet.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr>{['Signup week', 'Signed up', 'Converted', 'Rate'].map((h) => <th key={h} className="th bg-line/30">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {p.cohorts.map((c, i) => {
                    const rate = c.size ? Math.round((c.converted / c.size) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td className="td font-semibold">{c.cohort}</td>
                        <td className="td nums">{c.size}</td>
                        <td className="td nums">{c.converted}</td>
                        <td className="td"><Pill tone={rate >= 20 ? 'green' : rate > 0 ? 'amber' : 'grey'}>{rate}%</Pill></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Vehicles by class & state */}
      <Section title="Vehicles" sub="What people are checking" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="By vehicle class" sub="From cached RC records">
          {p.byClass.length ? <HBars data={p.byClass.map((r, i) => ({ label: r.name, value: r.n, color: CAT[i % CAT.length] }))} format={num} /> : <Empty>No vehicles yet.</Empty>}
        </Panel>
        <Panel title="By RTO state" sub="From the number plate">
          {p.byState.length ? <HBars data={p.byState.map((r) => ({ label: r.name, value: r.n, color: CAT[0] }))} format={num} /> : <Empty>No vehicles yet.</Empty>}
        </Panel>
      </div>

      {/* Revenue by plan */}
      <Section title="Revenue by plan" sub="Where the money comes from" />
      <Panel>
        {p.revenueByPlan.length ? (
          <HBars data={p.revenueByPlan.map((r, i) => ({ label: `${r.plan_name} · ${r.reports} sold`, value: Number(r.revenue), color: CAT[i % CAT.length] }))} format={inr} />
        ) : <Empty>No paid reports yet.</Empty>}
      </Panel>

      {/* Top states by visits (existing) */}
      {states.length > 0 && (
        <>
          <Section title="Top states by visits" />
          <Panel><HBars data={states.map((s) => ({ label: s.state, value: s.visits, color: CAT[0] }))} format={num} /></Panel>
        </>
      )}

      {/* Engagement table */}
      <Section title="Most engaged users" sub="By spend, then vehicles checked" />
      <Panel className="p-0">
        {p.engagement.length === 0 ? <Empty>No users yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead><tr>{['User', 'Vehicles', 'Paid', 'Spent', 'Last seen'].map((h) => <th key={h} className="th bg-line/30">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {p.engagement.map((u) => (
                  <tr key={u.id} className="hover:bg-brand/[.03]">
                    <td className="td">
                      <div className="font-semibold text-ink">{u.full_name || '—'}</div>
                      <div className="text-xs text-muted nums">{phone(u.wa_id)}</div>
                    </td>
                    <td className="td nums">{u.vehicles}</td>
                    <td className="td nums">{u.paid_reports}</td>
                    <td className="td font-bold nums">{inr(u.spent)}</td>
                    <td className="td whitespace-nowrap text-muted">{u.last_seen_at ? dt(u.last_seen_at) : '—'}</td>
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
