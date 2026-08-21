import { useState } from 'react';

// Primary navigation — the 12 core sections.
const NAV = [
  ['dashboard', 'Dashboard', '📊'],
  ['today', 'Today (live)', '🟢'],
  ['liveactivity', 'Live activity', '📡'],
  ['analytics', 'Analytics', '📈'],
  ['visitors', 'Visitors', '🌐'],
  ['usersvehicles', 'Users & vehicles', '🚗'],
  ['watch', 'Watch subs', '🛡️'],
  ['premium', 'Premium', '💎'],
  ['game', 'Game', '🎮'],
  ['templates', 'Templates', '📝'],
  ['broadcast', 'Broadcast', '📣'],
  ['reports', 'Reports', '📄'],
  ['finance', 'Finance & GST', '₹'],
  ['inbox', 'Inbox', '📥'],
  ['tickets', 'Support', '💬'],
  ['settings', 'Settings', '⚙️'],
];

// Secondary "Tools" group — kept reachable, out of the main flow.
const TOOLS = [
  ['lookup', 'Vehicle lookup', '🔍'],
  ['fleet', 'Fleet / bulk', '🚛'],
  ['legal', 'Legal & policies', '⚖️'],
  ['apihealth', 'API health', '🩺'],
];

function Mark() {
  return (
    <svg viewBox="0 0 512 512" className="h-10 w-10 rounded-xl bg-white p-1 shrink-0">
      <defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0A9E8E" /><stop offset="1" stopColor="#075E54" /></linearGradient></defs>
      <rect width="512" height="512" rx="116" fill="url(#m)" />
      <text x="256" y="326" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="238" letterSpacing="-14"><tspan fill="#FFFFFF">G</tspan><tspan fill="#3BE8B0">P</tspan></text>
      <path d="M122 388 L214 428 L400 346" fill="none" stroke="#3BE8B0" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Layout({ page, setPage, onLogout, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* dimmed backdrop — mobile only */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      {/* sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col bg-brand text-white/90 transition-transform duration-200
        lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-60 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <button onClick={() => setOpen(false)} aria-label="Close menu"
            className="order-last ml-auto grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 lg:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
          <Mark />
          <div className="min-w-0">
            <div className="font-bold leading-tight text-white">GaadiPe</div>
            <div className="truncate text-[11px] text-white/60">Admin console</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(([id, label, icon]) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                page === id ? 'bg-white/15 font-semibold text-white' : 'hover:bg-white/10'}`}>
              <span className="w-5 text-center">{icon}</span>{label}
            </button>
          ))}
          <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[.12em] text-white/40">Tools</div>
          {TOOLS.map(([id, label, icon]) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                page === id ? 'bg-white/15 font-semibold text-white' : 'hover:bg-white/10'}`}>
              <span className="w-5 text-center">{icon}</span>{label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 text-[11px] text-white/50">
          <div className="font-semibold text-white/70">ServerPe App Solutions</div>
          <div>GSTIN 29BSMPK7696H1ZT</div>
          <button onClick={onLogout} className="mt-3 w-full rounded-lg bg-white/10 py-2 text-xs font-semibold text-white transition hover:bg-white/20">Sign out</button>
        </div>
      </aside>

      {/* main */}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-brand px-4 text-white shadow-md lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-1 grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
          </button>
          <span className="font-bold">GaadiPe</span>
        </header>
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
