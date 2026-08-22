import { useEffect, useRef, useState } from 'react';
import { api, day, dt } from '../lib/api';
import { Spinner, ErrorBox, Section, Pill } from '../components/ui.jsx';
import { KpiTile, TrendPill, AreaChart, HBars, Panel, CAT } from '../components/charts.jsx';
import IndiaHeat from '../components/IndiaHeat.jsx';

const REFRESH_MS = 10000;
const num = (n) => Number(n || 0).toLocaleString('en-IN');
const pct = (cur, prev) => {
  cur = Number(cur || 0); prev = Number(prev || 0);
  if (prev === 0) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
};
const refShort = (r) => (!r ? 'Direct' : String(r).replace(/^https?:\/\/(www\.)?/, '').split('/')[0]);
const osOf = (ua) => {
  if (!ua) return '—';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod|iOS/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
};
const PAGE = 25;

export default function Visitors() {
  const [rich, setRich] = useState(null);
  const [geo, setGeo] = useState(null);
  const [recent, setRecent] = useState([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  const timer = useRef(null);

  const loadLive = () => Promise.all([api.visitorsRich(), api.visitorsGeo()])
    .then(([r, g]) => { setRich(r); setGeo(g); setError(''); })
    .catch((e) => setError(e.message));

  useEffect(() => {
    loadLive();
    timer.current = setInterval(loadLive, REFRESH_MS);
    return () => clearInterval(timer.current);
  }, []);

  useEffect(() => {
    api.visitorsRecent({ limit: PAGE, offset }).then((d) => setRecent(d.rows)).catch(() => {});
  }, [offset]);

  if (error && !rich) return <ErrorBox message={error} onRetry={loadLive} />;
  if (!rich) return <Spinner />;

  const t = rich.totals;
  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-ok" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">Visitors</h1>
          <p className="mt-0.5 text-sm text-muted">Traffic to gaadipe.in · refreshes every 10 seconds</p>
        </div>
      </div>

      <Section title="Traffic" sub="Since launch" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiTile label="Views today" value={num(t.views_today)} sub="vs yesterday" tone="text-brand" trend={<TrendPill delta={pct(t.views_today, t.views_yest)} />} />
        <KpiTile label="Visitors today" value={num(t.visitors_today)} sub="unique" trend={<TrendPill delta={pct(t.visitors_today, t.visitors_yest)} />} />
        <KpiTile label="Views this week" value={num(t.views_week)} sub="since Monday" />
        <KpiTile label="Total views" value={num(t.views_total)} sub={`${num(t.visitors_total)} unique`} />
        <KpiTile label="WhatsApp taps" value={num(t.clicks_today)} sub={`${num(t.clicks_total)} all-time`} tone="text-ok" trend={<TrendPill delta={pct(t.clicks_today, t.clicks_yest)} />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Daily views" sub="Last 30 days">
          <AreaChart data={rich.series} xKey="date" yKey="views" color={CAT[1]} format={num} labelOf={day} />
        </Panel>
        <Panel title="Traffic sources" sub="Where visitors come from">
          {rich.sources.length ? (
            <HBars data={rich.sources.map((s, i) => ({ label: refShort(s.source), value: s.n, color: CAT[i % CAT.length] }))} format={num} />
          ) : <p className="py-6 text-center text-sm text-muted">No referrers yet.</p>}
        </Panel>
      </div>

      <Section title="Where they are" sub="Visitors and users by state / region" />
      <IndiaHeat geo={geo} />

      <Section title="Recent visitors" sub="Newest first" />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead><tr>{['When', 'Page', 'Source', 'IP', 'City', 'State', 'OS', 'User agent', 'WhatsApp'].map((h) => <th key={h} className="th bg-line/30">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {recent.map((v) => (
                <tr key={v.id} className="hover:bg-brand/[.03]">
                  <td className="td whitespace-nowrap text-muted">{dt(v.created_at)}</td>
                  <td className="td font-mono text-xs text-body">{v.path || '/'}</td>
                  <td className="td text-xs">{refShort(v.referrer)}</td>
                  <td className="td whitespace-nowrap font-mono text-xs text-body">{v.ip || '—'}</td>
                  <td className="td whitespace-nowrap text-xs">{v.city || '—'}</td>
                  <td className="td whitespace-nowrap text-xs">{v.state_name || '—'}</td>
                  <td className="td text-xs">{osOf(v.user_agent)}</td>
                  <td className="td max-w-[240px] truncate text-[11px] text-muted" title={v.user_agent || ''}>{v.user_agent || '—'}</td>
                  <td className="td">{v.is_wa_click ? <Pill tone="green">Tapped</Pill> : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td className="td text-center text-muted" colSpan={9}>No visitors on this page.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <span className="text-muted">Showing {offset + 1}–{offset + recent.length}</span>
          <div className="flex gap-2">
            <button className="btn-sec" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>← Prev</button>
            <button className="btn-sec" disabled={recent.length < PAGE} onClick={() => setOffset(offset + PAGE)}>Next →</button>
          </div>
        </div>
      </div>
    </>
  );
}
