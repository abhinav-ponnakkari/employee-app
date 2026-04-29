import { useState, useEffect } from 'react';
import { getAttendanceReport, getTodayAttendance, getEmployeeAttendance } from '../api/attendanceApi';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AttendanceView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState('report'); // report | today

  useEffect(() => {
    setLoading(true);
    Promise.all([getAttendanceReport(month, year), getTodayAttendance()])
      .then(([r, t]) => { setReport(r.data); setToday(t.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  const openDetail = async (emp) => {
    setSelected(emp);
    const res = await getEmployeeAttendance(emp.id, month, year).catch(() => null);
    if (res) setDetail(res.data);
  };

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="content-panel">
      <div className="panel-header">
        <h2 className="panel-title">Attendance</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`nav-tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Monthly Report</button>
          <button className={`nav-tab ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>
            Today {today.length > 0 && <span className="badge badge-active" style={{ marginLeft: 6 }}>{today.filter(t => t.isIn).length} in</span>}
          </button>
        </div>
      </div>

      {tab === 'report' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <select className="filter-select" value={month} onChange={e => setMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="filter-select" value={year} onChange={e => setYear(+e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {report && <span className="muted" style={{ alignSelf: 'center', fontSize: '0.85rem' }}>{report.workingDays} working days</span>}
          </div>

          {loading ? <div className="empty" style={{ padding: '2rem' }}>Loading…</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'center' }}>Present</th>
                    <th style={{ textAlign: 'center' }}>Absent</th>
                    <th style={{ textAlign: 'center' }}>Late</th>
                    <th style={{ textAlign: 'center' }}>Overtime hrs</th>
                    <th style={{ textAlign: 'center' }}>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.employees ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="empty">No data for this period.</td></tr>
                  ) : (report?.employees ?? []).map(emp => (
                    <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(emp)}>
                      <td className="cell-name">
                        <div>
                          <div className="cell-name-text">{emp.firstName} {emp.lastName}</div>
                          <div className="cell-name-sub">{emp.position ?? ''}</div>
                        </div>
                      </td>
                      <td>{emp.department}</td>
                      <td style={{ textAlign: 'center' }}>{emp.presentDays}</td>
                      <td style={{ textAlign: 'center', color: emp.absentDays > 0 ? '#ef4444' : '#9ca3af' }}>{emp.absentDays}</td>
                      <td style={{ textAlign: 'center', color: emp.lateDays > 0 ? '#f59e0b' : '#9ca3af' }}>{emp.lateDays}</td>
                      <td style={{ textAlign: 'center', color: emp.overtimeHours > 0 ? '#10b981' : '#9ca3af' }}>{emp.overtimeHours}h</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: emp.attendancePct >= 90 ? '#10b981' : emp.attendancePct >= 75 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                          {emp.attendancePct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'today' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {today.length === 0 ? (
                <tr><td colSpan={5} className="empty">No one has punched in today.</td></tr>
              ) : today.map(t => (
                <tr key={t.id}>
                  <td>{t.firstName} {t.lastName}</td>
                  <td>{t.department}</td>
                  <td>{new Date(t.punchIn).toLocaleTimeString()}</td>
                  <td>{t.punchOut ? new Date(t.punchOut).toLocaleTimeString() : <span className="muted">—</span>}</td>
                  <td>
                    {t.isIn
                      ? <span className="badge badge-active">In Office</span>
                      : <span className="badge badge-inactive">Left</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee detail drawer */}
      {selected && detail && (
        <div className="detail-overlay" onClick={() => { setSelected(null); setDetail(null); }}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <div className="detail-name">{selected.firstName} {selected.lastName}</div>
                <div className="detail-sub">{MONTHS[month - 1]} {year} — Day-by-Day</div>
              </div>
              <button className="detail-close" onClick={() => { setSelected(null); setDetail(null); }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 1.5rem 1.5rem' }}>
              {detail.records.length === 0 ? (
                <p className="muted">No punch records this month.</p>
              ) : (
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>OT</th><th>Late?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.records.map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.punchIn).toLocaleDateString()}</td>
                        <td>{new Date(r.punchIn).toLocaleTimeString()}</td>
                        <td>{r.punchOut ? new Date(r.punchOut).toLocaleTimeString() : '—'}</td>
                        <td>{r.hoursWorked ?? '—'}</td>
                        <td style={{ color: r.overtime > 0 ? '#10b981' : '#9ca3af' }}>{r.overtime > 0 ? `${r.overtime}h` : '—'}</td>
                        <td>{r.isLate ? <span style={{ color: '#f59e0b' }}>Yes</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
