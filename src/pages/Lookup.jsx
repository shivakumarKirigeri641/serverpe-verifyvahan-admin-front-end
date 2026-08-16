import { useState } from 'react';
import { api, openLookupPdf, dt, day } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Badge, Empty } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';

const Field = ({ k, v }) => (
  <div className="min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{k}</div>
    <div className="truncate text-sm font-medium text-ink" title={v || ''}>{v || '—'}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="mt-6">
    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>
    {children}
  </div>
);

const SourceTag = ({ source }) => {
  const map = {
    cache: ['bg-line text-body', 'From cache'],
    ulip: ['bg-emerald-50 text-emerald-700 border border-emerald-200', 'Freshly pulled'],
    refresh: ['bg-brand/10 text-brand', 'Refreshed'],
  };
  const [cls, label] = map[source] || map.cache;
  return <span className={`chip ${cls}`}>{label}</span>;
};

export default function Lookup() {
  const [reg, setReg] = useState('');
  const [note, setNote] = useState('');
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const hist = useAsync(() => api.lookups({ limit: 50 }), []);

  const run = async (e, plateArg) => {
    e?.preventDefault?.();
    const plate = (plateArg ?? reg).trim().toUpperCase().replace(/\s+/g, '');
    if (plateArg) setReg(plate);
    if (!/^[A-Z0-9]{6,12}$/.test(plate)) { toast('Enter a valid vehicle number.', 'error'); return; }
    setBusy(true); setResult(null);
    try {
      const r = await api.lookup({ reg_no: plate, note: note.trim() || undefined, force });
      setResult(r);
      hist.reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const rc = result?.rc;

  return (
    <>
      <PageHead
        title="Vehicle lookup"
        sub="Check any plate on the spot, for your own reference. Private to you — never counted in customer analytics or trackings." />

      <form onSubmit={run} className="card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Vehicle number</label>
            <input className="input mt-1 w-full uppercase" placeholder="KA03AH4105"
              value={reg} onChange={(e) => setReg(e.target.value)} autoFocus />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Note (optional)</label>
            <input className="input mt-1 w-full" placeholder="e.g. neighbour's car"
              value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold text-body">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="h-4 w-4" />
            Force fresh pull
          </label>
          <button className="btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Check vehicle'}</button>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          A fresh pull uses a paid ULIP call (your cost). Leave unchecked to use cached data if we already have this plate.
        </p>
      </form>

      {busy && <Spinner />}

      {rc && (
        <div className="mt-5 card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-black text-ink">{rc.reg_no}</span>
            <Badge value={rc.status || '—'} />
            <SourceTag source={result.source} />
            <button className="btn-ghost ml-auto text-xs" onClick={() => openLookupPdf(result.rc_id).catch((e) => toast(e.message, 'error'))}>
              ⬇ Download full PDF
            </button>
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

          <Section title={`e-Challans (${result.challans?.length || 0})`}>
            {!result.challans?.length ? <Empty>No challans on record.</Empty> : (
              <Table cols={['Challan', 'Date', 'Place', 'Amount', 'Status']}>
                {result.challans.map((c) => (
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

          {(result.tags?.length > 0 || result.tolls?.length > 0) && (
            <Section title={`FASTag — tags (${result.tags?.length || 0}) · tolls (${result.tolls?.length || 0})`}>
              {result.tags?.length > 0 && (
                <Table cols={['Tag ID', 'Bank', 'Class', 'Status', 'Issued']}>
                  {result.tags.map((t) => (
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
              {result.tolls?.length > 0 && (
                <div className="mt-3">
                  <Table cols={['Read time', 'Toll plaza', 'Lane', 'Type']}>
                    {result.tolls.map((t) => (
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
            </Section>
          )}
        </div>
      )}

      {/* Admin-only lookup history — kept out of customer trackings entirely. */}
      <div className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">My recent lookups</h3>
          <span className="text-xs text-muted">Private to you</span>
        </div>
        {hist.loading ? <Spinner /> : hist.error ? <ErrorBox message={hist.error} onRetry={hist.reload} />
          : !hist.data?.lookups?.length ? <Empty>You haven't looked up any vehicle yet.</Empty> : (
            <Table cols={['Plate', 'Note', 'Source', 'Challans', 'When', '']}>
              {hist.data.lookups.map((l) => (
                <tr key={l.id}>
                  <td className="td font-bold text-ink">{l.reg_no}</td>
                  <td className="td text-muted">{l.note || '—'}</td>
                  <td className="td"><SourceTag source={l.source} /></td>
                  <td className="td">{l.challans_count}</td>
                  <td className="td whitespace-nowrap text-muted">{dt(l.created_at)}</td>
                  <td className="td">
                    <button className="btn-ghost text-xs" onClick={() => run(null, l.reg_no)}>Re-check</button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
      </div>
    </>
  );
}
