import { useState } from 'react';
import { api, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Section, Pill, Empty } from '../components/ui.jsx';
import { KpiTile } from '../components/charts.jsx';
import { phone } from '../components/ActivityList.jsx';
import { toast } from '../components/Toaster.jsx';

const STATUS = [['', 'All'], ['active', 'Active'], ['expired', 'Expired'], ['cancelled', 'Cancelled']];
const tone = (s) => (s === 'active' ? 'green' : s === 'cancelled' ? 'red' : 'grey');

export default function Watch() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState('');
  const { data, loading, error, reload } = useAsync(() => api.watch({ status: status || undefined, limit: 200 }), [status]);
  const [price, setPrice] = useState(null);

  const run = async () => {
    setBusy('run');
    try { const r = await api.runWatchSweep(); toast(`Sweep done — ${r.checked} checked, ${r.expired} expired`, 'success'); reload(); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(''); }
  };
  const savePricing = async () => {
    setBusy('price');
    try { await api.setWatchPricing(price); toast('Watch pricing saved.', 'success'); reload(); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(''); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const s = data.stats, p = price || data.pricing;

  return (
    <>
      <PageHead title="Watch subscriptions" sub="Automatic monitoring — challan checks + expiry reminders."
        right={<button className="btn-primary text-sm" disabled={busy === 'run'} onClick={run}>{busy === 'run' ? 'Running…' : '▶ Run sweep now'}</button>} />

      <Section title="At a glance" className="!mt-0" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiTile label="Active watches" value={s.active} tone="text-brand" />
        <KpiTile label="Annual plans" value={s.annual} sub="₹999 · full year" />
        <KpiTile label="Expiring ≤ 5 days" value={s.expiring_soon} tone={s.expiring_soon ? 'text-warn' : 'text-ink'} sub="nudge to renew" />
        <KpiTile label="Alerts sent" value={s.alerts_sent} sub="challan + expiry" />
        <KpiTile label="Cancelled" value={s.cancelled} tone="text-muted" />
      </div>

      <Section title="Pricing" sub="Applies to new purchases · no deploy needed" />
      <div className="card flex flex-wrap items-end gap-4 p-5">
        <Num label="28-day price ₹" value={p.term_price} onChange={(v) => setPrice({ ...p, term_price: v })} />
        <Num label="28-day days" value={p.term_days} onChange={(v) => setPrice({ ...p, term_days: v })} />
        <Num label="Annual price ₹" value={p.annual_price} onChange={(v) => setPrice({ ...p, annual_price: v })} />
        <Num label="Annual days" value={p.annual_days} onChange={(v) => setPrice({ ...p, annual_days: v })} />
        <button className="btn-primary" disabled={busy === 'price'} onClick={savePricing}>{busy === 'price' ? 'Saving…' : 'Save pricing'}</button>
      </div>

      <Section title="Subscriptions" right={
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
          {STATUS.map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>
      } />
      {data.watches.length === 0 ? <Empty>No subscriptions in this view.</Empty> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead><tr>{['Vehicle', 'Customer', 'Plan', 'Status', 'Days left', 'Last checked', 'Challans', 'Alerts'].map((h) => <th key={h} className="th bg-line/30">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {data.watches.map((w) => (
                  <tr key={w.id} className="hover:bg-brand/[.03]">
                    <td className="td font-semibold text-ink">{w.reg_no}</td>
                    <td className="td"><div className="text-ink">{w.full_name || '—'}</div><div className="text-xs text-muted nums">{phone(w.wa_id)}</div></td>
                    <td className="td"><Pill tone={w.plan === 'annual' ? 'purple' : 'blue'}>{w.plan === 'annual' ? 'Annual' : '28-day'}</Pill></td>
                    <td className="td"><Pill tone={tone(w.status)}>{w.status}</Pill></td>
                    <td className="td nums">{w.status === 'active' ? `${w.days_left}d` : '—'}</td>
                    <td className="td whitespace-nowrap text-muted">{w.last_checked_at ? dt(w.last_checked_at) : 'not yet'}</td>
                    <td className="td nums">{w.last_challan_count}</td>
                    <td className="td nums">{w.alerts_sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-4 py-2.5 text-xs text-muted">Ends: {data.watches[0] && day(data.watches[0].end_date)} … showing {data.watches.length}</div>
        </div>
      )}
    </>
  );
}

function Num({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <input className="input !py-2 w-28 text-sm" type="number" min="0" value={value ?? ''} onChange={(e) => onChange(+e.target.value)} />
    </label>
  );
}
