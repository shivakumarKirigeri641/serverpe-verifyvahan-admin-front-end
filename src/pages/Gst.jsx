import { api, inr, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, StatCard, Table, Badge, Empty } from '../components/ui.jsx';

export default function Gst() {
  const { data, loading, error, reload } = useAsync(() => api.gst(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const t = data.totals;

  return (
    <>
      <PageHead title="GST" sub="Tax collected across all invoices." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Invoices" value={t.invoices} />
        <StatCard label="Taxable value" value={inr(t.taxable)} />
        <StatCard label="Total tax" value={inr(t.total_tax)} accent="text-brand" sub={`CGST ${inr(t.cgst)} · SGST ${inr(t.sgst)} · IGST ${inr(t.igst)}`} />
        <StatCard label="Gross collected" value={inr(t.gross)} accent="text-ok" />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-muted">By month</h2>
      {data.months.length === 0 ? <Empty>No invoices yet.</Empty> : (
        <Table cols={['Month', 'Invoices', 'Taxable', 'Tax', 'Gross']}>
          {data.months.map((m) => (
            <tr key={m.month}>
              <td className="td font-semibold text-ink">{m.month}</td>
              <td className="td">{m.invoices}</td>
              <td className="td">{inr(m.taxable)}</td>
              <td className="td">{inr(m.tax)}</td>
              <td className="td font-bold">{inr(m.gross)}</td>
            </tr>
          ))}
        </Table>
      )}

      <h2 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-muted">Recent invoices</h2>
      {data.recent.length === 0 ? <Empty>No invoices yet.</Empty> : (
        <Table cols={['Invoice', 'Customer', 'Place of supply', 'Taxable', 'Tax', 'Gross', 'Date']}>
          {data.recent.map((i) => (
            <tr key={i.invoice_number}>
              <td className="td font-mono text-xs">{i.invoice_number}</td>
              <td className="td font-semibold text-ink">{i.customer_name || '—'}</td>
              <td className="td">{i.place_of_supply || '—'} <Badge value={i.is_interstate ? 'IGST' : 'CGST+SGST'} /></td>
              <td className="td">{inr(i.taxable_amount)}</td>
              <td className="td">{inr(i.total_tax)}</td>
              <td className="td font-bold">{inr(i.gross_amount)}</td>
              <td className="td whitespace-nowrap text-muted">{day(i.invoice_date)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
