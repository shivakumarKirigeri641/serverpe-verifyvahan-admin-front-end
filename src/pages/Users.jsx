import { useState } from 'react';
import { api, openReportPdf, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Badge, Empty } from '../components/ui.jsx';

const PLAN_TONE = { premium: 'bg-ok/10 text-ok', trial: 'bg-amber-100 text-amber-700', none: 'bg-panel text-muted' };
const TIER_LABEL = { free: 'Free', trial: 'Trial', premium: 'Premium', practice: 'Practice' };
function Ribbon({ plan }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PLAN_TONE[plan] || PLAN_TONE.none}`}>{plan === 'none' ? 'Free' : plan}</span>;
}

export default function Users() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(() => api.users({ q: term, limit: 100 }), [term]);

  return (
    <>
      <PageHead title="Users & vehicles" sub="Everyone who has messaged GaadiPe — plan, device, location, vehicles & game activity."
        right={
          <form onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }} className="flex gap-2">
            <input className="input !py-2 w-48" placeholder="Search name / number" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn-ghost !py-2 text-sm">Search</button>
          </form>
        } />

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : data.users.length === 0 ? <Empty>No users found.</Empty> : (
        <Table cols={['User', 'Plan', 'WhatsApp', 'Location', 'Vehicles', 'Paid', 'Checks', 'Joined', '']}>
          {data.users.map((u) => (
            <tr key={u.id}>
              <td className="td font-semibold text-ink">{u.full_name || u.profile_name || '—'}</td>
              <td className="td"><Ribbon plan={u.plan} /></td>
              <td className="td font-mono text-xs">{u.wa_id || u.mobile_number || '—'}</td>
              <td className="td text-xs text-muted">{[u.city, u.os].filter(Boolean).join(' · ') || '—'}</td>
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

function Row({ k, v }) {
  if (v == null || v === '') return null;
  return <div className="flex justify-between gap-3 py-0.5 text-xs"><span className="text-muted">{k}</span><span className="text-right font-medium text-ink">{v}</span></div>;
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

        {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (() => {
          const d = data.devices?.[0];
          const g = data.games || [];
          const done = g.filter((x) => x.status === 'done');
          const bestPrem = Math.max(0, ...done.filter((x) => x.tier === 'premium' || x.tier === 'trial').map((x) => x.correct || 0));
          return (
          <>
            <div className="mt-4 card p-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink">{data.user.full_name || data.user.profile_name || '—'}</span>
                <Ribbon plan={data.plan} />
              </div>
              <div className="mt-1 text-sm text-muted">{data.user.wa_id} · {data.user.email || 'no email'}</div>
              <div className="mt-1 text-xs text-muted">User #{data.user.id} · Joined {dt(data.user.created_at)} · {data.user.lookup_count} checks</div>
              {data.next_premium && (
                <div className="mt-2 rounded-lg bg-panel px-3 py-1.5 text-xs">
                  Next Premium price (earned): <b className="text-brand">₹{data.next_premium.price}</b>
                  {data.next_premium.questions > 0 && <span className="text-muted"> · best game {bestPrem}/5</span>}
                </div>
              )}
            </div>

            <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Device & location</h3>
            {!d ? <p className="text-sm text-muted">No device seen (WhatsApp-only user).</p> : (
              <div className="card p-3">
                <Row k="Device" v={[d.device_vendor, d.device_model, d.device_type].filter(Boolean).join(' ')} />
                <Row k="OS" v={[d.os_name, d.os_version].filter(Boolean).join(' ')} />
                <Row k="Browser" v={[d.browser_name, d.browser_version].filter(Boolean).join(' ')} />
                <Row k="IP" v={d.last_ip} />
                <Row k="Location" v={[d.ip_city, d.ip_region, d.ip_country].filter(Boolean).join(', ')} />
                <Row k="ASN" v={d.ip_asn} />
                <Row k="Timezone" v={d.timezone} />
                <Row k="Language" v={d.accept_language} />
                <Row k="Screen" v={d.screen_w && d.screen_h ? `${d.screen_w}×${d.screen_h}` : null} />
                <Row k="Seen" v={`${d.seen_count}× · last ${dt(d.last_seen_at)}`} />
              </div>
            )}

            <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Premium & trial</h3>
            {(!data.subscriptions || data.subscriptions.length === 0) ? <p className="text-sm text-muted">No subscriptions.</p> : (
              <div className="space-y-2">
                {data.subscriptions.map((s, i) => (
                  <div key={i} className="card flex items-center justify-between p-3">
                    <div>
                      <div className="font-bold text-ink">{s.reg_no} <Ribbon plan={s.is_trial ? 'trial' : 'premium'} /></div>
                      <div className="text-xs text-muted">{s.status} · {day(s.start_date)} → {day(s.end_date)}{s.price ? ` · ₹${s.price}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Game activity ({done.length})</h3>
            {done.length === 0 ? <p className="text-sm text-muted">No games played.</p> : (
              <div className="space-y-1.5">
                {g.slice(0, 12).map((x, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-xs">
                    <span className="font-semibold text-ink">{TIER_LABEL[x.tier] || x.tier}</span>
                    <span className="text-muted">{x.status === 'done' ? `${x.correct}/${x.total} · ${x.score} pts` : x.status}</span>
                    <span className="text-muted">{dt(x.started_at)}</span>
                  </div>
                ))}
              </div>
            )}

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
          );
        })()}
      </div>
    </div>
  );
}
