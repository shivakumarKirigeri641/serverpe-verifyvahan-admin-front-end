import { useEffect, useRef, useState } from 'react';
import { api, inr } from '../lib/api';
import { Spinner, ErrorBox, Section } from '../components/ui.jsx';
import { KpiTile, BarChart, Panel } from '../components/charts.jsx';
import ActivityList from '../components/ActivityList.jsx';

const REFRESH_MS = 10000;

export default function Today() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);          // pulses the "live" dot
  const timer = useRef(null);

  const load = () => api.todayLive()
    .then((d) => { setData(d); setError(''); setTick((t) => t + 1); })
    .catch((e) => setError(e.message));

  useEffect(() => {
    load();
    timer.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer.current);
  }, []);

  if (error && !data) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <Spinner />;

  const s = data.snap;
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
            <span key={tick} className="inline-block h-3 w-3 animate-ping rounded-full bg-ok" />
            <span className="-ml-4 inline-block h-3 w-3 rounded-full bg-ok" />
            Today, live
          </h1>
          <p className="mt-1 text-sm text-muted">Auto-refreshes every 10 seconds · GaadiPe.in</p>
        </div>
      </div>

      <Section title="Right now" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Revenue today" value={inr(s.revenue)} sub={`${s.payments} payment${s.payments === 1 ? '' : 's'}`} tone="text-brand" />
        <KpiTile label="New users" value={s.signups} sub="joined today" tone="text-ink" />
        <KpiTile label="Full reports" value={s.full_reports} sub={`${s.basic_reports} basic checks`} tone="text-ink" />
        <KpiTile label="Site visits" value={s.visits} sub="today" tone="text-ink" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Today by the hour" sub="Site visits per hour">
          <BarChart data={data.hourly} xKey="hour" yKey="visits" format={(v) => `${v} visits`} />
        </Panel>
        <Panel className="lg:col-span-2" title="Live activity" sub="Most recent events">
          <ActivityList rows={data.recent} empty="Quiet so far today." />
        </Panel>
      </div>

      {s.open_tickets > 0 && (
        <div className="mt-4 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm font-semibold text-warn">
          ⚠️ {s.open_tickets} open support ticket{s.open_tickets === 1 ? '' : 's'} awaiting a reply.
        </div>
      )}
    </>
  );
}
