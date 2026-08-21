import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBox, PageHead, Section } from '../components/ui.jsx';

const TIER_LABEL = { free: 'Free', trial: 'Trial', premium: 'Premium', practice: 'Practice' };
const pct = (c, q) => (q ? Math.round((c / q) * 100) : 0);
const istTime = (t) => (t ? new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export default function Game() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [seed, setSeed] = useState('');
  const [seedMsg, setSeedMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => { setErr(''); api.gameOverview().then(setD).catch((e) => setErr(e.message)); };
  useEffect(() => { load(); }, []);

  if (err && !d) return <ErrorBox message={err} onRetry={load} />;
  if (!d) return <Spinner />;

  const doSeed = async () => {
    setBusy(true); setSeedMsg('');
    try { const r = await api.gameSeed(seed); setSeedMsg(`✓ Queued ${r.queued} of ${r.submitted} plates`); setSeed(''); load(); }
    catch (e) { setSeedMsg('✗ ' + e.message); } finally { setBusy(false); }
  };

  const tierBy = Object.fromEntries((d.tiers || []).map((t) => [t.tier, t]));
  const totalPlays = (d.tiers || []).reduce((s, t) => s + t.plays, 0);

  return (
    <>
      <PageHead title="Number-plate game" sub="Every play, player, reward and the real-vehicle question pool." />
      {err && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {/* headline tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile n={totalPlays} l="Total plays" />
        <Tile n={d.players} l="Players" />
        <Tile n={d.today} l="Plays today" />
        <Tile n={`${d.rewards?.redeemed ?? 0}/${d.rewards?.issued ?? 0}`} l="Rewards redeemed" />
      </div>

      <Section title="By game mode" sub="Plays, completions and accuracy per tier" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {['free', 'trial', 'premium', 'practice'].map((tier) => {
          const t = tierBy[tier] || { plays: 0, done: 0, correct: 0, questions: 0 };
          return (
            <div key={tier} className="card p-4">
              <div className="text-sm font-bold text-ink">{TIER_LABEL[tier]}</div>
              <div className="mt-2 text-2xl font-black text-brand">{t.plays}</div>
              <div className="text-[11px] text-muted">plays · {t.done} completed</div>
              <div className="mt-2 text-xs text-body">Accuracy <b className="text-ink">{pct(t.correct, t.questions)}%</b></div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* leaderboard */}
        <div>
          <Section title="🏆 Leaderboard" sub="Top players by Master Score (Premium)" className="!mt-0" />
          <div className="card divide-y divide-line">
            {(d.leaderboard || []).length === 0 && <div className="p-4 text-sm text-muted">No ranked players yet.</div>}
            {(d.leaderboard || []).map((p) => (
              <div key={p.rank} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-6 text-center font-black text-brand">{p.rank}</span>
                <span className="flex-1 truncate text-sm font-semibold text-ink">{p.name}</span>
                <span className="font-mono text-xs text-muted">{p.mobile}</span>
                <span className="font-black text-brand">{p.master}</span>
              </div>
            ))}
          </div>
        </div>

        {/* pool + seed */}
        <div>
          <Section title="Question pool" sub="Real vehicles for “State · City · Type” questions" className="!mt-0" />
          <div className="card p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-2xl font-black text-brand">{d.pool?.vehicles?.active ?? 0}</div><div className="text-[11px] text-muted">active vehicles</div></div>
              <div><div className="text-2xl font-black text-brand">{d.pool?.vehicles?.types ?? 0}</div><div className="text-[11px] text-muted">types</div></div>
              <div><div className="text-2xl font-black text-brand">{d.pool?.queue?.pending ?? 0}</div><div className="text-[11px] text-muted">queued</div></div>
            </div>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-muted">Seed real plates (comma / space / newline)</label>
            <textarea className="input mt-1 h-24 w-full font-mono text-sm" placeholder="KA01AB1234, TG09XY5678, MH12CD3456"
              value={seed} onChange={(e) => setSeed(e.target.value)} />
            <p className="mt-1 text-[11px] text-muted">The grower resolves each plate's type via ULIP (server-side, throttled). Needs <b>GAME_POOL_ENABLED=true</b>.</p>
            <button className="btn-primary mt-3" disabled={busy || !seed.trim()} onClick={doSeed}>{busy ? 'Queuing…' : 'Add to pool'}</button>
            {seedMsg && <div className={`mt-2 text-sm font-semibold ${seedMsg.startsWith('✓') ? 'text-ok' : 'text-bad'}`}>{seedMsg}</div>}
          </div>
        </div>
      </div>

      <Section title="Recent plays" sub="Latest 40 sessions" />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5">When</th><th className="px-4 py-2.5">Player</th><th className="px-4 py-2.5">Mode</th>
              <th className="px-4 py-2.5">Score</th><th className="px-4 py-2.5">Correct</th><th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {(d.recent || []).map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="whitespace-nowrap px-4 py-2 text-muted">{istTime(r.started_at)}</td>
                <td className="px-4 py-2">{r.full_name || <span className="font-mono text-xs text-muted">{r.mobile || '—'}</span>}</td>
                <td className="px-4 py-2">{TIER_LABEL[r.tier] || r.tier}</td>
                <td className="px-4 py-2 font-semibold text-ink">{r.score ?? '—'}</td>
                <td className="px-4 py-2">{r.status === 'done' ? `${r.correct}/${r.total}` : '—'}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === 'done' ? 'bg-ok/10 text-ok' : 'bg-panel text-muted'}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {(d.recent || []).length === 0 && <tr><td colSpan="6" className="px-4 py-6 text-center text-muted">No plays yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Tile({ n, l }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-black text-brand tabular-nums">{n}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{l}</div>
    </div>
  );
}
