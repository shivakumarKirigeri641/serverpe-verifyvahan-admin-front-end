import { useState } from 'react';
import { api, openInvoicePdf, inr, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Empty, StatCard } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';

export default function Invoices() {
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useAsync(() => api.invoices({ limit: 300 }), []);

  const rows = (data?.invoices || []).filter((i) => {
    const s = q.trim().toLowerCase();
    return !s || `${i.invoice_number} ${i.customer_name || ''} ${i.customer_mobile || ''}`.toLowerCase().includes(s);
  });
  const gross = rows.reduce((a, i) => a + Number(i.gross_amount || 0), 0);
  const tax = rows.reduce((a, i) => a + Number(i.total_tax || 0), 0);

  const download = async (id) => { try { await openInvoicePdf(id); } catch (e) { toast(e.message, 'error'); } };

  return (
    <>
      <PageHead title="Invoices" sub="GST tax invoices — searchable ledger."
        right={<input className="input max-w-[260px]" placeholder="Search invoice / customer / mobile" value={q} onChange={(e) => setQ(e.target.value)} />} />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Invoices" value={rows.length} />
        <StatCard label="Gross collected" value={inr(gross)} accent="text-brand" />
        <StatCard label="GST in it" value={inr(tax)} accent="text-warn" />
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : rows.length === 0 ? <Empty>No invoices match.</Empty> : (
          <Table cols={['Invoice no', 'Customer', 'Amount', 'GST', 'Place of supply', 'Date', '']}>
            {rows.map((i) => (
              <tr key={i.id}>
                <td className="td font-semibold text-ink">{i.invoice_number}</td>
                <td className="td">{i.customer_name || '—'}<div className="text-xs text-muted">{i.customer_mobile || ''}</div></td>
                <td className="td">{inr(i.gross_amount)}</td>
                <td className="td text-muted">
                  {i.is_interstate
                    ? `IGST ${inr(i.igst_amount)}`
                    : `CGST+SGST ${inr(Number(i.cgst_amount) + Number(i.sgst_amount))}`}
                </td>
                <td className="td text-muted">{i.place_of_supply || '—'}</td>
                <td className="td text-muted">{day(i.invoice_date)}</td>
                <td className="td"><button className="btn-ghost text-xs" onClick={() => download(i.id)}>Download</button></td>
              </tr>
            ))}
          </Table>
        )}
    </>
  );
}
