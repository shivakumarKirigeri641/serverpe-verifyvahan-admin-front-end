import { useState } from 'react';

const NAV = [
  ['dashboard', 'Dashboard', 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z'],
  ['finance', 'Finance', 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  ['gst', 'GST', 'M4 6h16v12H4zM4 10h16M9 14h6'],
  ['tickets', 'Support tickets', 'M4 6h16v5a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V6Z'],
  ['inbox', 'Inbox', 'M4 5h16v14H4zM4 8l8 5 8-5'],
  ['users', 'Users', 'M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0'],
  ['vehicles', 'Vehicles', 'M5 16l1-5h12l1 5M4 16h16v3H4zM7 19v2M17 19v2'],
  ['visitors', 'Visitors', 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  ['broadcast', 'Broadcast', 'M4 11l16-7-4 16-4-6-4 2-1-3z'],
  ['settings', 'Settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 12a8 8 0 0 1 .2-1.8L2 8l2-3.5 2.6 1a8 8 0 0 1 1.5-.9L9 2h6l.9 2.6c.5.2 1 .5 1.5.9l2.6-1L22 8l-2.2 2.2a8 8 0 0 1 0 3.6L22 16l-2 3.5-2.6-1a8 8 0 0 1-1.5.9L15 22H9l-.9-2.6a8 8 0 0 1-1.5-.9l-2.6 1L2 16l2.2-2.2A8 8 0 0 1 4 12Z'],
];

function Mark() {
  return (
    <svg viewBox="0 0 512 512" className="h-8 w-8">
      <defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0A9E8E" /><stop offset="1" stopColor="#075E54" /></linearGradient></defs>
      <rect width="512" height="512" rx="116" fill="url(#m)" />
      <text x="256" y="326" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="238" letterSpacing="-14"><tspan fill="#FFFFFF">G</tspan><tspan fill="#3BE8B0">P</tspan></text>
      <path d="M122 388 L214 428 L400 346" fill="none" stroke="#3BE8B0" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Layout({ page, setPage, onLogout, children }) {
  const [open, setOpen] = useState(false);

  const NavList = ({ onNavigate }) => (
    <nav className="space-y-1">
      {NAV.map(([id, label, d]) => (
        <button key={id}
          onClick={() => { setPage(id); onNavigate?.(); }}
          className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
            page === id ? 'bg-brand text-white shadow-soft' : 'text-body hover:bg-panel'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d={d} />
          </svg>
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col border-r border-line bg-white p-4">
        <div className="flex items-center gap-2.5 px-1.5 py-2">
          <Mark />
          <div className="leading-tight">
            <div className="font-extrabold text-ink">Gaadi<span className="text-brand">Pe</span></div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Admin console</div>
          </div>
        </div>
        <div className="mt-6 flex-1"><NavList /></div>
        <button onClick={onLogout} className="btn-ghost mt-2 w-full text-sm">Sign out</button>
      </aside>

      {/* main */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 font-extrabold text-ink"><Mark /> Admin</div>
          <button className="p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </header>
        {open && (
          <div className="border-b border-line bg-white p-3 lg:hidden">
            <NavList onNavigate={() => setOpen(false)} />
            <button onClick={onLogout} className="btn-ghost mt-2 w-full text-sm">Sign out</button>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
