import { useState } from 'react';
import { api, dt } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Badge, Empty } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';

const FILTERS = [['', 'All'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In progress'], ['RESOLVED', 'Resolved'], ['CLOSED', 'Closed']];
const NEXT = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED', CLOSED: 'OPEN' };
const NEXT_LABEL = { OPEN: 'Start', IN_PROGRESS: 'Resolve', RESOLVED: 'Close', CLOSED: 'Reopen' };

// Canned reply snippets — inserted into the composer, then edited before sending.
const TEMPLATES = [
  ['Greeting', 'Hi {name},\n\nThank you for reaching out to GaadiPe support.\n\n'],
  ['Resolved', 'We have looked into your query and resolved it. '],
  ['Need info', 'To help you further, could you please share the vehicle number and the transaction/reference ID?\n\n'],
  ['Refund', 'We have initiated a refund for this transaction. It typically reflects in 5–7 working days.\n\n'],
  ['Sign-off', '\n\nDo let us know if there is anything else we can help with.'],
];

export default function Tickets() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(null);
  const [reply, setReply] = useState(null);   // ticket being replied to
  const { data, loading, error, reload } = useAsync(() => api.tickets({ status, limit: 200 }), [status]);

  const advance = async (t) => {
    setBusy(t.id);
    try { await api.setTicketStatus(t.id, NEXT[t.status] || 'IN_PROGRESS'); reload(); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(null); }
  };

  return (
    <>
      <PageHead title="Support" sub="Email tickets (support@gaadipe.in) can be replied to right here."
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
        <Table cols={['Ticket', 'From', 'Channel', 'Subject / message', 'Status', 'Raised', 'Action']}>
          {data.tickets.map((t) => (
            <tr key={t.id}>
              <td className="td font-mono text-xs">{t.ticket_number}</td>
              <td className="td">
                <div className="font-semibold text-ink">{t.customer_name || t.from_email || t.wa_id || '—'}</div>
                <div className="text-xs text-muted">{t.from_email || t.wa_id}{t.reg_no ? ` · ${t.reg_no}` : ''}</div>
              </td>
              <td className="td">
                <span className={`chip ${t.channel === 'email' ? 'bg-blue-soft text-blue' : 'bg-line text-muted'}`}>{t.channel || 'web'}</span>
              </td>
              <td className="td max-w-xs">
                {t.subject && <div className="font-semibold text-ink line-clamp-1">{t.subject}</div>}
                <span className="text-xs text-muted line-clamp-2">{t.message}</span>
              </td>
              <td className="td"><Badge value={t.status} /></td>
              <td className="td whitespace-nowrap text-muted">{dt(t.created_at)}</td>
              <td className="td">
                <div className="flex gap-1.5">
                  {t.from_email && <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => setReply(t)}>Reply</button>}
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" disabled={busy === t.id} onClick={() => advance(t)}>
                    {busy === t.id ? '…' : (NEXT_LABEL[t.status] || 'Update')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {reply && <ReplyDrawer ticket={reply} onClose={() => setReply(null)} onSent={() => { setReply(null); reload(); }} />}
    </>
  );
}

function ReplyDrawer({ ticket, onClose, onSent }) {
  const firstName = (ticket.customer_name || '').trim().split(/\s+/)[0] || 'there';
  const [subject, setSubject] = useState(`Re: ${ticket.subject || ticket.ticket_number}`);
  const [body, setBody] = useState('');
  const [resolve, setResolve] = useState(true);
  const [busy, setBusy] = useState(false);

  const insert = (snippet) => setBody((b) => (b + snippet).replace(/\{name\}/g, firstName));

  const send = async () => {
    setBusy(true);
    try {
      await api.replyTicket(ticket.id, { subject, body, resolve });
      toast('Reply sent from support@gaadipe.in', 'success');
      onSent();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-panel p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-ink">Reply to ticket</h3>
          <button className="text-muted hover:text-ink" onClick={onClose}>✕</button>
        </div>

        <div className="mt-4 card p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-brand">{ticket.ticket_number}</span>
            <Badge value={ticket.status} />
          </div>
          <div className="mt-2 text-muted">From <b className="text-ink">{ticket.from_email}</b></div>
          {ticket.subject && <div className="mt-1 font-bold text-ink">{ticket.subject}</div>}
          <div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-line/20 p-3 text-[13px] text-body">{ticket.message}</div>
        </div>

        <div className="mt-4 card flex-1 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Reply — sent from support@gaadipe.in</div>
          <input className="input mt-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TEMPLATES.map(([label, snip]) => (
              <button key={label} onClick={() => insert(snip)} className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-muted hover:border-brand hover:text-brand">
                + {label}
              </button>
            ))}
          </div>
          <textarea className="input mt-2 min-h-[220px] w-full resize-y text-sm" placeholder="Write your reply…" value={body} onChange={(e) => setBody(e.target.value)} />
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-body">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={resolve} onChange={(e) => setResolve(e.target.checked)} />
            Mark ticket resolved after sending
          </label>
          <button className="btn-primary mt-4 w-full" disabled={busy || body.trim().length < 5} onClick={send}>
            {busy ? 'Sending…' : `Send reply${resolve ? ' & resolve' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
