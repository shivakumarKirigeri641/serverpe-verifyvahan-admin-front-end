import { useState } from 'react';
import { api, inr, dt, openInvoicePdf, openReportPdf, downloadAdConversions } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Badge, Empty } from '../components/ui.jsx';
import { KpiTile, Donut, Panel } from '../components/charts.jsx';
import { toast } from '../components/Toaster.jsx';
import Gst from './Gst.jsx';

const inrK = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + 'L';
  if (v >= 1e3) return '₹' + (v / 1e3).toFixed(1) + 'k';
  return '₹' + v.toFixed(0);
};

const FILTERS = [['', 'All'], ['captured', 'Captured'], ['created', 'Pending'], ['failed', 'Failed']];

const SUBS = { money: 'Turnover, GST and what is yours to withdraw.', payments: 'Every payment and its invoice.', gst: 'Tax collected across all invoices.' };

export default function Finance() {
  const [tab, setTab] = useState('money');
  return (
    <>
      <PageHead title="Finance & GST" sub={SUBS[tab]}
        right={
          <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
            {[['money', 'Money'], ['payments', 'Payments'], ['gst', 'GST']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
        } />
      {tab === 'money' ? <Money /> : tab === 'payments' ? <Payments /> : <Gst embedded />}
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
        <KpiTile label="Collected" value={inr(d.collected)} sub={`${d.payments} payments · GST inclusive`} tone="text-brand" />
        <KpiTile label="Costs & GST set aside" value={inr(d.output_gst + d.ulip_cost + d.gateway_fees)} sub={`GST ${inr(d.output_gst)} · ULIP ${inr(d.ulip_cost)} · fees ${inr(d.gateway_fees)}`} tone="text-warn" />
        <KpiTile label="Withdrawable" value={inr(d.withdrawable)} sub="Yours to draw, safely" tone={neg ? 'text-bad' : 'text-ok'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* where the collected money splits */}
        <Panel title="Where your turnover goes" sub="Collected, split into what's yours vs. set aside">
          <Donut centerLabel="Collected" format={inrK}
            segments={[
              { label: 'Withdrawable', value: Math.max(0, d.withdrawable), color: '#00A884' },
              { label: 'GST set aside', value: d.output_gst, color: '#2563EB' },
              { label: 'ULIP cost', value: d.ulip_cost, color: '#DB2777' },
              { label: 'Gateway fees', value: d.gateway_fees, color: '#CA8A04' },
            ]} />
        </Panel>

        {/* the walk-down */}
        <Panel title="Turnover → withdrawable" sub="How the drawable figure is reached">
          <div className="space-y-2 text-sm">
            <Row label="Collected" value={d.collected} />
            <Row label="GST set aside" value={d.output_gst} minus />
            <Row label="ULIP API cost" value={d.ulip_cost} minus />
            <Row label="Gateway fees" value={d.gateway_fees} minus />
            <div className="!mt-3 flex items-center justify-between border-t border-line pt-3 font-bold">
              <span className={neg ? 'text-bad' : 'text-brand'}>Withdrawable</span>
              <span className={`nums ${neg ? 'text-bad' : 'text-brand'}`}>{inr(d.withdrawable)}</span>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-warn/5 p-3 text-xs text-body">
            Keep <b className="text-warn">{inr(d.output_gst)}</b> aside for your GST return — it isn’t part of your drawable profit.
          </p>
        </Panel>
      </div>

      <Panel className="mt-6" title="By month">
        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="tbl w-full min-w-[560px]">
            <thead className="border-y border-line bg-panel"><tr>{['Month', 'Collected', 'GST', 'ULIP', 'Fees', 'Withdrawable'].map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {d.months.map((m) => (
                <tr key={m.month}>
                  <td className="td font-semibold text-ink">{m.month}</td>
                  <td className="td nums">{inr(m.collected)}</td>
                  <td className="td text-muted nums">{inr(m.output_gst)}</td>
                  <td className="td text-muted nums">{inr(m.ulip_cost)}</td>
                  <td className="td text-muted nums">{inr(m.fees)}</td>
                  <td className={`td font-bold nums ${Number(m.withdrawable) < 0 ? 'text-bad' : 'text-brand'}`}>{inr(m.withdrawable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <AdAttribution />
    </>
  );
}

function AdAttribution() {
  const { data, loading, error } = useAsync(() => api.attribution(), []);
  const dl = async () => { try { await downloadAdConversions(90); } catch (e) { toast(e.message, 'error'); } };
  if (loading || error || !data) return null;   // optional card — never blocks the page
  const d = data;
  const cpa = d.ad_sales ? d.ad_revenue / d.ad_sales : 0;
  return (
    <Panel className="mt-6" title="Ad attribution — Google Ads → sale" sub="Clicks captured, and sales traced back to an ad click">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="Ad clicks captured" value={d.clicks} sub={`${d.matched} reached WhatsApp`} tone="text-brand" />
        <KpiTile label="Ad-attributed sales" value={`${d.ad_sales} / ${d.sales}`} sub={`${inr(d.ad_revenue)} of ${inr(d.revenue)} revenue`} tone="text-ok" />
        <div className="flex flex-col justify-center rounded-2xl border border-line p-4">
          <button className="btn-primary text-sm" onClick={dl}>Download Google Ads conversions (CSV)</button>
          <p className="mt-2 text-[11px] text-muted">
            Upload in Google Ads → Tools → Conversions → Uploads to feed Smart Bidding with real sales.
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Attribution links a Google Ad click (gclid) → the WhatsApp chat it started → the purchase, so you see which ad spend actually earns.
      </p>
    </Panel>
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
  const [openId, setOpenId] = useState(null);
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
        <Table cols={['Customer', 'Amount', 'Method', 'Status', 'Invoice', 'Payment ID', 'When', '']}>
          {data.payments.map((p) => (
            <tr key={p.id} className="cursor-pointer hover:bg-brand/5" onClick={() => setOpenId(p.id)}>
              <td className="td font-semibold text-ink">{p.full_name || p.profile_name || p.wa_id || '—'}</td>
              <td className="td font-bold">{inr(p.amount)}</td>
              <td className="td uppercase">{p.method || '—'}</td>
              <td className="td"><Badge value={p.status} /></td>
              <td className="td font-mono text-xs">{p.invoice_number || '—'}</td>
              <td className="td font-mono text-xs text-muted">{p.razorpay_payment_id || '—'}</td>
              <td className="td text-muted">{dt(p.paid_at || p.created_at)}</td>
              <td className="td text-brand text-xs font-bold">View ›</td>
            </tr>
          ))}
        </Table>
      )}
      {openId && <PaymentDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function PaymentDrawer({ id, onClose }) {
  const { data, loading, error, reload } = useAsync(() => api.paymentDetail(id), [id]);
  const p = data?.payment;
  const dl = (fn, arg) => async (e) => { e.stopPropagation(); try { await fn(arg); } catch (err) { toast(err.message, 'error'); } };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-panel p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-ink">Payment detail</h3>
          <button className="text-muted hover:text-ink" onClick={onClose}>✕</button>
        </div>

        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : p && (
          <div className="mt-4 space-y-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-black text-brand">{inr(p.amount)}</div>
              <div className="mt-1"><Badge value={p.status} /> {p.channel && <span className="ml-1 rounded-full bg-line px-2 py-0.5 text-[10px] font-bold uppercase text-muted">{p.channel}</span>}</div>
            </div>

            <Section title="Customer">
              <KV k="Name" v={p.customer_name} />
              <KV k="Mobile" v={p.wa_id} />
              <KV k="Contact" v={p.contact} />
              <KV k="Email" v={p.email} />
              <KV k="State" v={p.state_name || p.place_of_supply} />
            </Section>

            <Section title="Gateway">
              <KV k="Method" v={(p.method || '—').toUpperCase()} />
              <KV k="Order ID" v={p.razorpay_order_id} mono />
              <KV k="Payment ID" v={p.razorpay_payment_id} mono />
              <KV k="Created" v={dt(p.created_at)} />
              <KV k="Paid" v={p.paid_at ? dt(p.paid_at) : '—'} />
            </Section>

            <Section title={`Vehicles (${p.items?.length || p.reports?.length || 0})`}>
              {(p.items?.length ? p.items : p.reports).map((it, i) => (
                <div key={i} className="flex items-center justify-between border-t border-line py-1.5 first:border-0">
                  <span className="font-semibold text-ink">{it.reg_no}</span>
                  {it.amount != null && <span className="text-muted">{inr(it.amount)}</span>}
                </div>
              ))}
            </Section>

            {p.invoice_id && (
              <Section title={`GST invoice · ${p.invoice_number || ''}`}>
                <KV k="Taxable" v={inr(p.taxable_amount)} />
                {p.is_interstate
                  ? <KV k="IGST" v={inr(p.igst_amount)} />
                  : <><KV k="CGST" v={inr(p.cgst_amount)} /><KV k="SGST" v={inr(p.sgst_amount)} /></>}
                <KV k="Total" v={inr(p.gross_amount)} bold />
                <button className="btn-ghost mt-2 w-full text-xs" onClick={dl(openInvoicePdf, p.invoice_id)}>Download invoice</button>
              </Section>
            )}

            {p.reports?.length > 0 && (
              <Section title="Reports">
                {p.reports.map((r) => (
                  <button key={r.id} className="flex w-full items-center justify-between border-t border-line py-1.5 text-left first:border-0 hover:text-brand"
                    onClick={dl(openReportPdf, r.id)}>
                    <span><span className="font-semibold text-ink">{r.reg_no}</span> <span className="text-xs text-muted">{r.report_number}</span></span>
                    <span className="text-xs font-bold text-brand">PDF ↓</span>
                  </button>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="card p-4">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{title}</div>
    <div className="space-y-1 text-sm">{children}</div>
  </div>
);
const KV = ({ k, v, mono, bold }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-muted">{k}</span>
    <span className={`text-right ${mono ? 'font-mono text-xs' : ''} ${bold ? 'font-bold text-brand' : 'text-ink'}`}>{v || '—'}</span>
  </div>
);
