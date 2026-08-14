import { useState } from 'react';
import { api, dt } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Badge, Empty } from '../components/ui.jsx';

const FILTERS = [['', 'All'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In progress'], ['RESOLVED', 'Resolved'], ['CLOSED', 'Closed']];
const NEXT = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED', CLOSED: 'OPEN' };
const NEXT_LABEL = { OPEN: 'Start', IN_PROGRESS: 'Resolve', RESOLVED: 'Close', CLOSED: 'Reopen' };

export default function Tickets() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(null);
  const { data, loading, error, reload } = useAsync(() => api.tickets({ status, limit: 200 }), [status]);

  const advance = async (t) => {
    setBusy(t.id);
    try { await api.setTicketStatus(t.id, NEXT[t.status] || 'IN_PROGRESS'); reload(); }
    catch (e) { alert(e.message); } finally { setBusy(null); }
  };

  return (
    <>
      <PageHead title="Support tickets" sub="One open ticket per user; resolve to let them raise a new one."
        right={
          <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
            {FILTERS.map(([v, l]) => (
              <button key={v} onClick={() => setStatus(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
        } />

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : data.tickets.length === 0 ? <Empty>No tickets in this view.</Empty> : (
        <Table cols={['Ticket', 'From', 'Topic', 'Message', 'Status', 'Raised', 'Action']}>
          {data.tickets.map((t) => (
            <tr key={t.id}>
              <td className="td font-mono text-xs">{t.ticket_number}</td>
              <td className="td">
                <div className="font-semibold text-ink">{t.customer_name || t.wa_id}</div>
                <div className="text-xs text-muted">{t.wa_id}{t.reg_no ? ` · ${t.reg_no}` : ''}</div>
              </td>
              <td className="td whitespace-nowrap">{t.query_name || '—'}</td>
              <td className="td max-w-xs"><span className="line-clamp-2">{t.message}</span></td>
              <td className="td"><Badge value={t.status} /></td>
              <td className="td whitespace-nowrap text-muted">{dt(t.created_at)}</td>
              <td className="td">
                <button className="btn-ghost !px-3 !py-1.5 text-xs" disabled={busy === t.id} onClick={() => advance(t)}>
                  {busy === t.id ? '…' : (NEXT_LABEL[t.status] || 'Update')}
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
