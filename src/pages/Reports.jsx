import { useState } from 'react';
import { api, openReportPdf, dt } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead, Table, Empty } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';
import { freshness, TONE } from '../lib/freshness';

const within = (d, days) => Date.now() - new Date(d).getTime() <= days * 864e5;

// Freshness/age pill — shared look with the user dashboard.
function FreshTag({ genISO, validUpto, windowDays }) {
  const f = freshness(genISO, { validUpto, windowDays });
  if (!f) return <span className="text-muted">—</span>;
  return (
    <span className={`chip border ${TONE[f.tone]}`} title={f.note}>{f.label}</span>
  );
}

export default function Reports() {
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [range, setRange] = useState('all');
  const { data, loading, error, reload } = useAsync(() => api.reports({ type: type || undefined, limit: 300 }), [type]);
  const cfg = useAsync(() => api.settings(), []);
  const p4 = (cfg.data?.plans || []).find((x) => x.plan_code === 'PREMIUM_4W') || {};
  const windowDays = Number(p4.refresh_window_days) || 90;

  const rows = (data?.reports || []).filter((r) => {
    const s = q.trim().toLowerCase();
    if (s && !`${r.reg_no} ${r.report_number}`.toLowerCase().includes(s)) return false;
    if (range !== 'all' && !within(r.generated_at, range === 'today' ? 1 : range === '7d' ? 7 : 30)) return false;
    return true;
  });

  const view = async (id) => { try { await openReportPdf(id); } catch (e) { toast(e.message, 'error'); } };

  return (
    <>
      <PageHead title="Reports" sub="Every basic & paid report generated." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[['', 'All'], ['BASIC', 'Basic'], ['FULL', 'Paid']].map(([v, l]) => (
          <button key={v} onClick={() => setType(v)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              type === v ? 'bg-brand text-white' : 'border border-line bg-white text-body hover:border-brand'}`}>
            {l}
          </button>
        ))}
        <input className="input max-w-[240px]" placeholder="Search reg no / report no" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[130px]" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
        </select>
        <span className="ml-auto text-sm text-muted">{rows.length} shown</span>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} />
        : rows.length === 0 ? <Empty>No reports match.</Empty> : (
          <Table cols={['Report no', 'Vehicle', 'Type', 'Data freshness', 'Status', 'Generated', 'Valid until', '']}>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td font-semibold text-ink">{r.report_number}</td>
                <td className="td">{r.reg_no}</td>
                <td className="td">
                  <span className={`chip ${r.report_type === 'FULL' ? 'bg-brand/10 text-brand' : 'bg-line text-body'}`}>
                    {r.report_type === 'FULL' ? 'Paid' : 'Basic'}
                  </span>
                </td>
                <td className="td">
                  <FreshTag genISO={r.generated_at} validUpto={r.valid_upto} windowDays={windowDays} />
                </td>
                <td className="td text-muted">{r.status || '—'}</td>
                <td className="td text-muted">{dt(r.generated_at)}</td>
                <td className="td text-muted">{r.valid_upto ? dt(r.valid_upto) : '—'}</td>
                <td className="td"><button className="btn-ghost text-xs" onClick={() => view(r.id)}>View PDF</button></td>
              </tr>
            ))}
          </Table>
        )}
    </>
  );
}
