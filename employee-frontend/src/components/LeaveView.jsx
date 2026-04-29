import { useState, useEffect, useCallback, useMemo } from 'react';
import { getLeaveRequests, createLeaveRequest, updateLeaveStatus, deleteLeaveRequest } from '../api/leaveApi';
import { getLeavePolicies } from '../api/leavePoliciesApi';
import { checkHolidays } from '../api/holidaysApi';
import { getLeaveBalance } from '../api/leavePoliciesApi';
import { avatarColor, calcDays } from '../utils';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Personal', 'Other'];
const emptyForm = { employeeId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' };

function LeaveTypeBadge({ type }) {
  return <span className="badge badge-leave-type">{type}</span>;
}

function LeaveStatusBadge({ status }) {
  const cls = status === 'Approved' ? 'badge-active'
    : status === 'Rejected' ? 'badge-rejected'
    : 'badge-on-leave';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function Avatar({ emp }) {
  const initials = `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase();
  const color = avatarColor(emp.firstName + emp.lastName);
  return <div className={`avatar avatar-${color}`}>{initials}</div>;
}

export default function LeaveView({ employees }) {
  const { can } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [balanceEmpId, setBalanceEmpId] = useState('');
  const [balance, setBalance] = useState([]);
  const [holidayWarnings, setHolidayWarnings] = useState([]);

  useEffect(() => {
    getLeavePolicies().then(r => setPolicies(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (balanceEmpId) {
      getLeaveBalance(balanceEmpId).then(r => setBalance(r.data)).catch(() => setBalance([]));
    } else {
      setBalance([]);
    }
  }, [balanceEmpId]);

  useEffect(() => {
    if (form.startDate && form.endDate) {
      checkHolidays(form.startDate, form.endDate)
        .then(r => setHolidayWarnings(r.data))
        .catch(() => setHolidayWarnings([]));
    } else {
      setHolidayWarnings([]);
    }
  }, [form.startDate, form.endDate]);

  const load = useCallback(async () => {
    try {
      const res = await getLeaveRequests();
      setRequests(res.data);
    } catch {
      setError('Failed to load leave requests.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let r = requests;
    if (filterStatus) r = r.filter(x => x.status === filterStatus);
    if (filterEmployee) r = r.filter(x => x.employeeId === parseInt(filterEmployee));
    return r;
  }, [requests, filterStatus, filterEmployee]);

  const pending = requests.filter(r => r.status === 'Pending').length;
  const now = new Date();
  const approvedThisMonth = requests.filter(r => {
    if (r.status !== 'Approved') return false;
    const d = new Date(r.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const getEmployee = (id) => employees.find(e => e.id === id);
  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLeaveRequest({ ...form, employeeId: parseInt(form.employeeId) });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch { setError('Failed to submit request.'); }
    setSubmitting(false);
  };

  const handleApprove = async (id) => {
    try {
      await updateLeaveStatus(id, { status: 'Approved', reviewNote: null });
      load();
    } catch { setError('Failed to approve request.'); }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await updateLeaveStatus(rejectTarget, { status: 'Rejected', reviewNote: rejectNote || null });
      setRejectTarget(null);
      setRejectNote('');
      load();
    } catch { setError('Failed to reject request.'); }
    setRejecting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave request?')) return;
    try { await deleteLeaveRequest(id); load(); }
    catch { setError('Failed to delete request.'); }
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          {error}<button onClick={() => setError('')}>&#x2715;</button>
        </div>
      )}

      {/* Stats row */}
      <div className="leave-stats">
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{approvedThisMonth}</div>
            <div className="stat-label">Approved This Month</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{requests.length}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
      </div>

      {/* Content panel */}
      <div className="content-panel">
        {/* Filter bar */}
        <div className="search-filter">
          <div className="search-filter-controls">

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select value={filterEmployee} onChange={e => { setFilterEmployee(e.target.value); setBalanceEmpId(e.target.value); }}>
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
            {(filterStatus || filterEmployee) && (
              <button className="btn-clear" onClick={() => { setFilterStatus(''); setFilterEmployee(''); setBalanceEmpId(''); }}>
                Clear filters
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <span className="filter-result-count">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
            {can('createLeave') && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Request</button>
            )}
          </div>
        </div>

        {/* Leave Balance Cards — shown when an employee is selected */}
        {balance.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
            {balance.map(b => {
              const pct = b.entitlementDays > 0 ? (b.remainingDays / b.entitlementDays) * 100 : 0;
              const color = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
              return (
                <div key={b.leaveType} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 16px', minWidth: 130 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>{b.leaveType}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{b.remainingDays}<span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>/{b.entitlementDays} days</span></div>
                  <div style={{ height: 4, background: '#1e293b', borderRadius: 2, marginTop: 6 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Period</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty">No leave requests found.</td></tr>
              ) : filtered.map(req => {
                const emp = getEmployee(req.employeeId);
                const days = calcDays(req.startDate, req.endDate);
                return (
                  <tr key={req.id}>
                    <td className="cell-name">
                      {emp
                        ? <><Avatar emp={emp} /><div><div className="cell-name-text">{emp.firstName} {emp.lastName}</div><div className="cell-name-sub">{emp.department}</div></div></>
                        : <span className="muted">Employee #{req.employeeId}</span>
                      }
                    </td>
                    <td><LeaveTypeBadge type={req.leaveType} /></td>
                    <td>
                      <div className="cell-name-text">{new Date(req.startDate).toLocaleDateString()}</div>
                      <div className="cell-name-sub">&rarr; {new Date(req.endDate).toLocaleDateString()}</div>
                    </td>
                    <td>{days}d</td>
                    <td><span className="muted" title={req.reason}>{req.reason ? req.reason.slice(0, 30) + (req.reason.length > 30 ? '…' : '') : '—'}</span></td>
                    <td><LeaveStatusBadge status={req.status} /></td>
                    <td>
                      <div className="actions-inner">
                        {req.status === 'Pending' && can('approveLeave') && (
                          <>
                            <button className="btn-approve" onClick={() => handleApprove(req.id)}>Approve</button>
                            <button className="btn-reject-leave" onClick={() => { setRejectTarget(req.id); setRejectNote(''); }}>Reject</button>
                          </>
                        )}
                        {can('deleteLeave') && (
                          <button className="btn-delete" onClick={() => handleDelete(req.id)}>Delete</button>
                        )}
                        {!can('approveLeave') && !can('deleteLeave') && <span className="muted" style={{ fontSize: '0.78rem' }}>View only</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>New Leave Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-full">Employee
                  <select value={form.employeeId} onChange={e => setF('employeeId', e.target.value)} required>
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </label>
                <label>Leave Type
                  <select value={form.leaveType} onChange={e => setF('leaveType', e.target.value)}>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label></label>
                <label>Start Date
                  <input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} required />
                </label>
                <label>End Date
                  <input type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} required min={form.startDate} />
                </label>
                {form.startDate && form.endDate && (
                  <div className="form-full" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Duration: <strong style={{ color: '#60a5fa' }}>{calcDays(form.startDate, form.endDate)} day(s)</strong>
                  </div>
                )}
                {holidayWarnings.length > 0 && (
                  <div className="form-full" style={{ background: '#f59e0b18', border: '1px solid #f59e0b44', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: '#f59e0b' }}>
                    ⚠ Your leave dates include {holidayWarnings.length} public holiday(s): {holidayWarnings.map(d => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).join(', ')}
                  </div>
                )}
                <label className="form-full">Reason (optional)
                  <textarea value={form.reason} onChange={e => setF('reason', e.target.value)} rows={3} placeholder="Briefly describe the reason..." />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <><Spinner /> Submitting…</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget !== null && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2>Reject Leave Request</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              Rejection reason (optional)
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                rows={3}
                placeholder="Explain why the request is being rejected..."
              />
            </label>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRejectTarget(null)} disabled={rejecting}>Cancel</button>
              <button className="btn-delete" onClick={handleReject} disabled={rejecting}>
                {rejecting ? <><Spinner /> Rejecting…</> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* This button is rendered in App.jsx header — exported so App can pass the setter */
LeaveView.AddButton = function AddButton({ onClick }) {
  return <button className="btn-primary" onClick={onClick}>+ New Request</button>;
};
