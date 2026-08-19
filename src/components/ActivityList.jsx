import { inr } from '../lib/api';

/* +91 formatting + short "time ago" — shared by Today (live) and Live activity. */
export const phone = (v) => {
  if (!v) return '';
  if (String(v).includes('@')) return String(v);
  const d = String(v).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return d ? `+${d}` : '';
};

export const ago = (s) => {
  if (!s) return '';
  const sec = Math.max(0, (Date.now() - new Date(s).getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
};

const META = {
  signup:       { icon: '👤', label: 'New user',    cls: 'bg-sky-50 text-sky-700' },
  payment:      { icon: '💰', label: 'Payment',     cls: 'bg-emerald-50 text-emerald-700' },
  full_report:  { icon: '📄', label: 'Full report', cls: 'bg-brand/10 text-brand' },
  basic_report: { icon: '🔍', label: 'Basic check', cls: 'bg-line/60 text-muted' },
  feedback:     { icon: '💬', label: 'Feedback',    cls: 'bg-violet-50 text-violet-700' },
  support:      { icon: '🎧', label: 'Support',     cls: 'bg-amber-50 text-amber-700' },
};

export default function ActivityList({ rows = [], empty = 'No activity yet.' }) {
  if (!rows.length) return <div className="py-12 text-center text-sm text-muted">{empty}</div>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((r, i) => {
        const m = META[r.kind] || { icon: '•', label: r.kind, cls: 'bg-line/60 text-muted' };
        return (
          <li key={i} className="flex items-center gap-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-base">{m.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`chip ${m.cls}`}>{m.label}</span>
                <span className="truncate text-sm font-semibold text-ink">{r.who || phone(r.mobile) || '—'}</span>
              </div>
              {(r.detail || r.mobile) && (
                <div className="mt-0.5 truncate text-xs text-muted">
                  {r.who && r.mobile ? <span className="nums">{phone(r.mobile)}</span> : null}
                  {r.who && r.mobile && r.detail ? ' · ' : ''}
                  {r.detail || ''}
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              {r.amount != null && r.kind === 'payment' && <div className="text-sm font-bold text-brand nums">{inr(r.amount)}</div>}
              {r.amount != null && r.kind === 'feedback' && <div className="text-sm font-bold text-amber-600 nums">{r.amount}★</div>}
              <div className="text-[11px] text-muted">{ago(r.at)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
