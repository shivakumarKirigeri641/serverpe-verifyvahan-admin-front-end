import { useState } from 'react';
import { api, openReportPdf, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Badge, Empty } from '../components/ui.jsx';

export default function Users() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(() => api.users({ q: term, limit: 100 }), [term]);

  return (
    <>
      <PageHead title="Users & vehicles" sub="Everyone who has messaged GaadiPe."
        right={
          <form onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }} className="flex gap-2">
            <input className="input !py-2 w-48" placeholder="Search name / number" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn-ghost !py-2 text-sm">Search</button>
          </form>
        } />

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : data.users.length === 0 ? <Empty>No users found.</Empty> : (
        <Table cols={['User', 'WhatsApp', 'Vehicles', 'Paid reports', 'Checks', 'Joined', '']}>
          {data.users.map((u) => (
            <tr key={u.id}>
              <td className="td font-semibold text-ink">{u.full_name || u.profile_name || '—'}</td>
              <td className="td font-mono text-xs">{u.wa_id || u.mobile_number || '—'}</td>
              <td className="td">{u.vehicles}</td>
              <td className="td font-bold text-brand">{u.paid_reports}</td>
              <td className="td text-muted">{u.lookup_count}</td>
              <td className="td whitespace-nowrap text-muted">{dt(u.created_at)}</td>
              <td className="td"><button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setOpenId(u.id)}>View</button></td>
            </tr>
          ))}
        </Table>
      )}

      {openId && <UserDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function UserDrawer({ id, onClose }) {
  const { data, loading, error } = useAsync(() => api.user(id), [id]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">User detail</h2>
          <button className="p-2 text-muted hover:text-ink" onClick={onClose}>✕</button>
        </div>

        {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
          <>
            <div className="mt-4 card p-4">
              <div className="font-bold text-ink">{data.user.full_name || data.user.profile_name || '—'}</div>
              <div className="mt-1 text-sm text-muted">{data.user.wa_id} · {data.user.email || 'no email'}</div>
              <div className="mt-1 text-xs text-muted">Joined {dt(data.user.created_at)} · {data.user.lookup_count} checks</div>
            </div>

            <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Vehicles</h3>
            {data.vehicles.length === 0 ? <p className="text-sm text-muted">None.</p> : (
              <div className="space-y-2">
                {data.vehicles.map((v) => (
                  <div key={v.reg_no} className="card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{v.reg_no}</span>
                      {v.is_premium && <Badge value="FULL" />}
                    </div>
                    <div className="text-xs text-muted">{[v.vehicle_manufacturer_name, v.model].filter(Boolean).join(' · ') || 'Vehicle'}</div>
                    {v.premium_valid_upto && <div className="text-xs text-muted">Full valid to {day(v.premium_valid_upto)}</div>}
                  </div>
                ))}
              </div>
            )}

            <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Reports</h3>
            {data.reports.length === 0 ? <p className="text-sm text-muted">None.</p> : (
              <div className="space-y-2">
                {data.reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between card p-3">
                    <div>
                      <div className="font-semibold text-ink">{r.reg_no} <Badge value={r.report_type} /></div>
                      <div className="text-xs text-muted">{r.report_number} · {day(r.generated_at)}</div>
                    </div>
                    <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => openReportPdf(r.id).catch((e) => alert(e.message))}>PDF</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
