import { useState } from 'react';
import { api } from '../lib/api';
import { PageHead } from '../components/ui.jsx';

export default function Broadcast() {
  const [mode, setMode] = useState('all');           // 'all' | 'specific'
  const [numbers, setNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const parsed = numbers.split(/[\s,]+/).map((n) => n.replace(/\D/g, '')).filter((n) => n.length >= 10);

  const send = async () => {
    if (message.trim().length < 3) return;
    if (!confirm(mode === 'all' ? 'Send this message to ALL users?' : `Send to ${parsed.length} number(s)?`)) return;
    setBusy(true); setErr(''); setResult(null);
    try {
      const r = await api.broadcast(message.trim(), mode === 'specific' ? parsed : undefined);
      setResult(r);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Broadcast" sub="Send a WhatsApp message to your users." />

      <div className="max-w-2xl space-y-5">
        <div className="rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm text-warn">
          Free-form messages only reach users who messaged VerifyVahan in the last 24 hours.
          For everyone else, an approved template is required.
        </div>

        <div className="card p-5">
          <div className="flex gap-1 rounded-xl border border-line bg-white p-1 w-max">
            {[['all', 'All users'], ['specific', 'Specific numbers']].map(([v, l]) => (
              <button key={v} onClick={() => setMode(v)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === v ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>

          {mode === 'specific' && (
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Numbers</label>
              <textarea className="input min-h-[90px]" placeholder="One per line or comma-separated (e.g. 9886122415)"
                value={numbers} onChange={(e) => setNumbers(e.target.value)} />
              <div className="mt-1 text-xs text-muted">{parsed.length} valid number(s)</div>
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Message</label>
            <textarea className="input min-h-[140px]" maxLength={1000} placeholder="Type your message…"
              value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="mt-1 text-right text-xs text-muted">{message.length}/1000</div>
          </div>

          {err && <div className="mt-3 rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{err}</div>}
          {result && (
            <div className="mt-3 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
              Sent to {result.sent} of {result.recipients} recipient(s){result.failed ? ` · ${result.failed} failed` : ''}.
            </div>
          )}

          <button className="btn-primary mt-5"
            disabled={busy || message.trim().length < 3 || (mode === 'specific' && parsed.length === 0)}
            onClick={send}>
            {busy ? 'Sending…' : 'Send broadcast'}
          </button>
        </div>
      </div>
    </>
  );
}
