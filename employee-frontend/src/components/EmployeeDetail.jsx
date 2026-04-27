import { useState, useEffect } from 'react';
import { avatarColor } from '../utils';
import { getSalaryHistory, addSalaryHistory, deleteSalaryHistory } from '../api/salaryHistoryApi';
import { getNotes, addNote, deleteNote } from '../api/notesApi';

const AVATAR_COLORS_MAP = ['blue', 'green', 'purple', 'orange', 'teal'];

const NOTE_TYPES = ['General', 'HR', 'Performance', 'Warning'];
const NOTE_BADGE = { General: 'badge-note-general', HR: 'badge-note-hr', Performance: 'badge-note-performance', Warning: 'badge-note-warning' };

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function SalaryChange({ entry }) {
  const diff = entry.newSalary - entry.oldSalary;
  const pct = entry.oldSalary > 0 ? ((diff / entry.oldSalary) * 100).toFixed(1) : 0;
  const cls = diff >= 0 ? 'positive' : 'negative';
  const sign = diff >= 0 ? '+' : '';
  return (
    <div className="salary-entry">
      <div>
        <div style={{ fontSize: '0.82rem', color: '#d1d5db' }}>
          ${entry.oldSalary.toLocaleString()} &rarr; <strong>${entry.newSalary.toLocaleString()}</strong>
        </div>
        {entry.reason && <div className="salary-reason">{entry.reason}</div>}
        <div className="salary-date">{new Date(entry.effectiveDate).toLocaleDateString()}</div>
      </div>
      <span className={`salary-change ${cls}`}>{sign}${Math.abs(diff).toLocaleString()} ({sign}{pct}%)</span>
    </div>
  );
}

export default function EmployeeDetail({ employee: emp, onEdit, onDelete, onClose, onRefresh }) {
  const [tab, setTab] = useState('profile');
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ newSalary: '', effectiveDate: '', reason: '' });
  const [noteForm, setNoteForm] = useState({ content: '', noteType: 'General', createdBy: '' });
  const [saving, setSaving] = useState(false);

  const initials = `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase();
  const color = avatarColor(emp.firstName + emp.lastName);
  const status = emp.status ?? 'Active';

  useEffect(() => {
    if (tab === 'salary') {
      getSalaryHistory(emp.id).then(r => setSalaryHistory(r.data)).catch(() => {});
    }
    if (tab === 'notes') {
      getNotes(emp.id).then(r => setNotes(r.data)).catch(() => {});
    }
  }, [tab, emp.id]);

  const handleAddSalary = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addSalaryHistory({
        employeeId: emp.id,
        newSalary: parseFloat(salaryForm.newSalary),
        effectiveDate: salaryForm.effectiveDate,
        reason: salaryForm.reason || null,
      });
      setSalaryForm({ newSalary: '', effectiveDate: '', reason: '' });
      setShowSalaryForm(false);
      getSalaryHistory(emp.id).then(r => setSalaryHistory(r.data));
      onRefresh?.();
    } catch {}
    setSaving(false);
  };

  const handleDeleteSalary = async (id) => {
    if (!window.confirm('Remove this salary record?')) return;
    await deleteSalaryHistory(id);
    getSalaryHistory(emp.id).then(r => setSalaryHistory(r.data));
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.content.trim()) return;
    setSaving(true);
    try {
      await addNote({ employeeId: emp.id, content: noteForm.content, noteType: noteForm.noteType, createdBy: noteForm.createdBy || null });
      setNoteForm({ content: '', noteType: 'General', createdBy: '' });
      getNotes(emp.id).then(r => setNotes(r.data));
    } catch {}
    setSaving(false);
  };

  const handleDeleteNote = async (id) => {
    await deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <div className="side-panel-backdrop" onClick={onClose} />
      <aside className="side-panel">
        <div className="side-panel-header">
          <button className="side-panel-close" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Profile header — always visible */}
        <div className="detail-profile-mini">
          {emp.photoUrl
            ? <img className={`detail-avatar avatar-${color}`} src={emp.photoUrl} alt={initials} />
            : <div className={`detail-avatar avatar-${color}`}>{initials}</div>
          }
          <div className="detail-name">{emp.firstName} {emp.lastName}</div>
          {emp.position && <div className="detail-position">{emp.position}</div>}
          <div className="detail-badge-row">
            <span className={`badge badge-${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          {['profile', 'salary', 'notes'].map(t => (
            <button key={t} className={`detail-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'profile' ? 'Profile' : t === 'salary' ? 'Salary History' : 'Notes'}
            </button>
          ))}
        </div>

        <div className="side-panel-body">
          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <>
              <div className="detail-section">
                <div className="detail-section-title">Contact</div>
                <DetailRow label="Email" value={emp.email} />
                <DetailRow label="Phone" value={emp.phone} />
              </div>
              <div className="detail-section">
                <div className="detail-section-title">Employment</div>
                <DetailRow label="Department" value={emp.department} />
                <DetailRow label="Position" value={emp.position} />
                <DetailRow label="Salary" value={`$${emp.salary.toLocaleString()}`} />
                <DetailRow label="Hire Date" value={new Date(emp.hireDate).toLocaleDateString()} />
                <DetailRow label="Status" value={status} />
              </div>
              <div className="detail-section">
                <div className="detail-section-title">Personal</div>
                <DetailRow label="Gender" value={emp.gender} />
                <DetailRow label="Date of Birth" value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : null} />
              </div>
            </>
          )}

          {/* ── Salary History tab ── */}
          {tab === 'salary' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Current: <strong style={{ color: '#86efac' }}>${emp.salary.toLocaleString()}</strong></span>
                <button className="btn-primary btn-sm" onClick={() => setShowSalaryForm(v => !v)}>
                  {showSalaryForm ? 'Cancel' : '+ Add Change'}
                </button>
              </div>

              {showSalaryForm && (
                <form className="inline-form" onSubmit={handleAddSalary}>
                  <label>New Salary
                    <input type="number" value={salaryForm.newSalary} onChange={e => setSalaryForm(f => ({ ...f, newSalary: e.target.value }))} min="0" step="0.01" required placeholder="e.g. 80000" />
                  </label>
                  <label>Effective Date
                    <input type="date" value={salaryForm.effectiveDate} onChange={e => setSalaryForm(f => ({ ...f, effectiveDate: e.target.value }))} required />
                  </label>
                  <label>Reason (optional)
                    <input value={salaryForm.reason} onChange={e => setSalaryForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Annual review" />
                  </label>
                  <div className="inline-form-actions">
                    <button type="submit" className="btn-primary btn-sm" disabled={saving}>Save</button>
                  </div>
                </form>
              )}

              {salaryHistory.length === 0
                ? <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '1rem' }}>No salary history yet.</p>
                : salaryHistory.map(entry => (
                    <div key={entry.id} style={{ position: 'relative' }}>
                      <SalaryChange entry={entry} />
                      <button className="note-delete" style={{ position: 'absolute', top: '0.5rem', right: 0 }} onClick={() => handleDeleteSalary(entry.id)} title="Remove">&#x2715;</button>
                    </div>
                  ))
              }
            </div>
          )}

          {/* ── Notes tab ── */}
          {tab === 'notes' && (
            <div>
              <form className="inline-form" onSubmit={handleAddNote} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label style={{ flex: 1 }}>Type
                    <select value={noteForm.noteType} onChange={e => setNoteForm(f => ({ ...f, noteType: e.target.value }))}>
                      {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ flex: 2 }}>Author (optional)
                    <input value={noteForm.createdBy} onChange={e => setNoteForm(f => ({ ...f, createdBy: e.target.value }))} placeholder="Your name" />
                  </label>
                </div>
                <label>Note
                  <textarea value={noteForm.content} onChange={e => setNoteForm(f => ({ ...f, content: e.target.value }))} rows={3} placeholder="Add an internal note..." required />
                </label>
                <div className="inline-form-actions">
                  <button type="submit" className="btn-primary btn-sm" disabled={saving || !noteForm.content.trim()}>Add Note</button>
                </div>
              </form>

              {notes.length === 0
                ? <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>No notes yet.</p>
                : notes.map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-header">
                        <span className={`badge ${NOTE_BADGE[note.noteType] ?? 'badge-note-general'}`}>{note.noteType}</span>
                        {note.createdBy && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{note.createdBy}</span>}
                        <button className="note-delete" onClick={() => handleDeleteNote(note.id)} title="Delete">&#x2715;</button>
                      </div>
                      <div className="note-content">{note.content}</div>
                      <div className="note-meta">{new Date(note.createdAt).toLocaleString()}</div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        <div className="side-panel-actions">
          <button className="btn-edit" onClick={onEdit}>Edit</button>
          <button className="btn-delete" onClick={onDelete}>Delete</button>
        </div>
      </aside>
    </>
  );
}
