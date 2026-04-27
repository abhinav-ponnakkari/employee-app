import { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, resetPassword, deleteUser } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

const emptyForm = { displayName: '', username: '', password: '', confirm: '', role: 'HR' };

export default function UsersView() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null); // { id, username }
  const [resetPw, setResetPw] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() =>
    getUsers().then(r => setUsers(r.data)).catch(() => setError('Failed to load users.')), []);

  useEffect(() => { load(); }, [load]);

  const setF = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setFormError(''); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setFormError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      await createUser({ username: form.username, password: form.password, role: form.role, displayName: form.displayName, employeeId: null });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to create account.');
    }
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    if (resetPw.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
    if (resetPw !== resetConfirm) { setResetError('Passwords do not match.'); return; }
    setResetting(true);
    try {
      await resetPassword(resetTarget.id, resetPw);
      setResetTarget(null); setResetPw(''); setResetConfirm(''); setResetError('');
    } catch { setResetError('Failed to reset password.'); }
    setResetting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account?')) return;
    try { await deleteUser(id); load(); }
    catch (err) { setError(err.response?.data?.message ?? 'Failed to delete.'); }
  };

  // Non-employee users (admin + HR), sorted with Admins first
  const staffUsers = users.filter(u => u.role !== 'Employee').sort((a, b) => a.role.localeCompare(b.role));
  // Employee users (show login status overview)
  const employeeUsers = users.filter(u => u.role === 'Employee');

  return (
    <div>
      {error && (
        <div className="error-banner">
          {error}<button onClick={() => setError('')}>&#x2715;</button>
        </div>
      )}

      {/* Staff (HR / Admin) accounts */}
      <div className="content-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="search-filter">
          <div className="search-filter-controls">
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              HR &amp; Admin Accounts ({staffUsers.length})
            </span>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm(true); setFormError(''); setForm(emptyForm); }}>
            + Add Staff Account
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Display Name</th><th>Username</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {staffUsers.length === 0 ? (
                <tr><td colSpan={4} className="empty">No staff accounts.</td></tr>
              ) : staffUsers.map(u => (
                <tr key={u.id}>
                  <td className="cell-name-text">{u.displayName}</td>
                  <td><code style={{ fontSize: '0.85rem', color: '#93c5fd' }}>{u.username}</code></td>
                  <td>
                    <span className={`role-badge role-badge-${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td>
                    <div className="actions-inner">
                      <button className="btn-edit" onClick={() => { setResetTarget(u); setResetPw(''); setResetConfirm(''); setResetError(''); }}>
                        Reset Password
                      </button>
                      {u.id !== me?.id && (
                        <button className="btn-delete" onClick={() => handleDelete(u.id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee login overview */}
      <div className="content-panel">
        <div className="search-filter">
          <span style={{ fontSize: '0.85rem', color: '#6b7280', padding: '0.25rem 0' }}>
            Employee Logins ({employeeUsers.length}) — manage via employee edit form
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Display Name</th><th>Username</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {employeeUsers.length === 0 ? (
                <tr><td colSpan={3} className="empty">No employee accounts yet. Assign login credentials when editing an employee.</td></tr>
              ) : employeeUsers.map(u => (
                <tr key={u.id}>
                  <td className="cell-name-text">{u.displayName}</td>
                  <td><code style={{ fontSize: '0.85rem', color: '#c4b5fd' }}>{u.username}</code></td>
                  <td>
                    <div className="actions-inner">
                      <button className="btn-edit" onClick={() => { setResetTarget(u); setResetPw(''); setResetConfirm(''); setResetError(''); }}>
                        Reset Password
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(u.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create staff account modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440 }}>
            <h2>Add Staff Account</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <label>Role
                  <select name="role" value={form.role} onChange={setF}>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
                <label>Display Name
                  <input name="displayName" value={form.displayName} onChange={setF} required placeholder="e.g. Jane HR" />
                </label>
                <label>Username
                  <input name="username" value={form.username} onChange={setF} required autoComplete="off" placeholder="e.g. jane.hr" />
                </label>
                <label>Password
                  <input type="password" name="password" value={form.password} onChange={setF} required autoComplete="new-password" placeholder="Min. 6 characters" />
                </label>
                <label className="form-full">Confirm Password
                  <input type="password" name="confirm" value={form.confirm} onChange={setF} required autoComplete="new-password" placeholder="Repeat password" />
                </label>
                {formError && <div className="form-full login-field-error">{formError}</div>}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <><Spinner /> Creating…</> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2>Reset Password</h2>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Resetting password for <strong style={{ color: '#f9fafb' }}>{resetTarget.username}</strong>
            </p>
            <div className="form-grid">
              <label className="form-full">New Password
                <input type="password" value={resetPw} onChange={e => { setResetPw(e.target.value); setResetError(''); }} autoComplete="new-password" placeholder="Min. 6 characters" />
              </label>
              <label className="form-full">Confirm Password
                <input type="password" value={resetConfirm} onChange={e => { setResetConfirm(e.target.value); setResetError(''); }} autoComplete="new-password" placeholder="Repeat password" />
              </label>
              {resetError && <div className="form-full login-field-error">{resetError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setResetTarget(null)} disabled={resetting}>Cancel</button>
              <button className="btn-primary" onClick={handleResetPassword} disabled={resetting}>
                {resetting ? <><Spinner /> Saving…</> : 'Set Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
