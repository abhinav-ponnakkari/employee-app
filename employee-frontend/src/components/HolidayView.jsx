import { useState, useEffect } from 'react';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../api/holidaysApi';
import { useAuth } from '../context/AuthContext';

export default function HolidayView() {
  const { user } = useAuth();
  const canEdit = user.role === 'Admin' || user.role === 'HR';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', isRecurring: true });
  const [saving, setSaving] = useState(false);

  const load = () =>
    getHolidays(year).then(r => setHolidays(r.data)).catch(() => {});

  useEffect(() => { load(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => { setEditing(null); setForm({ name: '', date: '', isRecurring: true }); setShowForm(true); };
  const openEdit = (h) => { setEditing(h); setForm({ name: h.name, date: h.date, isRecurring: h.isRecurring }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name || !form.date) return;
    setSaving(true);
    try {
      if (editing) await updateHoliday(editing.id, form);
      else await createHoliday(form);
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    await deleteHoliday(id);
    load();
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() + i - 1);

  return (
    <div className="content-panel">
      <div className="panel-header">
        <h2 className="panel-title">Holiday Calendar</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="filter-select" value={year} onChange={e => setYear(+e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {canEdit && <button className="btn-primary" onClick={openNew}>+ Add Holiday</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Holiday</th>
              <th>Date</th>
              <th>Day</th>
              <th>Type</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 ? (
              <tr><td colSpan={canEdit ? 5 : 4} className="empty">No holidays added for {year}.</td></tr>
            ) : holidays.map(h => {
              const d = new Date(h.date + 'T00:00:00');
              const isPast = d < now;
              return (
                <tr key={h.id} style={{ opacity: isPast ? 0.55 : 1 }}>
                  <td style={{ fontWeight: 500 }}>{h.name}</td>
                  <td>{d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                  <td className="muted">{d.toLocaleDateString(undefined, { weekday: 'long' })}</td>
                  <td>
                    {h.isRecurring
                      ? <span className="badge badge-active">Annual</span>
                      : <span className="badge badge-inactive">One-time</span>}
                  </td>
                  {canEdit && (
                    <td className="actions">
                      <div className="actions-inner">
                        <button className="btn-edit" onClick={() => openEdit(h)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(h.id)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Holiday' : 'Add Holiday'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className="form-label">
                Holiday Name
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Christmas Day" />
              </label>
              <label className="form-label">
                Date
                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} />
                Recurring annually
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.date}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
