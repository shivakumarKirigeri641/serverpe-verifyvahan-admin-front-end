import { api, inr, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, Empty } from '../components/ui.jsx';
import { Stat, Pill, Section } from '../components/ui.jsx';
import { KpiTile, TrendPill, AreaChart, Donut, HBars, Panel } from '../components/charts.jsx';

/* +91 98765 43210 from a raw wa_id / mobile. */
const phone = (v) => {
  if (!v) return '';
  const d = String(v).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return d ? `+${d}` : '';
};
const pct = (now, was) => (was ? Math.round(((now - was) / was) * 100) : now > 0 ? 100 : 0);
const inrK = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(v >= 1e6 ? 0 : 1) + 'L';
  if (v >= 1e3) return '₹' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + 'k';
  return '₹' + v.toFixed(0);
};

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.dashboard(), api.dashboardPlus(), api.analytics(), api.series(30)])
      .then(([d, plus, a, s]) => ({ d: d.data, plus, a, series: s.rows })), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const { d, plus, a, series } = data;
  const dl = a.daily;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Working late';

  const revToday = Number(plus.today.rev_today) || 0;
  const revYest = Number(plus.today.rev_yest) || 0;
  const revDelta = pct(revToday, revYest);
  const conv = plus.cohort.paying + plus.cohort.trial
    ? Math.round((plus.cohort.paying / (plus.cohort.paying + plus.cohort.trial)) * 100) : 0;
  const curious = Math.max(0, plus.cohort.total - plus.cohort.paying - plus.cohort.trial);

  const wins = [];
  if (revToday > 0) wins.push(`${inr(revToday)} earned today from ${plus.today.payers_today} customer${plus.today.payers_today === 1 ? '' : 's'} 🎉`);
  if (dl.users_today > 0) wins.push(`${dl.users_today} new user${dl.users_today === 1 ? '' : 's'} joined today 👋`);
  if (dl.vehicles_today > 0) wins.push(`${dl.vehicles_today} vehicle${dl.vehicles_today === 1 ? '' : 's'} checked today 🚗`);
  const lifeRev = Number(plus.lifetime.revenue_total) || 0;
  [1000, 5000, 10000, 25000, 50000, 100000].forEach((m) => {
    if (lifeRev >= m && lifeRev - revToday < m) wins.push(`Crossed ${inr(m)} in lifetime revenue 🏆`);
  });

  return (
    <>
      {/* greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">{greet} 👋</h1>
        <p className="mt-1 text-sm text-body">
          Yesterday <b className="text-ink">{dl.users_yesterday}</b> new user{dl.users_yesterday === 1 ? '' : 's'} checked{' '}
          <b className="text-ink">{dl.vehicles_yesterday}</b> vehicle{dl.vehicles_yesterday === 1 ? '' : 's'}.
          {' '}Today <b className="text-brand">{inr(revToday)}</b> from{' '}
          <b className="text-ink">{plus.today.payers_today}</b> customer{plus.today.payers_today === 1 ? '' : 's'}{' '}
          <span className={revDelta >= 0 ? 'text-ok' : 'text-bad'}>({revDelta >= 0 ? '▲' : '▼'} {Math.abs(revDelta)}% vs yesterday)</span>.
        </p>
        <div className="mt-3"><button onClick={reload} className="btn-sec">↻ Refresh</button></div>
      </div>

      {/* Section 3 — today's cards with deltas */}
      <Section title="Today" sub="Compared with yesterday" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Users today" value={dl.users_today} delta={pct(dl.users_today, dl.users_yesterday)} sub={`vs ${dl.users_yesterday} yesterday`} tone="ink" />
        <Stat label="Vehicles today" value={dl.vehicles_today} delta={pct(dl.vehicles_today, dl.vehicles_yesterday)} sub={`vs ${dl.vehicles_yesterday} yesterday`} tone="ink" />
        <Stat label="Revenue today" value={inr(revToday)} delta={revDelta} sub={`vs ${inr(revYest)} yesterday`} />
        <Stat label="Open tickets" value={d.open_tickets} sub={d.open_tickets ? 'needs attention' : 'all clear'} tone="ink" />
      </div>

      {/* Section 4 — cohort health */}
      <Section title="Cohort health" sub="Where everyone who signed up stands today" />
      <Panel>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <HBars format={(v) => v}
            data={[
              { label: 'Paying (bought a full report)', value: plus.cohort.paying, color: '#00A884' },
              { label: 'On trial (basic only)', value: plus.cohort.trial, color: '#CA8A04' },
              { label: 'Just visited', value: curious, color: '#94A3B8' },
            ]} />
          <div className="flex flex-col justify-center rounded-xl bg-panel p-5 text-center">
            <div className="eyebrow">Trial → paid conversion</div>
            <div className="mt-1 text-5xl font-black text-brand-accent nums">{conv}%</div>
            <p className="mt-1 text-xs text-muted">{plus.cohort.paying} of {plus.cohort.paying + plus.cohort.trial} who tried have paid</p>
          </div>
        </div>
      </Panel>

      {/* Section 5 — lifetime cards */}
      <Section title="Overall" sub="The base you've built" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Active users" value={plus.lifetime.users_total} sub={`${plus.lifetime.vehicles_total} vehicles checked`} tone="text-ink" />
        <KpiTile label="On trial (basic)" value={plus.cohort.trial} sub="free basic only" tone="text-warn" />
        <KpiTile label="Paying" value={plus.cohort.paying} sub={`${conv}% of triallists converted`} tone="text-brand" />
        <KpiTile label="Lifetime revenue" value={inr(lifeRev)} sub={`${d.full_reports} full reports sold`} tone="text-brand" />
      </div>

      {/* Section 6 — worth celebrating */}
      {wins.length > 0 && (
        <>
          <Section title="Worth celebrating" />
          <div className="rounded-2xl border border-brand-accent/30 bg-brand-accent/5 p-5">
            <ul className="grid gap-2 sm:grid-cols-2">
              {wins.map((w, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-accent/15">✓</span>{w}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Section 7 & 8 — trends */}
      <Section title="Trends" sub="Last 30 days" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Last 30 days" sub="Revenue captured per day"
          right={<TrendPill delta={revDelta} />}>
          <AreaChart data={series} xKey="date" yKey="revenue" format={inr} labelOf={(v) => day(v)} />
        </Panel>
        <Panel title="Trial → paid" sub="The number that decides the business">
          <div className="text-center">
            <div className="text-5xl font-black text-brand-accent nums">{conv}%</div>
            <p className="mt-1 text-xs text-muted">{plus.cohort.paying} of {plus.cohort.paying + plus.cohort.trial} upgraded</p>
          </div>
          <div className="mt-5 space-y-2">
            {plus.planMix.length ? plus.planMix.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Pill tone="green">PAID</Pill>{p.plan_name}</span>
                <span className="font-semibold nums">{p.count}</span>
              </div>
            )) : <p className="text-center text-xs text-muted">No paid plans yet.</p>}
          </div>
        </Panel>
      </div>

      {/* Section 9 — newest enrolments */}
      <Section title="Newest paying customers" sub="Most recent captured payments" />
      <Panel className="p-0">
        {plus.newest.length === 0 ? <Empty>No paying customers yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead><tr>{['When', 'User', 'Vehicles', 'Plan', 'Value'].map((c) => <th key={c} className="th bg-line/30">{c}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {plus.newest.map((f) => (
                  <tr key={f.id} className="hover:bg-brand/[.03]">
                    <td className="td whitespace-nowrap text-muted">{dt(f.paid_at)}</td>
                    <td className="td">
                      <div className="font-semibold text-ink">{f.full_name || '—'}</div>
                      <div className="text-xs text-muted nums">{phone(f.wa_id)}</div>
                    </td>
                    <td className="td text-xs">{f.regs || `${f.vehicles} vehicle${f.vehicles === 1 ? '' : 's'}`}</td>
                    <td className="td"><Pill tone="green">Full report</Pill></td>
                    <td className="td font-bold nums">{inr(f.amount)}</td>
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
