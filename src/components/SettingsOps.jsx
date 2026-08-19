import { useEffect, useState } from 'react';
import { api, inr, exportCsv } from '../lib/api';
import { toast } from './Toaster.jsx';
import { phone } from './ActivityList.jsx';

export default function SettingsOps() {
  const [sys, setSys] = useState(null);
  useEffect(() => { api.system().then(setSys).catch(() => {}); }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PaymentModeCard sys={sys} />
      <SystemCard sys={sys} />
      <RecoverPaymentCard />
      <RemoveMobileCard />
      <ExportCard />
    </div>
  );
}

function PaymentModeCard({ sys }) {
  const live = sys?.payment_mode === 'live';
  return (
    <div className="card p-6">
      <h2 className="font-bold text-ink">Payment mode</h2>
      <p className="mt-1 text-sm text-muted">Which Razorpay keys the server is using right now.</p>
      <div className="mt-4 flex items-center gap-3">
        <span className={`chip px-3 py-1.5 text-sm ${live ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>
          {sys ? (live ? '🟢 LIVE — taking real payments' : '🧪 TEST mode') : '…'}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-muted">
        Mode is set by the Razorpay keys in the server environment. To switch, change the keys and restart —
        it isn't toggled from here, to prevent an accidental live/test mix-up.
      </p>
    </div>
  );
}

function SystemCard({ sys }) {
  if (!sys) return <div className="card p-6 text-sm text-muted">Loading system…</div>;
  const c = sys.counts, t = sys.today;
  const rows = [
    ['Users', c.users], ['Vehicles cached', c.vehicles], ['Reports', c.reports],
    ['Payments', c.payments], ['Invoices', c.invoices], ['Site visits', c.visits], ['Tickets', c.tickets],
  ];
  return (
    <div className="card p-6">
      <h2 className="font-bold text-ink">System &amp; database</h2>
      <p className="mt-1 text-sm text-muted">Database size <b className="text-ink">{sys.db_size}</b></p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-panel p-3">
            <div className="text-lg font-black text-ink nums">{Number(v).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-muted">{k}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-line p-3 text-xs text-body">
        <b>Today:</b> {t.reports_today} reports · {t.visits_today} visits · {t.payments_today} payments
      </div>
    </div>
  );
}

function RecoverPaymentCard() {
  const [pid, setPid] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { const r = await api.reconcilePayment(pid.trim()); toast(r.message || 'Done', 'success'); setPid(''); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="card p-6">
      <h2 className="font-bold text-ink">Recover a payment</h2>
      <p className="mt-1 text-sm text-muted">
        Paid on Razorpay but the report/invoice never generated? Paste the payment id to re-run fulfilment. Safe & idempotent.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input className="input flex-1 font-mono text-sm" placeholder="pay_XXXXXXXXXXXXXX" value={pid} onChange={(e) => setPid(e.target.value)} />
        <button className="btn-primary" disabled={busy || !/^pay_/.test(pid.trim())} onClick={run}>
          {busy ? 'Recovering…' : 'Recover'}
        </button>
      </div>
    </div>
  );
}

function RemoveMobileCard() {
  const [mobile, setMobile] = useState('');
  const [found, setFound] = useState(null);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    setFound(null); setConfirm('');
    try {
      const r = await api.mobileLookup(mobile);
      setFound(r);
      if (!r.found) toast('No user with that mobile.', 'error');
    } catch (e) { toast(e.message, 'error'); }
  };
  const purge = async () => {
    setBusy(true);
    try {
      const r = await api.mobilePurge(found.mobile, confirm);
      toast(r.message || 'Removed.', 'success');
      setFound(null); setMobile(''); setConfirm('');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  const transacted = found?.found && found.stats.paid_payments > 0;
  return (
    <div className="card border-2 border-red-200 p-6">
      <h2 className="font-bold text-red-700">Remove a mobile number</h2>
      <p className="mt-1 text-sm text-muted">
        Permanently delete a non-paying user and all their data (vehicles, basic reports, sessions, consents).
        <b className="text-ink"> Numbers that ever paid are refused</b> — their financial/GST records must be kept.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input className="input flex-1 font-mono text-sm" placeholder="10-digit mobile" value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
        <button className="btn-ghost" onClick={lookup} disabled={mobile.length < 10}>Look up</button>
      </div>

      {found?.found && (
        <div className="mt-4 rounded-xl border border-line p-4 text-sm">
          <div className="font-semibold text-ink">{found.user.full_name || '—'} <span className="text-xs font-normal text-muted nums">{phone(found.user.wa_id)}</span></div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Stat k="Vehicles" v={found.stats.vehicles} />
            <Stat k="Reports" v={found.stats.reports} />
            <Stat k="Paid" v={found.stats.paid_payments} />
            <Stat k="Spent" v={inr(found.stats.spent)} />
          </div>
          {transacted ? (
            <p className="mt-3 rounded-lg bg-warn/10 p-2 text-xs font-semibold text-warn">
              This number has paid — removal is refused to protect financial records.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input className="input w-44 border-red-200 font-mono text-sm" placeholder="Re-type the number" value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 10))} />
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                disabled={busy || confirm !== found.mobile} onClick={purge}>
                {busy ? 'Removing…' : 'Remove permanently'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
const Stat = ({ k, v }) => (
  <div className="rounded-lg bg-panel p-2 text-center">
    <div className="font-black text-ink nums">{v}</div>
    <div className="text-[10px] text-muted">{k}</div>
  </div>
);

function ExportCard() {
  const [busy, setBusy] = useState('');
  const dl = async (t) => { setBusy(t); try { await exportCsv(t); } catch (e) { toast(e.message, 'error'); } finally { setBusy(''); } };
  return (
    <div className="card p-6">
      <h2 className="font-bold text-ink">Database export</h2>
      <p className="mt-1 text-sm text-muted">Download your financial records as CSV — for accounting, GST filing or backup.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-ghost" disabled={busy === 'payments'} onClick={() => dl('payments')}>{busy === 'payments' ? 'Exporting…' : '↓ Payments CSV'}</button>
        <button className="btn-ghost" disabled={busy === 'invoices'} onClick={() => dl('invoices')}>{busy === 'invoices' ? 'Exporting…' : '↓ Invoices CSV'}</button>
      </div>
    </div>
  );
}
