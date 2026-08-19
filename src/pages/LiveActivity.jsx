import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBox, Section } from '../components/ui.jsx';
import { Panel } from '../components/charts.jsx';
import ActivityList from '../components/ActivityList.jsx';

const REFRESH_MS = 12000;
const FILTERS = [
  ['all', 'Everything'], ['payment', 'Payments'], ['signup', 'New users'],
  ['full_report', 'Full reports'], ['basic_report', 'Basic checks'],
  ['feedback', 'Feedback'], ['support', 'Support'],
];

export default function LiveActivity() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [kind, setKind] = useState('all');
  const [live, setLive] = useState(true);
  const timer = useRef(null);

  const load = () => api.activity(120).then((d) => { setRows(d.rows); setError(''); }).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    if (live) timer.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer.current);
  }, [live]);

  if (error && !rows) return <ErrorBox message={error} onRetry={load} />;
  if (!rows) return <Spinner />;

  const shown = kind === 'all' ? rows : rows.filter((r) => r.kind === kind);
  const counts = rows.reduce((m, r) => ((m[r.kind] = (m[r.kind] || 0) + 1), m), {});

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">Live activity</h1>
          <p className="mt-1 text-sm text-muted">Everything happening across GaadiPe, newest first.</p>
        </div>
        <button onClick={() => setLive((v) => !v)} className={live ? 'btn-pri' : 'btn-sec'}>
          {live ? '⏸ Pause live' : '▶ Go live'}
        </button>
      </div>

      <Section title="Filter" />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setKind(k)}
            className={`chip px-3 py-1.5 transition ${kind === k ? 'bg-brand text-white' : 'bg-line/50 text-body hover:bg-line'}`}>
            {label}{k !== 'all' && counts[k] ? ` · ${counts[k]}` : ''}
          </button>
        ))}
      </div>

      <Panel>
        <ActivityList rows={shown} empty="Nothing matches this filter yet." />
      </Panel>
    </>
  );
}
