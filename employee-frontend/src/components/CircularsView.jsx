import { useState, useEffect, useCallback } from 'react';
import { getCirculars, createCircular, deleteCircular } from '../api/circularsApi';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

const emptyForm = { title: '', content: '', createdBy: '' };

export default function CircularsView() {
  const { can } = useAuth();
  const [circulars, setCirculars] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() =>
    getCirculars().then(r => setCirculars(r.data)).catch(() => setError('Failed to load circulars.')), []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCircular(form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch { setError('Failed to publish circular.'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this circular?')) return;
    try { await deleteCircular(id); load(); }
    catch { setError('Failed to remove circular.'); }
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          {error}<button onClick={() => setError('')}>&#x2715;</button>
        </div>
      )}

      <div className="content-panel">
        <div className="search-filter">
          <div className="search-filter-controls">
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {circulars.length} circular{circulars.length !== 1 ? 's' : ''} published
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {can('manageCirculars') && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Circular</button>
            )}
          </div>
        </div>

        {circulars.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6b7280' }}>
            No circulars published yet.
          </div>
        ) : (
          <div className="circulars-list" style={{ padding: '0 1.25rem 1.25rem' }}>
            {circulars.map(c => (
              <div key={c.id} className="circular-card">
                <div className="circular-header">
                  <div className="circular-title">{c.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="circular-meta">
                      {c.createdBy && <span>{c.createdBy}</span>}
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    {can('manageCirculars') && (
                      <button className="btn-delete" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }} onClick={() => handleDelete(c.id)}>Remove</button>
                    )}
                  </div>
                </div>
                <div className="circular-content">{c.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 560 }}>
            <h2>New Circular</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-full">Title
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Office Closure Notice" />
                </label>
                <label className="form-full">Author (optional)
                  <input value={form.createdBy} onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))} placeholder="HR Department" />
                </label>
                <label className="form-full">Content
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} required placeholder="Write the circular content…" />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <><Spinner /> Publishing…</> : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
