import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaveRequests, createLeaveRequest } from '../api/leaveApi';
import { getPunchRecords, punchIn, punchOut } from '../api/punchApi';
import { getCirculars } from '../api/circularsApi';
import { getSalaryHistory } from '../api/salaryHistoryApi';
import { getLeaveBalance } from '../api/leavePoliciesApi';
import { getHolidays } from '../api/holidaysApi';
import { getMyReviews } from '../api/performanceApi';
import { avatarColor } from '../utils';
import api from '../api/axiosInstance';

const MoodPulse    = lazy(() => import('./MoodPulse'));
const PollsView    = lazy(() => import('./PollsView'));
const SkillsPanel  = lazy(() => import('./SkillsPanel'));
const FeedbackView = lazy(() => import('./FeedbackView'));
const OrgChart     = lazy(() => import('./OrgChart'));
const DocumentCenter = lazy(() => import('./DocumentCenter'));
const LeaveCalendar  = lazy(() => import('./LeaveCalendar'));

function ViewLoader() {
  return <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
}

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Personal', 'Other'];
const emptyLeave = { leaveType: 'Annual', startDate: '', endDate: '', reason: '' };

function calcDays(start, end) {
  if (!start || !end) return 0;
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

function StatusBadge({ status }) {
  const cls = status === 'Approved' ? 'badge-active'
    : status === 'Rejected' ? 'badge-rejected'
    : 'badge-on-leave';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function formatTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString();
}
function formatDuration(punchIn, punchOut) {
  if (!punchIn || !punchOut) return null;
  const mins = Math.round((new Date(punchOut) - new Date(punchIn)) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h ${m}m`;
}

// ── Salary Slip Print Component ──────────────────────────────────────────────
function SalarySlip({ employee, salaryHistory, onClose }) {
  const latest = salaryHistory[0];
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  return (
    <div className="modal-backdrop">
      <div className="modal salary-slip-modal">
        <div className="salary-slip" id="salary-slip-print">
          <div className="slip-header">
            <div className="slip-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="slip-company">HR Manager</span>
            </div>
            <div className="slip-title-block">
              <div className="slip-title">Salary Slip</div>
              <div className="slip-period">{month}</div>
            </div>
          </div>

          <div className="slip-employee-info">
            <div className="slip-row"><span>Name</span><span>{employee.firstName} {employee.lastName}</span></div>
            <div className="slip-row"><span>Department</span><span>{employee.department}</span></div>
            <div className="slip-row"><span>Position</span><span>{employee.position ?? '—'}</span></div>
            <div className="slip-row"><span>Hire Date</span><span>{new Date(employee.hireDate).toLocaleDateString()}</span></div>
            <div className="slip-row"><span>Status</span><span>{employee.status ?? 'Active'}</span></div>
          </div>

          <div className="slip-section-title">Earnings</div>
          <div className="slip-earnings">
            <div className="slip-row"><span>Basic Salary</span><span>${employee.salary.toLocaleString()}</span></div>
            <div className="slip-row slip-total"><span>Gross Pay</span><span>${employee.salary.toLocaleString()}</span></div>
          </div>

          {latest && (
            <>
              <div className="slip-section-title">Latest Salary Change</div>
              <div className="slip-earnings">
                <div className="slip-row"><span>Effective Date</span><span>{new Date(latest.effectiveDate).toLocaleDateString()}</span></div>
                <div className="slip-row"><span>Previous Salary</span><span>${latest.oldSalary.toLocaleString()}</span></div>
                <div className="slip-row"><span>New Salary</span><span>${latest.newSalary.toLocaleString()}</span></div>
                {latest.reason && <div className="slip-row"><span>Reason</span><span>{latest.reason}</span></div>}
              </div>
            </>
          )}

          <div className="slip-footer">
            <div>Generated on {new Date().toLocaleDateString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>This is a system-generated document.</div>
          </div>
        </div>

        <div className="modal-actions no-print">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Portal ──────────────────────────────────────────────────────────────
export default function EmployeePortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [punches, setPunches] = useState([]);
  const [circulars, setCirculars] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Leave form
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [submitting, setSubmitting] = useState(false);

  // Punch state
  const [punchLoading, setPunchLoading] = useState(false);

  // Salary slip
  const [showSlip, setShowSlip] = useState(false);

  // Load employee profile
  useEffect(() => {
    api.get('/employees/me')
      .then(r => setEmployee(r.data))
      .catch(() => setError('Could not load your employee profile.'))
      .finally(() => setLoading(false));
  }, []);

  const loadLeaves = useCallback(() =>
    getLeaveRequests().then(r => setLeaves(r.data)).catch(() => {}), []);

  const loadPunches = useCallback(() =>
    getPunchRecords().then(r => setPunches(r.data)).catch(() => {}), []);

  const loadCirculars = useCallback(() =>
    getCirculars().then(r => setCirculars(r.data)).catch(() => {}), []);

  const loadSalary = useCallback(() => {
    if (!user.employeeId) return;
    getSalaryHistory(user.employeeId).then(r => setSalaryHistory(r.data)).catch(() => {});
  }, [user.employeeId]);

  useEffect(() => {
    if (user.employeeId) getLeaveBalance(user.employeeId).then(r => setLeaveBalance(r.data)).catch(() => {});
    getHolidays(new Date().getFullYear()).then(r => setHolidays(r.data)).catch(() => {});
    getMyReviews().then(r => setMyReviews(r.data)).catch(() => {});
  }, [user.employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'leaves') loadLeaves();
    if (tab === 'punch') loadPunches();
    if (tab === 'circulars') loadCirculars();
    if (tab === 'salary') { loadSalary(); if (employee) {} }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Today's punch status
  const today = new Date().toDateString();
  const todayPunch = punches.find(p => new Date(p.punchIn).toDateString() === today);
  const isPunchedIn = todayPunch && !todayPunch.punchOut;

  const handlePunchIn = async () => {
    setPunchLoading(true);
    try { await punchIn(); await loadPunches(); }
    catch (err) { setError(err.response?.data?.message ?? 'Punch in failed.'); }
    setPunchLoading(false);
  };

  const handlePunchOut = async () => {
    if (!todayPunch) return;
    setPunchLoading(true);
    try { await punchOut(todayPunch.id); await loadPunches(); }
    catch (err) { setError(err.response?.data?.message ?? 'Punch out failed.'); }
    setPunchLoading(false);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLeaveRequest({ ...leaveForm, employeeId: user.employeeId });
      setShowLeaveForm(false);
      setLeaveForm(emptyLeave);
      loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit leave request.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="portal-loading">
        <Spinner />
        <span>Loading your profile…</span>
      </div>
    );
  }

  const initials = employee
    ? `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase()
    : user.displayName?.[0]?.toUpperCase() ?? '?';
  const color = employee ? avatarColor(employee.firstName + employee.lastName) : 'blue';

  const TABS = [
    { key: 'profile',   label: 'My Profile' },
    { key: 'leaves',    label: 'Leave Requests' },
    { key: 'punch',     label: 'Punch Records' },
    { key: 'circulars', label: 'Circulars' },
    { key: 'salary',    label: 'Salary Slip' },
    { key: 'holidays',  label: 'Holidays' },
    { key: 'reviews',   label: 'My Reviews' },
    { key: 'mood',      label: '😊 Mood Check-in' },
    { key: 'polls',     label: '📊 Polls' },
    { key: 'skills',    label: '⚡ My Skills' },
    { key: 'feedback',  label: '💬 Feedback' },
    { key: 'leavecal',  label: '📅 Leave Calendar' },
    { key: 'orgchart',  label: '🏢 Org Chart' },
    { key: 'docs',      label: '📁 Documents' },
  ];

  return (
    <div className="portal-layout">
      {error && (
        <div className="error-banner">
          {error}<button onClick={() => setError('')}>&#x2715;</button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="portal-sidebar">
        <div className="portal-avatar-wrap">
          <div className={`portal-avatar avatar-${color}`}>{initials}</div>
          <div className="portal-name">{user.displayName}</div>
          {employee && <div className="portal-position">{employee.position ?? employee.department}</div>}
        </div>
        <nav className="portal-nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`portal-nav-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="portal-content">

        {/* ── Profile ── */}
        {tab === 'profile' && (
          <div className="portal-section">
            <h2 className="portal-section-title">My Profile</h2>
            {!employee ? (
              <p className="muted">No employee record is linked to your account. Contact HR.</p>
            ) : (
              <div className="profile-grid">
                <div className="profile-card">
                  <div className="profile-card-title">Contact</div>
                  <div className="profile-row"><span>Email</span><span>{employee.email}</span></div>
                  {employee.phone && <div className="profile-row"><span>Phone</span><span>{employee.phone}</span></div>}
                </div>
                <div className="profile-card">
                  <div className="profile-card-title">Employment</div>
                  <div className="profile-row"><span>Department</span><span>{employee.department}</span></div>
                  {employee.position && <div className="profile-row"><span>Position</span><span>{employee.position}</span></div>}
                  <div className="profile-row"><span>Hire Date</span><span>{new Date(employee.hireDate).toLocaleDateString()}</span></div>
                  <div className="profile-row"><span>Status</span><span>{employee.status ?? 'Active'}</span></div>
                </div>
                {(employee.gender || employee.dateOfBirth) && (
                  <div className="profile-card">
                    <div className="profile-card-title">Personal</div>
                    {employee.gender && <div className="profile-row"><span>Gender</span><span>{employee.gender}</span></div>}
                    {employee.dateOfBirth && <div className="profile-row"><span>Date of Birth</span><span>{new Date(employee.dateOfBirth).toLocaleDateString()}</span></div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Leave Requests ── */}
        {tab === 'leaves' && (
          <div className="portal-section">
            <div className="portal-section-header">
              <h2 className="portal-section-title">My Leave Requests</h2>
              <button className="btn-primary" onClick={() => setShowLeaveForm(true)}>+ Apply for Leave</button>
            </div>

            {leaves.length === 0 ? (
              <p className="muted" style={{ marginTop: '1rem' }}>No leave requests yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Period</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Review Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(r => (
                      <tr key={r.id}>
                        <td><span className="badge badge-leave-type">{r.leaveType}</span></td>
                        <td>
                          <div className="cell-name-text">{new Date(r.startDate).toLocaleDateString()}</div>
                          <div className="cell-name-sub">&rarr; {new Date(r.endDate).toLocaleDateString()}</div>
                        </td>
                        <td>{calcDays(r.startDate, r.endDate)}d</td>
                        <td><span className="muted">{r.reason ? r.reason.slice(0, 35) + (r.reason.length > 35 ? '…' : '') : '—'}</span></td>
                        <td><StatusBadge status={r.status} /></td>
                        <td><span className="muted" style={{ fontSize: '0.8rem' }}>{r.reviewNote ?? '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Punch Records ── */}
        {tab === 'punch' && (
          <div className="portal-section">
            <div className="portal-section-header">
              <h2 className="portal-section-title">Punch Records</h2>
              <div className="punch-actions">
                {!isPunchedIn ? (
                  <button className="btn-approve" onClick={handlePunchIn} disabled={punchLoading}>
                    {punchLoading ? <><Spinner /> …</> : '▶ Punch In'}
                  </button>
                ) : (
                  <button className="btn-reject-leave" onClick={handlePunchOut} disabled={punchLoading}>
                    {punchLoading ? <><Spinner /> …</> : '■ Punch Out'}
                  </button>
                )}
              </div>
            </div>

            {todayPunch && (
              <div className="punch-today-card">
                <div>Today</div>
                <div>In: <strong>{formatTime(todayPunch.punchIn)}</strong></div>
                {todayPunch.punchOut
                  ? <><div>Out: <strong>{formatTime(todayPunch.punchOut)}</strong></div><div>Duration: <strong>{formatDuration(todayPunch.punchIn, todayPunch.punchOut)}</strong></div></>
                  : <div className="punch-open">Still working…</div>
                }
              </div>
            )}

            {punches.length === 0 ? (
              <p className="muted" style={{ marginTop: '1rem' }}>No punch records yet. Use the button above to punch in.</p>
            ) : (
              <div className="table-wrap" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Duration</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {punches.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.punchIn)}</td>
                        <td>{formatTime(p.punchIn)}</td>
                        <td>{p.punchOut ? formatTime(p.punchOut) : <span className="badge badge-on-leave">Open</span>}</td>
                        <td>{formatDuration(p.punchIn, p.punchOut) ?? <span className="muted">—</span>}</td>
                        <td><span className="muted">{p.notes ?? '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Circulars ── */}
        {tab === 'circulars' && (
          <div className="portal-section">
            <h2 className="portal-section-title">Company Circulars</h2>
            {circulars.length === 0 ? (
              <p className="muted" style={{ marginTop: '1rem' }}>No circulars published yet.</p>
            ) : (
              <div className="circulars-list">
                {circulars.map(c => (
                  <div key={c.id} className="circular-card">
                    <div className="circular-header">
                      <div className="circular-title">{c.title}</div>
                      <div className="circular-meta">
                        {c.createdBy && <span>{c.createdBy}</span>}
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="circular-content">{c.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Salary Slip ── */}
        {tab === 'salary' && (
          <div className="portal-section">
            <div className="portal-section-header">
              <h2 className="portal-section-title">Salary Information</h2>
              {employee && (
                <button className="btn-primary" onClick={() => { loadSalary(); setShowSlip(true); }}>
                  Print Salary Slip
                </button>
              )}
            </div>

            {!employee ? (
              <p className="muted">No employee record linked. Contact HR.</p>
            ) : (
              <>
                <div className="salary-summary-card">
                  <div className="salary-summary-label">Current Salary</div>
                  <div className="salary-summary-value">${employee.salary.toLocaleString()}</div>
                </div>

                {salaryHistory.length > 0 && (
                  <>
                    <div className="portal-subsection-title">Salary History</div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>Effective Date</th><th>Previous</th><th>New</th><th>Change</th><th>Reason</th></tr>
                        </thead>
                        <tbody>
                          {salaryHistory.map(entry => {
                            const diff = entry.newSalary - entry.oldSalary;
                            const pct = entry.oldSalary > 0 ? ((diff / entry.oldSalary) * 100).toFixed(1) : 0;
                            return (
                              <tr key={entry.id}>
                                <td>{new Date(entry.effectiveDate).toLocaleDateString()}</td>
                                <td>${entry.oldSalary.toLocaleString()}</td>
                                <td><strong>${entry.newSalary.toLocaleString()}</strong></td>
                                <td>
                                  <span className={`salary-change ${diff >= 0 ? 'positive' : 'negative'}`}>
                                    {diff >= 0 ? '+' : ''}{pct}%
                                  </span>
                                </td>
                                <td><span className="muted">{entry.reason ?? '—'}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {salaryHistory.length === 0 && (
                  <p className="muted" style={{ marginTop: '1rem' }}>No salary change history.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Leave Balance ── shown in leaves tab */}
        {tab === 'leaves' && leaveBalance.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0 1.5rem 1rem' }}>
            {leaveBalance.map(b => {
              const pct = b.entitlementDays > 0 ? (b.remainingDays / b.entitlementDays) * 100 : 0;
              const color = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
              return (
                <div key={b.leaveType} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 16px', minWidth: 120 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 3 }}>{b.leaveType}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{b.remainingDays}<span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>/{b.entitlementDays}d</span></div>
                  <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: 5 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Holidays Tab ── */}
        {tab === 'holidays' && (
          <div className="portal-section">
            <div className="portal-section-header">
              <h2 className="portal-section-title">Public Holidays {new Date().getFullYear()}</h2>
            </div>
            {holidays.length === 0 ? (
              <p className="muted">No holidays configured yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Holiday</th><th>Date</th><th>Day</th><th>Type</th></tr></thead>
                  <tbody>
                    {holidays.map((h, i) => {
                      const d = new Date(h.date + 'T00:00:00');
                      const isPast = d < new Date();
                      return (
                        <tr key={i} style={{ opacity: isPast ? 0.55 : 1 }}>
                          <td style={{ fontWeight: 500 }}>{h.name}</td>
                          <td>{d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</td>
                          <td className="muted">{d.toLocaleDateString(undefined, { weekday: 'long' })}</td>
                          <td>{h.isRecurring ? <span className="badge badge-active">Annual</span> : <span className="badge badge-inactive">One-time</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── My Reviews Tab ── */}
        {tab === 'reviews' && (
          <div className="portal-section">
            <div className="portal-section-header">
              <h2 className="portal-section-title">My Performance Reviews</h2>
            </div>
            {myReviews.length === 0 ? (
              <p className="muted">No performance reviews yet.</p>
            ) : myReviews.map(r => (
              <div key={r.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.cycle?.title ?? 'Review'}</div>
                  <span className={`badge badge-${r.status === 'Completed' ? 'active' : 'probation'}`}>{r.status}</span>
                </div>
                {r.overallRating && (
                  <div style={{ marginBottom: 6 }}>
                    {'★'.repeat(r.overallRating)}{'☆'.repeat(5 - r.overallRating)}
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 6 }}>{r.overallRating}/5</span>
                  </div>
                )}
                {r.managerComments && <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0' }}><strong style={{ color: '#cbd5e1' }}>Manager:</strong> {r.managerComments}</p>}
                {r.goals && <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0' }}><strong style={{ color: '#cbd5e1' }}>Goals:</strong> {r.goals}</p>}
                {r.selfAssessment && <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0' }}><strong style={{ color: '#cbd5e1' }}>Self-Assessment:</strong> {r.selfAssessment}</p>}
              </div>
            ))}
          </div>
        )}
        {tab === 'mood' && (
          <div className="portal-section">
            <Suspense fallback={<ViewLoader />}>
              <MoodPulse role="Employee" />
            </Suspense>
          </div>
        )}

        {tab === 'polls' && (
          <div className="portal-section">
            <Suspense fallback={<ViewLoader />}>
              <PollsView role="Employee" />
            </Suspense>
          </div>
        )}

        {tab === 'skills' && (
          <div className="portal-section">
            <h3 className="portal-section-title">My Skills &amp; Certifications</h3>
            <Suspense fallback={<ViewLoader />}>
              <SkillsPanel role="Employee" />
            </Suspense>
          </div>
        )}

        {tab === 'feedback' && (
          <div className="portal-section">
            <Suspense fallback={<ViewLoader />}>
              <FeedbackView role="Employee" />
            </Suspense>
          </div>
        )}

        {tab === 'leavecal' && (
          <div className="portal-section">
            <Suspense fallback={<ViewLoader />}>
              <LeaveCalendar />
            </Suspense>
          </div>
        )}

        {tab === 'orgchart' && (
          <div className="portal-section">
            <Suspense fallback={<ViewLoader />}>
              <OrgChart />
            </Suspense>
          </div>
        )}

        {tab === 'docs' && (
          <div className="portal-section">
            <Suspense fallback={<ViewLoader />}>
              <DocumentCenter role="Employee" />
            </Suspense>
          </div>
        )}
      </main>

      {/* ── Leave Request Modal ── */}
      {showLeaveForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Apply for Leave</h2>
            <form onSubmit={handleLeaveSubmit}>
              <div className="form-grid">
                <label>Leave Type
                  <select value={leaveForm.leaveType} onChange={e => setLeaveForm(f => ({ ...f, leaveType: e.target.value }))}>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label></label>
                <label>Start Date
                  <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))} required />
                </label>
                <label>End Date
                  <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))} required min={leaveForm.startDate} />
                </label>
                {leaveForm.startDate && leaveForm.endDate && (
                  <div className="form-full" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Duration: <strong style={{ color: '#60a5fa' }}>{calcDays(leaveForm.startDate, leaveForm.endDate)} day(s)</strong>
                  </div>
                )}
                <label className="form-full">Reason (optional)
                  <textarea value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Briefly describe the reason…" />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowLeaveForm(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <><Spinner /> Submitting…</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Salary Slip Modal ── */}
      {showSlip && employee && (
        <SalarySlip
          employee={employee}
          salaryHistory={salaryHistory}
          onClose={() => setShowSlip(false)}
        />
      )}
    </div>
  );
}
