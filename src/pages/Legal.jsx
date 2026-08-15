import { useState } from 'react';
import { api } from '../lib/api';
import { useAsync, Spinner, ErrorBox, PageHead } from '../components/ui.jsx';
import { toast } from '../components/Toaster.jsx';

const POLICY_LABELS = {
  terms: 'Terms & Conditions', privacy: 'Privacy Policy', refund: 'Refund Policy',
  liability: 'Liability Policy', consent: 'Consent Policy', cancellation: 'Cancellation Policy',
  delivery: 'Delivery Policy', deletion: 'Data Deletion Policy', contact: 'Contact Us',
};

const TEXT_FIELDS = [
  ['consent_prompt', 'Login consent (agree-all)', 'Shown as the tick-box when a user verifies their mobile.'],
  ['purpose_declaration', 'Purpose declaration (app)', 'Ticked before viewing details and before payment.'],
  ['purpose_declaration_doc', 'Purpose declaration (on reports & invoice)', 'The record line printed in the report / invoice footer.'],
];

export default function Legal() {
  const { data, loading, error, reload } = useAsync(() => api.legal(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <PageHead title="Legal & policies" sub="Every declaration, consent and policy clause — configurable, no code changes." />
      <DeclarationTexts initial={data.texts} />
      <Policies policies={data.policies} onChange={reload} />
    </>
  );
}

function DeclarationTexts({ initial }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const dirty = TEXT_FIELDS.some(([k]) => (f[k] || '') !== (initial[k] || ''));
  const save = async () => {
    setBusy(true);
    try { await api.saveLegalTexts(f); toast('Declaration texts saved', 'success'); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="card mb-8 p-6">
      <h3 className="text-sm font-black uppercase tracking-wider text-muted">Declaration & consent texts</h3>
      <div className="mt-4 space-y-5">
        {TEXT_FIELDS.map(([k, label, hint]) => (
          <div key={k}>
            <label className="block text-sm font-bold text-ink">{label}</label>
            <p className="mb-1.5 text-xs text-muted">{hint}</p>
            <textarea className="input min-h-[80px] w-full resize-y" value={f[k] || ''} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
          </div>
        ))}
      </div>
      <button className="btn mt-5" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : 'Save texts'}</button>
    </div>
  );
}

function Policies({ policies, onChange }) {
  const keys = Object.keys(policies || {});
  const [active, setActive] = useState(keys[0] || 'terms');
  const clauses = policies[active] || [];
  return (
    <div className="card p-6">
      <h3 className="text-sm font-black uppercase tracking-wider text-muted">Policies</h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {keys.map((k) => (
          <button key={k} onClick={() => setActive(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${active === k ? 'bg-brand text-white' : 'bg-line text-muted hover:text-ink'}`}>
            {POLICY_LABELS[k] || k}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {clauses.map((c) => <Clause key={c.id} pkey={active} clause={c} onChange={onChange} />)}
        {clauses.length === 0 && <p className="text-sm text-muted">No clauses yet.</p>}
      </div>

      <AddClause pkey={active} onChange={onChange} />
    </div>
  );
}

function Clause({ pkey, clause, onChange }) {
  const [title, setTitle] = useState(clause.title);
  const [desc, setDesc] = useState(clause.description);
  const [busy, setBusy] = useState(false);
  const dirty = title !== clause.title || desc !== clause.description;
  const save = async () => {
    setBusy(true);
    try { await api.saveClause(pkey, clause.id, { title, description: desc }); toast('Clause saved', 'success'); onChange(); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm('Remove this clause? It will no longer appear on the site.')) return;
    try { await api.deleteClause(pkey, clause.id); toast('Clause removed', 'success'); onChange(); }
    catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <input className="input flex-1 font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="text-xs font-semibold text-bad hover:underline" onClick={remove}>Remove</button>
      </div>
      <textarea className="input mt-2 min-h-[90px] w-full resize-y text-sm" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className="mt-2 flex items-center gap-3">
        <button className="btn text-xs" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : 'Save clause'}</button>
        <span className="text-[11px] text-muted">v{clause.version} · order {clause.display_order}</span>
      </div>
    </div>
  );
}

function AddClause({ pkey, onChange }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try { await api.addClause(pkey, { title, description: desc }); toast('Clause added', 'success'); setTitle(''); setDesc(''); setOpen(false); onChange(); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  if (!open) return <button className="btn-ghost mt-4 text-xs" onClick={() => setOpen(true)}>+ Add clause</button>;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line p-4">
      <input className="input w-full font-bold" placeholder="Clause title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input mt-2 min-h-[90px] w-full resize-y text-sm" placeholder="Clause text" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button className="btn text-xs" disabled={busy || !title.trim() || desc.trim().length < 5} onClick={add}>{busy ? 'Adding…' : 'Add'}</button>
        <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
