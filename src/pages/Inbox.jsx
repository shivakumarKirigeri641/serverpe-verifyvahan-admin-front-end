import { useState } from 'react';
import { api, dt } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Empty } from '../components/ui.jsx';

const STATUS_MARK = { sent: '✓', delivered: '✓✓', read: '✓✓', failed: '✗ failed', sending: '⏳' };

export default function Inbox() {
  const { data, loading, error, reload } = useAsync(() => api.inbox(), []);
  const [openWa, setOpenWa] = useState(null);
  const [q, setQ] = useState('');

  const convos = (data?.conversations || []).filter((c) => {
    if (!q.trim()) return true;
    const t = q.trim().toLowerCase();
    return [c.full_name, c.profile_name, c.wa_id].some((x) => (x || '').toLowerCase().includes(t));
  });

  return (
    <>
      <PageHead title="Inbox" sub="WhatsApp conversations."
        right={<input className="input !py-2 w-56" placeholder="Search number or name…" value={q} onChange={(e) => setQ(e.target.value)} />} />

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : convos.length === 0 ? <Empty>{q ? 'No conversations match that search.' : 'No conversations yet.'}</Empty> : (
        <div className="card divide-y divide-line">
          {convos.map((c) => (
            <button key={c.wa_id} onClick={() => setOpenWa(c.wa_id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-panel">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand">
                {(c.full_name || c.profile_name || c.wa_id || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{c.full_name || c.profile_name || c.wa_id}</span>
                  <span className="shrink-0 text-xs text-muted">{dt(c.last_at)}</span>
                </div>
                <div className="truncate text-sm text-muted">
                  {c.last_direction === 'outbound' ? '↩ ' : ''}{(c.last_content || '').replace(/\n/g, ' ')}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-line px-2 py-0.5 text-[11px] font-bold text-muted">{c.messages}</span>
            </button>
          ))}
        </div>
      )}

      {openWa && <Thread waId={openWa} onClose={() => setOpenWa(null)} />}
    </>
  );
}

function Thread({ waId, onClose }) {
  const { data, loading, error } = useAsync(() => api.thread(waId), [waId]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col bg-[#e9f3ef] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-brand px-5 py-3 text-white">
          <div className="font-bold">{waId}</div>
          <button className="p-1 text-white/80 hover:text-white" onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : data.messages.map((m) => (
            <div key={m.id} className={`flex ${m.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.direction === 'inbound' ? 'rounded-bl-sm bg-white' : 'rounded-br-sm bg-[#d9fdd3]'}`}>
                <div className="whitespace-pre-line text-ink">{m.content || `[${m.message_type}]`}</div>
                <div className="mt-1 text-right text-[10px] text-muted">
                  {dt(m.created_at)}
                  {m.direction === 'outbound' && m.status && (
                    <span className={m.status === 'failed' ? 'text-bad' : m.status === 'read' ? 'text-sky-600' : ''}> · {STATUS_MARK[m.status] || m.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data && data.messages.length === 0 && <Empty>No messages.</Empty>}
        </div>
      </div>
    </div>
  );
}
