import { useState } from 'react';
import { api, setToken } from '../lib/api';

export default function Login({ onAuthed }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api.login(pin);
      setToken(r.token);
      onAuthed();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-panel px-5">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-2.5 font-extrabold text-ink text-lg">
          <svg viewBox="0 0 64 64" className="h-9 w-9">
            <defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2563EB" /><stop offset="1" stopColor="#075E54" /></linearGradient></defs>
            <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#l)" />
            <path d="M20 33 L29 42 L45 23" fill="none" stroke="#00E0A4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verify<span className="text-brand">Vahan</span>
        </div>
        <h1 className="mt-6 text-xl font-bold text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Enter your admin PIN to continue.</p>

        <input
          className="input mt-5 tracking-[0.4em] text-center text-lg"
          type="password" inputMode="numeric" autoFocus placeholder="••••"
          value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
        {err && <div className="mt-3 rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{err}</div>}
        <button className="btn-primary mt-5 w-full" disabled={busy || pin.length < 3}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
