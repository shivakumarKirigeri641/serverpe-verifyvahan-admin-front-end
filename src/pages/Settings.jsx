import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBox, PageHead } from '../components/ui.jsx';

export default function Settings() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [rates, setRates] = useState({ VAHAN: 0, ECHALLAN: 0, FASTAG: 0 });
  const [plans, setPlans] = useState({});
  const [maxVehicles, setMaxVehicles] = useState(5);
  const [content, setContent] = useState({ benefits: [], why: [] });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const [history, setHistory] = useState([]);
  const loadHistory = () => api.planHistory().then((r) => setHistory(r.history || [])).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  const load = () => api.settings().then((d) => {
    setData(d);
    setRates({ VAHAN: 0, ECHALLAN: 0, FASTAG: 0, ...d.ulip_rates });
    const p = {}; d.plans.forEach((x) => { p[x.plan_code] = { amount: x.amount, comparable_price: x.comparable_price, validity_days: x.validity_days }; });
    setPlans(p);
    setMaxVehicles(d.max_vehicles ?? 5);
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
    try {
      await api.setPlans(plans);
      await api.setMaxVehicles(maxVehicles);
      flash('Pricing, validity & cart limit saved.'); await load(); loadHistory();
    } catch (e) { setErr(e.message); } finally { setBusy(''); }
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

  const resetData = async () => {
    setBusy('reset'); setErr('');
    try {
      const r = await api.resetTestData(confirm);
      const c = r.cleared || {};
      flash(`Test data cleared — ${c.users || 0} users, ${c.vehicles || 0} vehicles, ${c.reports || 0} reports, ${c.messages || 0} messages removed.`);
      setConfirm('');
    } catch (e) { setErr(e.message); } finally { setBusy(''); }
  };

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
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-line p-4">
            <div>
              <div className="text-sm font-bold text-ink">Max vehicles per checkout</div>
              <div className="text-xs text-muted">How many vehicles a customer can add to one payment.</div>
            </div>
            <input className="input !py-2 w-20 text-center text-sm" type="number" min="1" max="20"
              value={maxVehicles} onChange={(e) => setMaxVehicles(e.target.value)} />
          </div>

          <button className="btn-primary mt-5" disabled={busy === 'plans'} onClick={savePlans}>
            {busy === 'plans' ? 'Saving…' : 'Save pricing'}
          </button>

          {history.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Price change history</h3>
              <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-ink">
                      {h.plan_code === 'PREMIUM_2W3W' ? '2/3W' : '4W+'}
                    </span>
                    <span className="text-body">
                      {Number(h.old_amount) !== Number(h.new_amount) && (
                        <>₹{Number(h.old_amount)} → <b className="text-ink">₹{Number(h.new_amount)}</b> </>
                      )}
                      {Number(h.old_validity_days) !== Number(h.new_validity_days) && (
                        <>· {h.old_validity_days}→{h.new_validity_days}d </>
                      )}
                    </span>
                    <span className="shrink-0 text-muted">
                      {new Date(h.changed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Why GaadiPe</h3>
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

      {/* Danger zone — reset test data before go-live */}
      <div className="mt-6 card border-2 border-red-200 p-6">
        <div className="flex items-center gap-2">
          <span className="text-red-600">⚠️</span>
          <h2 className="font-bold text-red-700">Danger zone — reset test data</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Permanently deletes all <b>test / transactional data</b> — users, WhatsApp sessions &amp; messages,
          vehicles, reports, payments, invoices, consents, visits and ULIP logs — and resets invoice/report
          numbering. Report PDFs aren’t stored on disk, so clearing the rows removes them everywhere.
          <b className="text-ink"> Your config is kept</b> (business, policies, pricing, states). Use this once
          before going live. <b className="text-red-700">Cannot be undone.</b>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="input w-48 border-red-200"
            placeholder="Type RESET"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
            disabled={confirm.trim().toUpperCase() !== 'RESET' || busy === 'reset'}
            onClick={resetData}
          >
            {busy === 'reset' ? 'Clearing…' : 'Reset test data'}
          </button>
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
