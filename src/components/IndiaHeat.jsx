/**
 * IndiaHeat — where visitors and users are, by state / region.
 * A heat-shaded leaderboard: each row is coloured by its share of the column's
 * max, so the busiest regions glow darkest. No map dependency.
 */
const shade = (n, max) => {
  const a = max > 0 ? 0.10 + 0.80 * (n / max) : 0.10;   // 0.10 → 0.90 alpha
  return { background: `rgba(7,94,84,${a.toFixed(3)})`, color: a > 0.5 ? '#fff' : '#111b21' };
};

function HeatColumn({ title, rows = [], note }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const total = rows.reduce((s, r) => s + r.n, 0);
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-brand">{title}</h3>
        <span className="text-xs text-muted nums">{total} total{note ? ` · ${note}` : ''}</span>
      </div>
      {!rows.length ? (
        <p className="py-6 text-center text-sm text-muted">No data yet.</p>
      ) : (
        <div className="grid gap-1.5">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={shade(r.n, max)}>
              <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
              <span className="shrink-0 font-black nums">{r.n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IndiaHeat({ geo }) {
  if (!geo) return <div className="card p-6 text-sm text-muted">Loading map…</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <HeatColumn title="Visitors by state" rows={geo.visitors} />
      <HeatColumn title="Visitors by state · today" rows={geo.visitors_today} />
      <HeatColumn title="Users by region" rows={geo.users} note="signed-in" />
      <HeatColumn title="Paying users by region" rows={geo.paying} note="bought a report" />
    </div>
  );
}
