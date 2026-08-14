/**
 * Global toast/snackbar (matches the QuizPe admin).
 *
 * Rendered once near the app root. It registers with the API layer, so EVERY
 * write (POST/PUT/PATCH/DELETE) auto-shows a success or error toast — no page
 * has to wire it up. Anything can also raise one manually via `toast(msg, type)`.
 * CSS animation only (no extra deps).
 */
import { useEffect, useState } from 'react';
import { setToastHandler } from '../lib/api';

let counter = 0;
let external = null;

export function toast(message, type = 'success') { external?.({ message, type }); }

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const add = ({ message, type = 'success', duration = 3500 }) => {
      const id = ++counter;
      setItems((cur) => [...cur, { id, message, type }]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), duration);
    };
    setToastHandler(add);
    external = add;
    return () => { external = null; };
  }, []);

  const tone = { success: 'bg-brand-accent', error: 'bg-bad', info: 'bg-brand' };
  const icon = { success: '✅', error: '⚠️', info: 'ℹ️' };

  return (
    <>
      <style>{`
        @keyframes vv-toast-in { from { opacity: 0; transform: translateY(16px) scale(.96); }
                                 to   { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[min(92vw,22rem)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            style={{ animation: 'vv-toast-in .22s cubic-bezier(.22,.9,.28,1)' }}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${tone[t.type] || tone.success}`}
          >
            <span className="mt-px leading-none">{icon[t.type] || icon.success}</span>
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
