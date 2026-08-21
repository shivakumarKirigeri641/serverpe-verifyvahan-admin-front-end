import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBox, PageHead, Section } from '../components/ui.jsx';

export default function Premium() {
  const [pricing, setPricing] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [grant, setGrant] = useState({ mobile: '', reg_no: '' });
  const [grantMsg, setGrantMsg] = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const load = () => api.premiumSettings()
    .then((p) => setPricing({ base_price: 149, mid_price: 124, earned_price: 99, term_days: 28, trial_days: 7, max_vehicles: 5, annual_price: 999, annual_days: 365, ...(p.pricing || {}) }))
    .catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox message={err} onRetry={load} />;
  if (!pricing) return <Spinner />;

  const savePricing = async () => {
    setBusy('pricing');
    try { const r = await api.setPremiumSettings(pricing); setPricing((p) => ({ ...p, ...r.pricing })); flash('Premium pricing saved — live within a minute.'); }
    catch (e) { setErr(e.message); } finally { setBusy(''); }
  };

  const doGrant = async () => {
    setBusy('grant'); setGrantMsg('');
    try {
      const r = await api.grantPremium(grant.mobile, grant.reg_no);
      setGrantMsg(`✓ Premium ${r.extended ? 'extended' : 'granted'} until ${new Date(r.watch.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`);
      setGrant({ mobile: '', reg_no: '' });
    } catch (e) { setGrantMsg('✗ ' + e.message); } finally { setBusy(''); }
  };

  const set = (k, v) => setPricing((p) => ({ ...p, [k]: v }));

  return (
    <>
      <PageHead title="Premium" sub="Gamified pricing and manual grants. (WhatsApp templates now live on their own page.)" />
      {msg && <div className="mb-4 rounded-lg bg-ok/10 px-3 py-2 text-sm font-semibold text-ok">{msg}</div>}

      <Section title="Pricing & limits" sub="Applies to new trials, quotes and checkouts within a minute" className="!mt-0" />
      <div className="card p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Num label="Earned price ₹ (5/5)" value={pricing.earned_price} onChange={(v) => set('earned_price', v)} />
          <Num label="Mid price ₹ (4/5)" value={pricing.mid_price} onChange={(v) => set('mid_price', v)} />
          <Num label="Base price ₹ (≤3/5)" value={pricing.base_price} onChange={(v) => set('base_price', v)} />
          <Num label="Term (days)" value={pricing.term_days} onChange={(v) => set('term_days', v)} />
          <Num label="Free trial (days)" value={pricing.trial_days} onChange={(v) => set('trial_days', v)} />
          <Num label="Max vehicles / mobile" value={pricing.max_vehicles} onChange={(v) => set('max_vehicles', v)} />
          <Num label="Annual price ₹" value={pricing.annual_price} onChange={(v) => set('annual_price', v)} />
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Your best day sets the price: <b>5/5 → ₹{pricing.earned_price}</b>, 4/5 → ₹{pricing.mid_price}, else ₹{pricing.base_price}.
          Charged <b>per vehicle</b>, up to <b>{pricing.max_vehicles}</b> per mobile, each a {pricing.term_days}-day window (GST-inclusive).
        </p>
        <button className="btn-primary mt-5" disabled={busy === 'pricing'} onClick={savePricing}>
          {busy === 'pricing' ? 'Saving…' : 'Save pricing'}
        </button>
      </div>

      <Section title="Grant Premium" sub="Give a mobile + vehicle Premium with no charge (testing / manual comp)" />
      <div className="card max-w-xl p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Mobile (10 digits)</span>
            <input className="input !py-2 text-sm" placeholder="9886122415" value={grant.mobile}
              onChange={(e) => setGrant((g) => ({ ...g, mobile: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Vehicle number</span>
            <input className="input !py-2 text-sm uppercase" placeholder="KA01AB1234" value={grant.reg_no}
              onChange={(e) => setGrant((g) => ({ ...g, reg_no: e.target.value }))} />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-muted">The mobile must have messaged the bot once; the vehicle should have been checked at least once.</p>
        <button className="btn-primary mt-4" disabled={busy === 'grant' || grant.mobile.replace(/\D/g, '').length < 10 || !grant.reg_no.trim()} onClick={doGrant}>
          {busy === 'grant' ? 'Granting…' : 'Grant Premium'}
        </button>
        {grantMsg && <div className={`mt-3 text-sm font-semibold ${grantMsg.startsWith('✓') ? 'text-ok' : 'text-bad'}`}>{grantMsg}</div>}
      </div>
    </>
  );
}

function Num({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <input className="input !py-2 text-sm" type="number" min="0" step="1"
        value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
