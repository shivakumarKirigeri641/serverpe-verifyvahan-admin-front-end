import { useState } from 'react';
import { api, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Badge, Empty } from '../components/ui.jsx';
import { freshness, TONE } from '../lib/freshness';

// Data-age pill for a cached plate — based on the last FULL (paid) pull.
function AgeTag({ lastFullISO, windowDays }) {
  if (!lastFullISO) return <span className="chip bg-line text-body" title="No paid pull yet — basic cache only">No paid pull</span>;
  const f = freshness(lastFullISO, { windowDays });
  return <span className={`chip border ${TONE[f.tone]}`} title={f.note}>{f.label}</span>;
}

export default function Vehicles() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(() => api.vehicles({ q: term, limit: 100 }), [term]);
  const cfg = useAsync(() => api.settings(), []);
  const p4 = (cfg.data?.plans || []).find((x) => x.plan_code === 'PREMIUM_4W') || {};
  const windowDays = Number(p4.refresh_window_days) || 90;

  return (
    <>
      <PageHead title="Vehicles" sub="Every plate cached — and which user mobiles accessed it."
        right={
          <form onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }} className="flex gap-2">
            <input className="input !py-2 w-48" placeholder="Search plate / owner" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn-ghost !py-2 text-sm">Search</button>
          </form>
        } />

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : data.vehicles.length === 0 ? <Empty>No vehicles cached yet.</Empty> : (
        <Table cols={['Plate', 'Make / model', 'Class', 'Data age', 'Users', 'Total checks', 'Full reports', 'Challans', 'Tolls', '']}>
          {data.vehicles.map((v) => (
            <tr key={v.id}>
              <td className="td font-bold text-ink">{v.reg_no}</td>
              <td className="td">{[v.vehicle_manufacturer_name, v.model].filter(Boolean).join(' · ') || '—'}</td>
              <td className="td whitespace-nowrap">{v.vehicle_class || '—'}</td>
              <td className="td whitespace-nowrap"><AgeTag lastFullISO={v.last_full_at} windowDays={windowDays} /></td>
              <td className="td font-semibold" title="Distinct users who checked this plate">{v.accessors}</td>
              <td className="td font-bold text-ink" title="Total times this plate was checked (all users)">{v.total_checks ?? v.accessors}</td>
              <td className="td font-bold text-brand">{v.full_reports}</td>
              <td className="td">{v.challans}</td>
              <td className="td">{v.tolls}</td>
              <td className="td"><button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setOpenId(v.id)}>Open</button></td>
            </tr>
          ))}
        </Table>
      )}

      {openId && <VehicleDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

const Field = ({ k, v }) => (
  <div className="min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{k}</div>
    <div className="truncate text-sm font-medium text-ink" title={v || ''}>{v || '—'}</div>
  </div>
);

function VehicleDrawer({ id, onClose }) {
  const { data, loading, error } = useAsync(() => api.vehicle(id), [id]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-panel p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Vehicle detail</h2>
          <button className="p-2 text-muted hover:text-ink" onClick={onClose}>✕</button>
        </div>

        {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (() => {
          const rc = data.rc;
          return (
            <>
              <div className="mt-4 card p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-ink">{rc.reg_no}</span>
                  <Badge value={rc.status || '—'} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
                  <Field k="Owner" v={rc.owner_name} />
                  <Field k="Maker" v={rc.vehicle_manufacturer_name} />
                  <Field k="Model" v={rc.model} />
                  <Field k="Class" v={rc.vehicle_class} />
                  <Field k="Fuel" v={rc.fuel_type} />
                  <Field k="Colour" v={rc.vehicle_colour} />
                  <Field k="Registered" v={day(rc.reg_date)} />
                  <Field k="RC valid to" v={day(rc.rc_expiry_date)} />
                  <Field k="Insurance to" v={day(rc.vehicle_insurance_upto)} />
                  <Field k="PUCC to" v={day(rc.pucc_upto)} />
                  <Field k="Fitness to" v={day(rc.fitness_upto)} />
                  <Field k="RTO" v={rc.reg_authority} />
                  <Field k="Chassis" v={rc.chassis} />
                  <Field k="Engine" v={rc.engine} />
                  <Field k="Financier" v={rc.rc_financer || (rc.financed ? 'Financed' : 'Not financed')} />
                </div>
              </div>

              <Section
                title={`Accessed by ${data.accessors.length} user${data.accessors.length === 1 ? '' : 's'} · ${data.accessors.reduce((s, a) => s + Number(a.check_count || 0), 0)} total checks`}
                note="Who checked this plate, and how many times.">
                {data.accessors.length === 0 ? <Empty>No user has this vehicle linked.</Empty> : (
                  <Table cols={['User', 'WhatsApp', 'Access', 'Checks', 'First', 'Last']}>
                    {data.accessors.map((a) => (
                      <tr key={a.id}>
                        <td className="td font-semibold text-ink">{a.full_name || a.profile_name || '—'}</td>
                        <td className="td font-mono text-xs">{a.wa_id}</td>
                        <td className="td"><Badge value={a.is_premium ? 'FULL' : 'BASIC'} /></td>
                        <td className="td">{a.check_count}</td>
                        <td className="td whitespace-nowrap text-muted">{day(a.first_checked_at)}</td>
                        <td className="td whitespace-nowrap text-muted">{dt(a.last_checked_at)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Section>

              <Section title={`e-Challans (${data.challans.length})`}>
                {data.challans.length === 0 ? <Empty>No challans on record.</Empty> : (
                  <Table cols={['Challan', 'Date', 'Place', 'Amount', 'Status']}>
                    {data.challans.map((c) => (
                      <tr key={c.id}>
                        <td className="td font-mono text-xs">{c.challan_number}</td>
                        <td className="td whitespace-nowrap">{dt(c.challan_datetime)}</td>
                        <td className="td">{c.challan_place || '—'}</td>
                        <td className="td font-semibold">₹{Number(c.fine_imposed || 0)}</td>
                        <td className="td">{c.challan_status || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Section>

              <Section title={`FASTag — tags (${data.tags.length}) · tolls (${data.tolls.length})`}>
                {data.tags.length > 0 && (
                  <Table cols={['Tag ID', 'Bank', 'Class', 'Status', 'Issued']}>
                    {data.tags.map((t) => (
                      <tr key={t.id}>
                        <td className="td font-mono text-xs">{t.tag_id}</td>
                        <td className="td">{t.bank_id || '—'}</td>
                        <td className="td">{t.vehicle_class || '—'}</td>
                        <td className="td">{t.tag_status || '—'}</td>
                        <td className="td whitespace-nowrap text-muted">{day(t.issue_date)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
                {data.tolls.length > 0 && (
                  <div className="mt-3">
                    <Table cols={['Read time', 'Toll plaza', 'Lane', 'Type']}>
                      {data.tolls.map((t) => (
                        <tr key={t.id}>
                          <td className="td whitespace-nowrap">{dt(t.reader_read_time)}</td>
                          <td className="td">{t.toll_plaza_name || '—'}</td>
                          <td className="td">{t.lane_direction || '—'}</td>
                          <td className="td">{t.vehicle_type || '—'}</td>
                        </tr>
                      ))}
                    </Table>
                  </div>
                )}
                {data.tags.length === 0 && data.tolls.length === 0 && <Empty>No FASTag data.</Empty>}
              </Section>
            </>
          );
        })()}
      </div>
    </div>
  );
}

const Section = ({ title, note, children }) => (
  <div className="mt-6">
    <div className="mb-2 flex items-baseline justify-between">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
    {children}
  </div>
);
