import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBox, PageHead } from '../components/ui.jsx';

/**
 * WhatsApp template registry (DB-backed). This registers a template LOCALLY — it
 * doesn't create it in Meta. Author + submit each template in the WhatsApp
 * Manager, add a matching row here, then flip it to APPROVED once Meta clears it.
 * The gated senders (monitoring, launch, game nudge, trial, renewal, follow-up)
 * pick up APPROVED + active rows automatically — no deploy.
 */
const STATUS_TONE = { APPROVED: 'bg-ok/10 text-ok', PENDING: 'bg-amber-100 text-amber-700', REJECTED: 'bg-red-100 text-red-700' };
const CAT_TONE = { UTILITY: 'bg-sky-100 text-sky-700', MARKETING: 'bg-amber-100 text-amber-700', AUTHENTICATION: 'bg-panel text-muted' };

const blank = {
  template_name: '', category: 'UTILITY', language: 'en', approval_status: 'PENDING',
  send_context: '', header_text: '', body_text: '', footer_text: '',
  variablesText: '', buttonsText: '', is_active: true,
};
const buttonsToText = (b) => (Array.isArray(b) ? b.map((x) => x.text || x.title || '').filter(Boolean).join(', ') : '');
const textToButtons = (t) => String(t || '').split(',').map((s) => s.trim()).filter(Boolean).map((text) => ({ type: 'QUICK_REPLY', text }));
const varsToText = (v) => (Array.isArray(v) ? v.join(', ') : '');
const textToVars = (t) => String(t || '').split(',').map((s) => s.trim()).filter(Boolean);

export default function Templates() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => { setErr(''); api.templates().then((d) => setRows(d.rows || [])).catch((e) => setErr(e.message)); };
  useEffect(() => { load(); }, []);

  if (err && !rows) return <ErrorBox message={err} onRetry={load} />;
  if (!rows) return <Spinner />;

  const startEdit = (r) => setEditing({
    id: r.id, template_name: r.template_name, category: r.category, language: r.language || 'en',
    approval_status: r.approval_status, send_context: r.send_context || '',
    header_text: r.header_text || '', body_text: r.body_text || '', footer_text: r.footer_text || '',
    variablesText: varsToText(r.variables), buttonsText: buttonsToText(r.buttons), is_active: r.is_active,
  });

  const save = async () => {
    const e = editing;
    const body = {
      template_name: e.template_name, category: e.category, language: e.language,
      approval_status: e.approval_status, send_context: e.send_context,
      header_text: e.header_text, body_text: e.body_text, footer_text: e.footer_text,
      variables: textToVars(e.variablesText), buttons: textToButtons(e.buttonsText), is_active: e.is_active,
    };
    setSaving(true);
    try {
      if (e.id) await api.updateTemplate(e.id, body); else await api.createTemplate(body);
      setEditing(null); load();
    } catch (err) { setErr(err.message); } finally { setSaving(false); }
  };

  const patch = async (r, body) => {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...body } : x)));
    try { await api.updateTemplate(r.id, body); } catch (e) { setErr(e.message); load(); }
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.template_name}? Senders that use it will stop until you re-add it.`)) return;
    try { await api.deleteTemplate(r.id); load(); } catch (e) { setErr(e.message); }
  };

  const approved = rows.filter((r) => r.approval_status === 'APPROVED' && r.is_active).length;

  return (
    <>
      <PageHead title="WhatsApp templates" sub={`${approved} approved & active · ${rows.length} total`}
        right={<button className="btn-primary" onClick={() => setEditing({ ...blank })}>+ New template</button>} />

      {err && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-[13px] text-body">
        Adding a row here <b>registers it locally</b> — it doesn't create the template in Meta. Author &amp; submit each
        template in the WhatsApp Manager, add a matching row, then flip it to <b>APPROVED</b> once Meta clears it. Senders
        pick up approved, active rows automatically.
      </div>

      {editing && <Editor form={editing} setForm={setEditing} onSave={save} onCancel={() => setEditing(null)} saving={saving} />}

      <div className="space-y-3">
        {rows.map((r) => {
          const active = r.is_active;
          return (
            <div key={r.id} className={`card p-5 ${active ? '' : 'opacity-60'}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand">{r.template_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${CAT_TONE[r.category] || 'bg-panel text-muted'}`}>{r.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[r.approval_status] || 'bg-panel text-muted'}`}>{r.approval_status}</span>
                {!active && <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] font-bold text-muted">inactive</span>}
                {r.send_context && <span className="text-xs text-muted">· sends: <b className="text-body">{r.send_context}</b></span>}
                <span className="ml-auto text-xs text-muted">{r.language}</span>
              </div>

              <div className="mb-3 rounded-xl bg-panel p-3 text-sm">
                {r.header_text && <div className="mb-1 font-bold text-ink">{r.header_text}</div>}
                <div className="whitespace-pre-wrap text-body">{r.body_text}</div>
                {r.footer_text && <div className="mt-1 text-xs italic text-muted">{r.footer_text}</div>}
              </div>

              {Array.isArray(r.variables) && r.variables.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {r.variables.map((v, k) => (
                    <span key={k} className="rounded bg-panel px-1.5 py-0.5 font-mono text-[11px] text-muted">{`{{${k + 1}}}`} {v}</span>
                  ))}
                </div>
              )}
              {Array.isArray(r.buttons) && r.buttons.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {r.buttons.map((b, k) => (
                    <span key={k} className="rounded bg-ok/10 px-1.5 py-0.5 text-[11px] text-ok">▸ {b.text || b.title}</span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                {['APPROVED', 'PENDING', 'REJECTED'].filter((s) => s !== r.approval_status).map((s) => (
                  <button key={s} onClick={() => patch(r, { approval_status: s })}
                    className="rounded-lg border border-line px-2.5 py-1 font-semibold text-body hover:border-brand-accent">Mark {s}</button>
                ))}
                <button onClick={() => patch(r, { is_active: !active })} className="rounded-lg border border-line px-2.5 py-1 font-semibold text-body hover:border-brand-accent">
                  {active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="ml-auto flex gap-1">
                  <button onClick={() => startEdit(r)} className="rounded-lg border border-line px-2.5 py-1 font-semibold text-body hover:border-brand-accent">Edit</button>
                  <button onClick={() => remove(r)} className="rounded-lg border border-red-200 px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {!rows.length && <div className="card p-8 text-center text-muted">No templates registered yet. Tap "New template" to add one.</div>}
      </div>
    </>
  );
}

function Editor({ form, setForm, onSave, onCancel, saving }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!form.id;
  const L = ({ children }) => <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">{children}</span>;
  return (
    <div className="mb-4 card border-2 border-brand-accent/40 p-5">
      <h3 className="mb-3 font-bold text-brand">{isEdit ? `Edit ${form.template_name}` : 'New template'}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><L>Template name</L>
          <input className="input font-mono" placeholder="gp_thankyou_v1" value={form.template_name} disabled={isEdit}
            onChange={(e) => set('template_name', e.target.value.toLowerCase())} /></label>
        <label className="block"><L>Sends for (context)</L>
          <input className="input" placeholder="watch_alert / launch / trial_ending…" value={form.send_context}
            onChange={(e) => set('send_context', e.target.value)} /></label>
        <label className="block"><L>Category</L>
          <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option>UTILITY</option><option>MARKETING</option><option>AUTHENTICATION</option></select></label>
        <label className="block"><L>Status</L>
          <select className="input" value={form.approval_status} onChange={(e) => set('approval_status', e.target.value)}>
            <option>PENDING</option><option>APPROVED</option><option>REJECTED</option></select></label>
      </div>
      <label className="mt-3 block"><L>Header text (optional)</L>
        <input className="input" value={form.header_text} onChange={(e) => set('header_text', e.target.value)} /></label>
      <label className="mt-3 block"><L>Body text</L>
        <textarea className="input min-h-[110px]" placeholder="Use {{1}}, {{2}}… for variables"
          value={form.body_text} onChange={(e) => set('body_text', e.target.value)} /></label>
      <label className="mt-3 block"><L>Footer text (optional)</L>
        <input className="input" value={form.footer_text} onChange={(e) => set('footer_text', e.target.value)} /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block"><L>Variables (comma-separated, in order)</L>
          <input className="input" placeholder="name, vehicle, document, status" value={form.variablesText}
            onChange={(e) => set('variablesText', e.target.value)} /></label>
        <label className="block"><L>Quick-reply buttons (comma-separated)</L>
          <input className="input" placeholder="Open dashboard" value={form.buttonsText}
            onChange={(e) => set('buttonsText', e.target.value)} /></label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-body">
        <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
        Active (available to senders when APPROVED)
      </label>
      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add template'}</button>
        <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-body" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}
