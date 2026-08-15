import { useState } from 'react';
import { api, setToken, API_BASE } from '../lib/api';

const LOGO = `${API_BASE}/images/logo-mark.svg`;   // served by the back-end

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
        <div className="flex items-center gap-2.5 text-lg font-extrabold text-ink">
          <img src={LOGO} alt="GaadiPe" className="h-9 w-9 rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          Gaadi<span className="text-brand">Pe</span>
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
