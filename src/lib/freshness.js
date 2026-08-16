// One source of truth for the per-vehicle "how fresh is this data" ribbon shown
// across the admin (Reports, Vehicles) and mirrored on the user dashboard.
//
// Two independent clocks, both configurable per plan in Settings:
//   • freshDays  (validity_days)      — how long the pulled data is considered "fresh"
//   • windowDays (refresh_window_days) — how long a discounted re-pull is offered
//
// A report never loses access; this is purely about the age of its DATA.

export function freshness(genISO, { freshDays = 7, windowDays = 90, validUpto } = {}) {
  if (!genISO) return null;
  const now = Date.now();
  const gen = new Date(genISO).getTime();
  const ageDays = Math.max(0, Math.floor((now - gen) / 864e5));

  // Prefer the server-stamped valid_upto for freshness when we have it (it already
  // encodes the plan's validity_days at the time the report was generated).
  const freshLeft = validUpto
    ? Math.ceil((new Date(validUpto).getTime() - now) / 864e5)
    : freshDays - ageDays;
  const isFresh = freshLeft > 0;

  const windowLeft = windowDays - ageDays;   // days the refresh discount still applies
  const inWindow = windowLeft > 0;

  let tone, label, note;
  if (isFresh) {
    tone = 'green';
    label = `Fresh · ${freshLeft}d left`;
    note = 'Data is current';
  } else if (inWindow) {
    tone = 'amber';
    label = `${ageDays}d old · refresh ${windowLeft}d`;
    note = `Discounted refresh for ${windowLeft} more day${windowLeft === 1 ? '' : 's'}`;
  } else {
    tone = 'red';
    label = `${ageDays}d old · full price`;
    note = 'Over the refresh window — a re-check is full price';
  }
  return { ageDays, freshLeft, isFresh, windowLeft, inWindow, tone, label, note };
}

// Tailwind classes per tone — light content panels (bg-panel / text-ink theme).
export const TONE = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
};
