import { useState } from 'react';
import { api, inr, dt } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, StatCard, Table, Badge, Empty } from '../components/ui.jsx';

const FILTERS = [['', 'All'], ['captured', 'Captured'], ['created', 'Pending'], ['failed', 'Failed']];

export default function Finance() {
  const [tab, setTab] = useState('money');
  return (
    <>
      <PageHead title="Finance" sub={tab === 'money' ? 'Turnover, GST and what is yours to withdraw.' : 'Every payment and its invoice.'}
        right={
          <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
            {[['money', 'Money'], ['payments', 'Payments']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
        } />
      {tab === 'money' ? <Money /> : <Payments />}
    </>
  );
}

function Money() {
  const { data, loading, error, reload } = useAsync(() => api.money(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const d = data;
  const neg = d.withdrawable < 0;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Collected" value={inr(d.collected)} sub={`${d.payments} payments · GST inclusive`} accent="text-brand" />
        <StatCard label="Costs & GST set aside" value={inr(d.output_gst + d.ulip_cost + d.gateway_fees)} sub={`GST ${inr(d.output_gst)} · ULIP ${inr(d.ulip_cost)} · fees ${inr(d.gateway_fees)}`} accent="text-warn" />
        <StatCard label="Withdrawable (drawable)" value={inr(d.withdrawable)} sub="Yours to draw, safely" accent={neg ? 'text-bad' : 'text-ok'} />
      </div>

      {/* the walk-down */}
      <div className="mt-6 card p-6 max-w-md">
        <h3 className="text-sm font-bold text-ink">Turnover → withdrawable</h3>
        <div className="mt-4 space-y-2 text-sm">
          <Row label="Collected" value={d.collected} />
          <Row label="GST set aside" value={d.output_gst} minus />
          <Row label="ULIP API cost" value={d.ulip_cost} minus />
          <Row label="Gateway fees" value={d.gateway_fees} minus />
          <div className="!mt-3 flex items-center justify-between border-t border-line pt-3 font-bold">
            <span className={neg ? 'text-bad' : 'text-brand'}>Withdrawable</span>
            <span className={`tabular-nums ${neg ? 'text-bad' : 'text-brand'}`}>{inr(d.withdrawable)}</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">
          Keep <b>{inr(d.output_gst)}</b> aside for your GST return — it isn’t part of your drawable profit.
        </p>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-muted">By month</h2>
      <Table cols={['Month', 'Collected', 'GST', 'ULIP', 'Fees', 'Withdrawable']}>
        {d.months.map((m) => (
          <tr key={m.month}>
            <td className="td font-semibold text-ink">{m.month}</td>
            <td className="td">{inr(m.collected)}</td>
            <td className="td text-muted">{inr(m.output_gst)}</td>
            <td className="td text-muted">{inr(m.ulip_cost)}</td>
            <td className="td text-muted">{inr(m.fees)}</td>
            <td className={`td font-bold ${Number(m.withdrawable) < 0 ? 'text-bad' : 'text-brand'}`}>{inr(m.withdrawable)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

const Row = ({ label, value, minus }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted">{label}</span>
    <span className="tabular-nums text-ink">{minus ? '− ' : ''}{inr(value)}</span>
  </div>
);

function Payments() {
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useAsync(() => api.payments({ status, limit: 100 }), [status]);
  return (
    <>
      <div className="mb-4 flex gap-1 rounded-xl border border-line bg-white p-1 w-max">
        {FILTERS.map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : data.payments.length === 0 ? <Empty>No payments in this view.</Empty> : (
        <Table cols={['Customer', 'Amount', 'Method', 'Status', 'Invoice', 'Payment ID', 'When']}>
          {data.payments.map((p) => (
            <tr key={p.id}>
              <td className="td font-semibold text-ink">{p.full_name || p.profile_name || p.wa_id || '—'}</td>
              <td className="td font-bold">{inr(p.amount)}</td>
              <td className="td uppercase">{p.method || '—'}</td>
              <td className="td"><Badge value={p.status} /></td>
              <td className="td font-mono text-xs">{p.invoice_number || '—'}</td>
              <td className="td font-mono text-xs text-muted">{p.razorpay_payment_id || '—'}</td>
              <td className="td text-muted">{dt(p.paid_at || p.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
