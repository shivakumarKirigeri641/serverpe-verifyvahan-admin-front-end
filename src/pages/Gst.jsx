import { api, inr, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Badge, Empty } from '../components/ui.jsx';
import { KpiTile, Donut, BarChart, Panel } from '../components/charts.jsx';

const inrK = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + 'L';
  if (v >= 1e3) return '₹' + (v / 1e3).toFixed(1) + 'k';
  return '₹' + v.toFixed(0);
};

export default function Gst({ embedded = false }) {
  const { data, loading, error, reload } = useAsync(() => api.gst(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const t = data.totals;
  const months = [...(data.months || [])].reverse();   // oldest → newest for the chart

  return (
    <>
      {!embedded && (
        <PageHead title="GST" sub="Tax collected across all invoices."
          right={<button className="btn-ghost text-sm" onClick={reload}>↻ Refresh</button>} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Invoices" value={t.invoices} />
        <KpiTile label="Taxable value" value={inr(t.taxable)} />
        <KpiTile label="Total tax" value={inr(t.total_tax)} tone="text-brand" sub="collected & payable" />
        <KpiTile label="Gross collected" value={inr(t.gross)} tone="text-ok" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Tax composition" sub="What makes up the tax you owe">
          <Donut centerLabel="Total tax" format={inrK}
            segments={[
              { label: 'CGST', value: t.cgst, color: '#00A884' },
              { label: 'SGST', value: t.sgst, color: '#2563EB' },
              { label: 'IGST', value: t.igst, color: '#DB2777' },
            ]} />
        </Panel>
        <Panel className="lg:col-span-2" title="Tax by month" sub="Tax collected per month">
          {months.length === 0 ? <Empty>No invoices yet.</Empty> : (
            <BarChart data={months} xKey="month" yKey="tax" format={inr} color="#00A884" />
          )}
        </Panel>
      </div>

      <Panel className="mt-6" title="By month">
        {data.months.length === 0 ? <Empty>No invoices yet.</Empty> : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="tbl w-full min-w-[520px]">
              <thead className="border-y border-line bg-panel"><tr>{['Month', 'Invoices', 'Taxable', 'Tax', 'Gross'].map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {data.months.map((m) => (
                  <tr key={m.month}>
                    <td className="td font-semibold text-ink">{m.month}</td>
                    <td className="td nums">{m.invoices}</td>
                    <td className="td nums">{inr(m.taxable)}</td>
                    <td className="td nums">{inr(m.tax)}</td>
                    <td className="td font-bold nums">{inr(m.gross)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="mt-6" title="Recent invoices">
        {data.recent.length === 0 ? <Empty>No invoices yet.</Empty> : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="tbl w-full min-w-[720px]">
              <thead className="border-y border-line bg-panel"><tr>{['Invoice', 'Customer', 'Place of supply', 'Taxable', 'Tax', 'Gross', 'Date'].map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {data.recent.map((i) => (
                  <tr key={i.invoice_number}>
                    <td className="td font-mono text-xs">{i.invoice_number}</td>
                    <td className="td font-semibold text-ink">{i.customer_name || '—'}</td>
                    <td className="td">{i.place_of_supply || '—'} <Badge value={i.is_interstate ? 'IGST' : 'CGST+SGST'} /></td>
                    <td className="td nums">{inr(i.taxable_amount)}</td>
                    <td className="td nums">{inr(i.total_tax)}</td>
                    <td className="td font-bold nums">{inr(i.gross_amount)}</td>
                    <td className="td whitespace-nowrap text-muted">{day(i.invoice_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
