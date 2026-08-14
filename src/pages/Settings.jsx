import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBox, PageHead } from '../components/ui.jsx';

export default function Settings() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [rates, setRates] = useState({ VAHAN: 0, ECHALLAN: 0, FASTAG: 0 });
  const [plans, setPlans] = useState({});
  const [content, setContent] = useState({ benefits: [], why: [] });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => api.settings().then((d) => {
    setData(d);
    setRates({ VAHAN: 0, ECHALLAN: 0, FASTAG: 0, ...d.ulip_rates });
    const p = {}; d.plans.forEach((x) => { p[x.plan_code] = { amount: x.amount, comparable_price: x.comparable_price, validity_days: x.validity_days }; });
    setPlans(p);
    setContent({ benefits: d.content?.benefits || [], why: d.content?.why || [] });
  }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox message={err} onRetry={load} />;
  if (!data) return <Spinner />;

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const saveRates = async () => {
    setBusy('rates');
    try { await api.setUlipRates(rates); flash('ULIP rates saved.'); } catch (e) { setErr(e.message); } finally { setBusy(''); }
  };
  const savePlans = async () => {
    setBusy('plans');
    try { await api.setPlans(plans); flash('Pricing & validity saved.'); await load(); }
    catch (e) { setErr(e.message); } finally { setBusy(''); }
  };
  const setPlan = (code, k, v) => setPlans((p) => ({ ...p, [code]: { ...p[code], [k]: v } }));

  const saveContent = async () => {
    setBusy('content');
    try { await api.setContent(content); flash('Marketing content saved — live on the site.'); await load(); }
    catch (e) { setErr(e.message); } finally { setBusy(''); }
  };
  const setRow = (list, i, k, v) => setContent((c) => ({ ...c, [list]: c[list].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRow = (list, blank) => setContent((c) => ({ ...c, [list]: [...c[list], blank] }));
  const delRow = (list, i) => setContent((c) => ({ ...c, [list]: c[list].filter((_, j) => j !== i) }));

  const b = data.business || {};
  return (
    <>
      <PageHead title="Settings" sub="Pricing, report validity and ULIP cost rates." />
      {msg && <div className="mb-4 rounded-lg bg-ok/10 px-3 py-2 text-sm font-semibold text-ok">{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pricing & validity */}
        <div className="card p-6">
          <h2 className="font-bold text-ink">Pricing &amp; report validity</h2>
          <p className="mt-1 text-sm text-muted">Applies instantly to new checkouts and reports.</p>

          {['PREMIUM_2W3W', 'PREMIUM_4W'].map((code) => (
            <div key={code} className="mt-5 rounded-xl border border-line p-4">
              <div className="text-sm font-bold text-ink">{code === 'PREMIUM_2W3W' ? '2 & 3 wheeler' : '4 wheeler & above'}</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Num label="Price ₹" value={plans[code]?.amount} onChange={(v) => setPlan(code, 'amount', v)} />
                <Num label="Worth ₹" value={plans[code]?.comparable_price} onChange={(v) => setPlan(code, 'comparable_price', v)} />
                <Num label="Valid (days)" value={plans[code]?.validity_days} onChange={(v) => setPlan(code, 'validity_days', v)} />
              </div>
            </div>
          ))}
          <button className="btn-primary mt-5" disabled={busy === 'plans'} onClick={savePlans}>
            {busy === 'plans' ? 'Saving…' : 'Save pricing'}
          </button>
        </div>

        {/* ULIP rates */}
        <div className="card p-6">
          <h2 className="font-bold text-ink">ULIP cost per API call</h2>
          <p className="mt-1 text-sm text-muted">₹0 now. Set the rate the day ULIP starts charging — spend then tracks itself.</p>
          <div className="mt-5 space-y-3">
            {['VAHAN', 'ECHALLAN', 'FASTAG'].map((k) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{k}</span>
                <div className="w-40"><Num label="₹ / call" value={rates[k]} onChange={(v) => setRates((r) => ({ ...r, [k]: v }))} /></div>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-5" disabled={busy === 'rates'} onClick={saveRates}>
            {busy === 'rates' ? 'Saving…' : 'Save rates'}
          </button>

          <div className="mt-8 border-t border-line pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Business (read-only)</h3>
            <div className="mt-2 text-sm text-body space-y-1">
              <div>{b.business_name || 'ServerPe App Solutions'}</div>
              <div className="text-muted">GSTIN {b.gstin || '—'} · {b.home_state || '—'}</div>
              <div className="text-muted">{b.support_email || 'support@serverpe.in'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing content — feeds the public site (GET /site) */}
      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-ink">Marketing content</h2>
            <p className="mt-1 text-sm text-muted">The “what you get” benefits and “why” points shown on the public site.</p>
          </div>
          <button className="btn-primary" disabled={busy === 'content'} onClick={saveContent}>
            {busy === 'content' ? 'Saving…' : 'Save content'}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Benefits</h3>
              <button className="text-xs font-bold text-brand" onClick={() => addRow('benefits', { icon: 'check', title: '', body: '' })}>+ Add</button>
            </div>
            <div className="space-y-3">
              {content.benefits.map((r, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <div className="flex gap-2">
                    <input className="input !py-2 w-24 text-sm" placeholder="icon" value={r.icon || ''} onChange={(e) => setRow('benefits', i, 'icon', e.target.value)} />
                    <input className="input !py-2 flex-1 text-sm font-semibold" placeholder="Title" value={r.title || ''} onChange={(e) => setRow('benefits', i, 'title', e.target.value)} />
                    <button className="text-muted hover:text-bad" onClick={() => delRow('benefits', i)}>✕</button>
                  </div>
                  <textarea className="input mt-2 min-h-[52px] text-sm" placeholder="Description" value={r.body || ''} onChange={(e) => setRow('benefits', i, 'body', e.target.value)} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">icons: rc, shield, leaf, gauge, road, alert, tag, check, doc</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Why VerifyVahan</h3>
              <button className="text-xs font-bold text-brand" onClick={() => addRow('why', { title: '', body: '' })}>+ Add</button>
            </div>
            <div className="space-y-3">
              {content.why.map((r, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <div className="flex gap-2">
                    <input className="input !py-2 flex-1 text-sm font-semibold" placeholder="Title" value={r.title || ''} onChange={(e) => setRow('why', i, 'title', e.target.value)} />
                    <button className="text-muted hover:text-bad" onClick={() => delRow('why', i)}>✕</button>
                  </div>
                  <textarea className="input mt-2 min-h-[52px] text-sm" placeholder="Description" value={r.body || ''} onChange={(e) => setRow('why', i, 'body', e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Num({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <input className="input !py-2 text-sm" type="number" min="0" step="0.5"
        value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
