import { useState } from 'react';
import { api, dt } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Empty } from '../components/ui.jsx';

const fmtDur = (sec) => {
  if (sec == null) return '—';
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60); return `${h}h ${m % 60}m`;
};
const place = (s) => [s.ip_city, s.ip_region, s.ip_country].filter(Boolean).join(', ') || '—';
const device = (s) => [s.browser_name, s.os_name, s.device_model].filter(Boolean).join(' · ') || '—';
const KIND = { basic_report: 'Basic report', full_report: 'Full report', invoice: 'GST invoice' };

export default function Logins() {
  const [tab, setTab] = useState('sessions');
  return (
    <>
      <PageHead title="Logins & downloads" sub={tab === 'sessions' ? 'Every web login — device, location, duration and vehicles explored.' : 'Every report / invoice download, with timestamps.'}
        right={
          <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
            {[['sessions', 'Login history'], ['downloads', 'Downloads']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
        } />
      {tab === 'sessions' ? <Sessions /> : <Downloads />}
    </>
  );
}

function Sessions() {
  const { data, loading, error, reload } = useAsync(() => api.sessions({ limit: 150 }), []);
  const [openId, setOpenId] = useState(null);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const rows = data.sessions || [];
  if (!rows.length) return <Empty>No logins yet.</Empty>;

  return (
    <>
      <Table cols={['User', 'Logged in', 'Duration', 'Device', 'Location', 'Vehicles', 'Status', '']}>
        {rows.map((s) => (
          <tr key={s.id} className="cursor-pointer hover:bg-brand/5" onClick={() => setOpenId(s.id)}>
            <td className="td font-semibold text-ink">{s.full_name || s.profile_name || s.wa_id || '—'}</td>
            <td className="td text-muted">{dt(s.login_at)}</td>
            <td className="td tabular-nums">{fmtDur(s.duration_sec)}</td>
            <td className="td text-muted">{device(s)}</td>
            <td className="td text-muted">{place(s)}</td>
            <td className="td text-center font-bold">{s.vehicles_explored}</td>
            <td className="td">{s.logout_at
              ? <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-bold text-muted">Ended</span>
              : <span className="rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-bold text-ok">Active</span>}</td>
            <td className="td text-xs font-bold text-brand">View ›</td>
          </tr>
        ))}
      </Table>
      {openId && <SessionDrawer session={rows.find((r) => r.id === openId)} onClose={() => setOpenId(null)} />}
    </>
  );
}

function SessionDrawer({ session, onClose }) {
  const { data, loading, error, reload } = useAsync(() => api.sessionDetail(session.id), [session.id]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-ink">Login session</h3>
          <button className="text-muted hover:text-ink" onClick={onClose}>✕</button>
        </div>

        <div className="mt-4 card p-4 space-y-1 text-sm">
          <KV k="User" v={session.full_name || session.profile_name || session.wa_id} />
          <KV k="Logged in" v={dt(session.login_at)} />
          <KV k="Logged out" v={session.logout_at ? `${dt(session.logout_at)} (${session.logout_reason || 'user'})` : 'Still active'} />
          <KV k="Duration" v={fmtDur(session.duration_sec)} />
          <KV k="Device" v={device(session)} />
          <KV k="Location" v={place(session)} />
          <KV k="IP" v={session.ip} mono />
        </div>

        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
          <>
            <Sec title={`Vehicles explored (${data.vehicles.length})`}>
              {data.vehicles.length === 0 ? <Muted>None in this session.</Muted> : data.vehicles.map((v, i) => (
                <div key={i} className="flex items-center justify-between border-t border-line py-1.5 text-sm first:border-0">
                  <span className="font-semibold text-ink">{v.reg_no}</span>
                  <span className="text-xs text-muted">{v.source || ''} · {dt(v.created_at)}</span>
                </div>
              ))}
            </Sec>
            <Sec title={`Downloads (${data.downloads.length})`}>
              {data.downloads.length === 0 ? <Muted>No downloads in this session.</Muted> : data.downloads.map((d, i) => (
                <div key={i} className="flex items-center justify-between border-t border-line py-1.5 text-sm first:border-0">
                  <span className="text-ink">{KIND[d.kind] || d.kind} <span className="text-xs text-muted">{d.reg_no || d.doc_number || ''}</span></span>
                  <span className="text-xs text-muted">{dt(d.created_at)}</span>
                </div>
              ))}
            </Sec>
          </>
        )}
      </div>
    </div>
  );
}

function Downloads() {
  const { data, loading, error, reload } = useAsync(() => api.downloads({ limit: 250 }), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const rows = data.downloads || [];
  if (!rows.length) return <Empty>No downloads yet.</Empty>;
  return (
    <Table cols={['When', 'Type', 'Document', 'Vehicle', 'User']}>
      {rows.map((d) => (
        <tr key={d.id}>
          <td className="td text-muted">{dt(d.created_at)}</td>
          <td className="td font-semibold text-ink">{KIND[d.kind] || d.kind}</td>
          <td className="td font-mono text-xs">{d.doc_number || '—'}</td>
          <td className="td">{d.reg_no || '—'}</td>
          <td className="td text-muted">{d.full_name || d.profile_name || d.wa_id || '—'}</td>
        </tr>
      ))}
    </Table>
  );
}

const Sec = ({ title, children }) => (
  <div className="mt-4 card p-4">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{title}</div>
    {children}
  </div>
);
const KV = ({ k, v, mono }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-muted">{k}</span>
    <span className={`text-right text-ink ${mono ? 'font-mono text-xs' : ''}`}>{v || '—'}</span>
  </div>
);
const Muted = ({ children }) => <p className="text-sm text-muted">{children}</p>;
