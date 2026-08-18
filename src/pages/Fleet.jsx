import { useState } from 'react';
import { api, inr, dt, day, openInvoicePdf, openReportPdf } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Empty, Badge } from '../components/ui.jsx';
import { KpiTile, Panel } from '../components/charts.jsx';
import { toast } from '../components/Toaster.jsx';

// GST state codes (place of supply) — decides IGST vs CGST+SGST.
const STATES = [
  ['37', 'Andhra Pradesh'], ['12', 'Arunachal Pradesh'], ['18', 'Assam'], ['10', 'Bihar'],
  ['22', 'Chhattisgarh'], ['30', 'Goa'], ['24', 'Gujarat'], ['06', 'Haryana'], ['02', 'Himachal Pradesh'],
  ['20', 'Jharkhand'], ['29', 'Karnataka'], ['32', 'Kerala'], ['23', 'Madhya Pradesh'], ['27', 'Maharashtra'],
  ['14', 'Manipur'], ['17', 'Meghalaya'], ['15', 'Mizoram'], ['13', 'Nagaland'], ['21', 'Odisha'],
  ['03', 'Punjab'], ['08', 'Rajasthan'], ['11', 'Sikkim'], ['33', 'Tamil Nadu'], ['36', 'Telangana'],
  ['16', 'Tripura'], ['09', 'Uttar Pradesh'], ['05', 'Uttarakhand'], ['19', 'West Bengal'],
  ['35', 'Andaman & Nicobar'], ['04', 'Chandigarh'], ['26', 'Dadra & Nagar Haveli / Daman & Diu'],
  ['07', 'Delhi'], ['01', 'Jammu & Kashmir'], ['31', 'Lakshadweep'], ['34', 'Puducherry'], ['38', 'Ladakh'],
];

const STATUS_TONE = { draft: 'grey', link_created: 'blue', paid: 'amber', fulfilled: 'green', cancelled: 'red' };

export default function Fleet() {
  const [tab, setTab] = useState('new');
  return (
    <>
      <PageHead title="Fleet / bulk orders" sub="One order, many vehicles, a payment link + QR, and a consolidated GST invoice."
        right={
          <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
            {[['new', 'New order'], ['list', 'Orders']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
        } />
      {tab === 'new' ? <NewOrder /> : <OrderList />}
    </>
  );
}

function NewOrder() {
  const [f, setF] = useState({ name: '', mobile: '', email: '', gstin: '', state_gst_code: '29', price_per_vehicle: 99, reg_nos: '', note: '' });
  const [quote, setQuote] = useState(null);
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState('');
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setQuote(null); setOrder(null); };

  const getQuote = async () => {
    setBusy('quote');
    try {
      const r = await api.fleetQuote({ reg_nos: f.reg_nos, price_per_vehicle: Number(f.price_per_vehicle), state_gst_code: f.state_gst_code });
      setQuote(r.quote);
      if (!r.quote.vehicle_count) toast('No valid vehicle numbers found.', 'error');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(''); }
  };

  const createOrder = async () => {
    if (!f.name.trim()) return toast('Enter the fleet owner name.', 'error');
    setBusy('order');
    try {
      const r = await api.fleetOrder({ ...f, price_per_vehicle: Number(f.price_per_vehicle) });
      setOrder(r.order);
      toast('Order created — share the payment link/QR below.', 'success');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(''); }
  };

  const qrSrc = order?.short_url ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(order.short_url)}` : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Fleet owner & vehicles">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner / company name" value={f.name} onChange={set('name')} className="col-span-2" />
          <Field label="Mobile" value={f.mobile} onChange={set('mobile')} placeholder="10-digit" />
          <Field label="Email (optional)" value={f.email} onChange={set('email')} />
          <Field label="GSTIN (for input-tax credit)" value={f.gstin} onChange={set('gstin')} className="col-span-2" placeholder="29ABCDE1234F1Z5" />
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">State (place of supply)</label>
            <select className="input mt-1" value={f.state_gst_code} onChange={set('state_gst_code')}>
              {STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </div>
          <Field label="Price / vehicle (₹, GST incl.)" type="number" value={f.price_per_vehicle} onChange={set('price_per_vehicle')} />
        </div>
        <label className="mt-3 block text-[11px] font-bold uppercase tracking-wider text-muted">Vehicle numbers</label>
        <textarea className="input mt-1 h-28 font-mono text-sm uppercase" placeholder="One per line or comma-separated&#10;KA01AB1234&#10;MH12CD3456"
          value={f.reg_nos} onChange={set('reg_nos')} />
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost" disabled={busy === 'quote'} onClick={getQuote}>{busy === 'quote' ? 'Checking…' : 'Get quote'}</button>
          {quote?.vehicle_count > 0 && (
            <button className="btn-primary" disabled={busy === 'order'} onClick={createOrder}>{busy === 'order' ? 'Creating…' : 'Create order & payment link'}</button>
          )}
        </div>
      </Panel>

      <div className="space-y-4">
        {quote && (
          <Panel title="Quote" sub={`${quote.vehicle_count} vehicle(s) · ${quote.is_interstate ? 'IGST' : 'CGST+SGST'} @ ${quote.gst_percent}%`}>
            <div className="grid grid-cols-3 gap-3">
              <KpiTile label="Vehicles" value={quote.vehicle_count} />
              <KpiTile label="Taxable" value={inr(quote.taxable)} />
              <KpiTile label="Total" value={inr(quote.total)} tone="text-brand" sub={`incl. ${inr(quote.tax)} GST`} />
            </div>
            {quote.invalid?.length > 0 && (
              <p className="mt-3 rounded-lg bg-bad/5 p-2.5 text-xs text-bad">
                Skipped (invalid): <span className="font-mono">{quote.invalid.join(', ')}</span>
              </p>
            )}
          </Panel>
        )}

        {order && (
          <Panel title="Payment link ready 🎉" sub="Send this to the fleet owner — link or QR">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              {qrSrc && <img src={qrSrc} alt="Payment QR" className="h-40 w-40 rounded-xl border border-line" />}
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-black text-brand nums">{inr(order.total)}</div>
                <div className="text-xs text-muted">{order.vehicle_count} vehicles · {order.customer_name}</div>
                <a href={order.short_url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm font-semibold text-brand-accent hover:underline">{order.short_url}</a>
                <button className="btn-ghost mt-3 w-full text-sm" onClick={() => { navigator.clipboard?.writeText(order.short_url); toast('Link copied', 'success'); }}>Copy link</button>
                <p className="mt-2 text-[11px] text-muted">After they pay, open <b>Orders</b> → this order → <b>Sync</b> to generate all reports + the GST invoice.</p>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, className = '', type = 'text', placeholder }) => (
  <div className={className}>
    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</label>
    <input type={type} className="input mt-1" value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);

function OrderList() {
  const { data, loading, error, reload } = useAsync(() => api.fleetList({ limit: 100 }), []);
  const [openId, setOpenId] = useState(null);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const orders = data.orders || [];

  return (
    <>
      {orders.length === 0 ? <Empty>No fleet orders yet.</Empty> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl w-full min-w-[640px]">
              <thead className="border-b border-line bg-panel"><tr>{['Owner', 'GSTIN', 'Vehicles', 'Total', 'Status', 'Created', ''].map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="cursor-pointer" onClick={() => setOpenId(o.id)}>
                    <td className="td font-semibold text-ink">{o.customer_name || '—'}</td>
                    <td className="td font-mono text-xs">{o.customer_gstin || '—'}</td>
                    <td className="td nums">{o.vehicle_count}</td>
                    <td className="td font-bold nums">{inr(o.total)}</td>
                    <td className="td"><span className={`chip ${TONE(o.status)}`}>{o.status}</span></td>
                    <td className="td whitespace-nowrap text-muted">{dt(o.created_at)}</td>
                    <td className="td text-brand text-xs font-bold">Open ›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {openId && <OrderDrawer id={openId} onClose={() => setOpenId(null)} onChange={reload} />}
    </>
  );
}

const TONE = (s) => ({ grey: 'bg-line text-muted', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700' }[STATUS_TONE[s] || 'grey']);

function OrderDrawer({ id, onClose, onChange }) {
  const { data, loading, error, reload } = useAsync(() => api.fleetGet(id), [id]);
  const [busy, setBusy] = useState(false);
  const o = data?.order;
  const reports = data?.reports || [];

  const sync = async () => {
    setBusy(true);
    try {
      const r = await api.fleetSync(id);
      const st = r.order?.status;
      toast(st === 'fulfilled' ? 'Paid — reports & invoice generated ✓' : r.order?.paid ? 'Processing…' : `Not paid yet (${r.order?.link_status || 'pending'})`, st === 'fulfilled' ? 'success' : 'info');
      reload(); onChange?.();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const dl = (fn, arg) => async () => { try { await fn(arg); } catch (e) { toast(e.message, 'error'); } };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-panel p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-ink">Fleet order #{id}</h3>
          <button className="text-muted hover:text-ink" onClick={onClose}>✕</button>
        </div>
        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : o && (
          <div className="mt-4 space-y-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-black text-brand nums">{inr(o.total)}</div>
              <div className="mt-1"><span className={`chip ${TONE(o.status)}`}>{o.status}</span></div>
              <div className="mt-1 text-xs text-muted">{o.vehicle_count} vehicles · {o.is_interstate ? 'IGST' : 'CGST+SGST'}</div>
            </div>

            <Sec title="Fleet owner">
              <KV k="Name" v={o.customer_name} />
              <KV k="GSTIN" v={o.customer_gstin} mono />
              <KV k="Mobile" v={o.customer_mobile} />
              <KV k="Email" v={o.customer_email} />
            </Sec>

            {o.short_url && o.status !== 'fulfilled' && (
              <Sec title="Payment">
                <a href={o.short_url} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-brand-accent hover:underline">{o.short_url}</a>
                <button className="btn-primary mt-3 w-full" disabled={busy} onClick={sync}>{busy ? 'Checking…' : '↻ Sync payment & fulfill'}</button>
                <p className="mt-1.5 text-[11px] text-muted">Click after the owner pays — generates all reports + the GST invoice.</p>
              </Sec>
            )}

            {o.fk_invoice && (
              <Sec title={`GST invoice · ${o.invoice_number || ''}`}>
                <button className="btn-ghost w-full text-sm" onClick={dl(openInvoicePdf, o.fk_invoice)}>Download consolidated invoice</button>
              </Sec>
            )}

            {reports.length > 0 && (
              <Sec title={`Reports (${reports.length})`}>
                {reports.map((r) => (
                  <button key={r.id} className="flex w-full items-center justify-between border-t border-line py-1.5 text-left first:border-0 hover:text-brand"
                    onClick={dl(openReportPdf, r.id)}>
                    <span className="font-semibold text-ink">{r.reg_no}</span>
                    <span className="text-xs font-bold text-brand">PDF ↓</span>
                  </button>
                ))}
              </Sec>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const Sec = ({ title, children }) => (
  <div className="card p-4">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{title}</div>
    <div className="space-y-1 text-sm">{children}</div>
  </div>
);
const KV = ({ k, v, mono }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-muted">{k}</span>
    <span className={`text-right text-ink ${mono ? 'font-mono text-xs' : ''}`}>{v || '—'}</span>
  </div>
);
