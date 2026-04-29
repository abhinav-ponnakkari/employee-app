import { useState, useEffect, useCallback } from 'react';
import { getPayrolls, createPayroll, addPayrollItem, deletePayrollItem, finalizePayroll, deletePayroll } from '../api/payrollApi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthLabel(m, y) { return `${MONTH_NAMES[m - 1]} ${y}`; }

// ── Printable Payslip ────────────────────────────────────────────────────────
function PayslipPrint({ payroll, employee, onClose }) {
  const allowances = payroll.items?.filter(i => i.type === 'Allowance') ?? [];
  const deductions = payroll.items?.filter(i => i.type === 'Deduction') ?? [];
  const totalAllowances = allowances.reduce((s, i) => s + i.amount, 0);
  const totalDeductions = deductions.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="modal-backdrop">
      <div className="modal salary-slip-modal">
        <div className="salary-slip" id="payslip-print">
          <div className="slip-header">
            <div className="slip-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="slip-company">HR Manager</span>
            </div>
            <div className="slip-title-block">
              <div className="slip-title">Payslip</div>
              <div className="slip-period">{monthLabel(payroll.month, payroll.year)}</div>
            </div>
          </div>

          <div className="slip-employee-info">
            {employee && <>
              <div className="slip-row"><span>Name</span><span>{employee.firstName} {employee.lastName}</span></div>
              <div className="slip-row"><span>Department</span><span>{employee.department}</span></div>
              <div className="slip-row"><span>Position</span><span>{employee.position ?? '—'}</span></div>
            </>}
            <div className="slip-row"><span>Pay Period</span><span>{monthLabel(payroll.month, payroll.year)}</span></div>
            <div className="slip-row"><span>Status</span><span>{payroll.status}</span></div>
          </div>

          <div className="slip-section-title">Earnings</div>
          <div className="slip-earnings">
            <div className="slip-row"><span>Basic Salary</span><span>${payroll.baseSalary.toLocaleString()}</span></div>
            {allowances.map(a => (
              <div key={a.id} className="slip-row"><span>{a.label}</span><span>${a.amount.toLocaleString()}</span></div>
            ))}
            {totalAllowances > 0 && (
              <div className="slip-row" style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                <span>Total Allowances</span><span>+${totalAllowances.toLocaleString()}</span>
              </div>
            )}
          </div>

          {deductions.length > 0 && <>
            <div className="slip-section-title">Deductions</div>
            <div className="slip-earnings">
              {deductions.map(d => (
                <div key={d.id} className="slip-row"><span>{d.label}</span><span style={{ color: '#ef4444' }}>-${d.amount.toLocaleString()}</span></div>
              ))}
              <div className="slip-row" style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                <span>Total Deductions</span><span style={{ color: '#ef4444' }}>-${totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </>}

          <div className="slip-earnings" style={{ marginTop: '0.5rem' }}>
            <div className="slip-row slip-total"><span>Net Pay</span><span>${payroll.netPay.toLocaleString()}</span></div>
          </div>

          {payroll.notes && (
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.75rem' }}>Note: {payroll.notes}</div>
          )}

          <div className="slip-footer">
            <div>Generated {new Date().toLocaleDateString()}{payroll.createdBy ? ` by ${payroll.createdBy}` : ''}</div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>System-generated document</div>
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

// ── Payroll detail panel ─────────────────────────────────────────────────────
function PayrollDetail({ payroll: initial, employees, onClose, onUpdated }) {
  const { can } = useAuth();
  const [payroll, setPayroll] = useState(initial);
  const [newItem, setNewItem] = useState({ type: 'Allowance', label: '', amount: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showSlip, setShowSlip] = useState(false);
  const [error, setError] = useState('');

  const employee = employees.find(e => e.id === payroll.employeeId);
  const isDraft = payroll.status === 'Draft';

  const refresh = async () => {
    const res = await getPayrolls({ employeeId: payroll.employeeId });
    const updated = res.data.find(p => p.id === payroll.id);
    if (updated) { setPayroll(updated); onUpdated?.(); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setAddingItem(true);
    try {
      await addPayrollItem(payroll.id, { ...newItem, amount: parseFloat(newItem.amount) });
      setNewItem({ type: 'Allowance', label: '', amount: '' });
      await refresh();
    } catch (err) { setError(err.response?.data?.message ?? 'Failed to add item.'); }
    setAddingItem(false);
  };

  const handleDeleteItem = async (itemId) => {
    try { await deletePayrollItem(payroll.id, itemId); await refresh(); }
    catch { setError('Failed to remove item.'); }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this payroll? This cannot be undone.')) return;
    setFinalizing(true);
    try { await finalizePayroll(payroll.id); await refresh(); }
    catch { setError('Failed to finalize.'); }
    setFinalizing(false);
  };

  const allowances = payroll.items?.filter(i => i.type === 'Allowance') ?? [];
  const deductions = payroll.items?.filter(i => i.type === 'Deduction') ?? [];

  return (
    <>
      <div className="side-panel-backdrop" onClick={onClose} />
      <aside className="side-panel">
        <div className="side-panel-header">
          <button className="side-panel-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="detail-profile-mini">
          <div className="detail-name">{employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${payroll.employeeId}`}</div>
          <div className="detail-position">{monthLabel(payroll.month, payroll.year)}</div>
          <div className="detail-badge-row">
            <span className={`badge ${payroll.status === 'Finalized' ? 'badge-active' : 'badge-on-leave'}`}>{payroll.status}</span>
          </div>
        </div>

        {error && <div className="error-banner" style={{ margin: '0 1rem' }}>{error}<button onClick={() => setError('')}>✕</button></div>}

        <div className="side-panel-body">
          {/* Summary */}
          <div className="payroll-summary">
            <div className="payroll-summary-row"><span>Base Salary</span><span>${payroll.baseSalary.toLocaleString()}</span></div>
            {allowances.length > 0 && (
              <div className="payroll-summary-row positive"><span>Total Allowances</span><span>+${allowances.reduce((s,i) => s+i.amount,0).toLocaleString()}</span></div>
            )}
            {deductions.length > 0 && (
              <div className="payroll-summary-row negative"><span>Total Deductions</span><span>-${deductions.reduce((s,i) => s+i.amount,0).toLocaleString()}</span></div>
            )}
            <div className="payroll-summary-row net"><span>Net Pay</span><span>${payroll.netPay.toLocaleString()}</span></div>
          </div>

          {/* Line items */}
          {payroll.items?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {payroll.items.map(item => (
                <div key={item.id} className="payroll-item-row">
                  <span className={`badge ${item.type === 'Allowance' ? 'badge-active' : 'badge-rejected'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>{item.type}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>{item.label}</span>
                  <span style={{ fontSize: '0.85rem', color: item.type === 'Allowance' ? '#86efac' : '#fca5a5' }}>
                    {item.type === 'Allowance' ? '+' : '-'}${item.amount.toLocaleString()}
                  </span>
                  {isDraft && can('editPayroll') && (
                    <button className="note-delete" onClick={() => handleDeleteItem(item.id)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add item form */}
          {isDraft && can('editPayroll') && (
            <form className="inline-form" onSubmit={handleAddItem}>
              <div className="detail-section-title">Add Allowance / Deduction</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label style={{ flex: 1 }}>Type
                  <select value={newItem.type} onChange={e => setNewItem(f => ({ ...f, type: e.target.value }))}>
                    <option value="Allowance">Allowance</option>
                    <option value="Deduction">Deduction</option>
                  </select>
                </label>
                <label style={{ flex: 2 }}>Label
                  <input value={newItem.label} onChange={e => setNewItem(f => ({ ...f, label: e.target.value }))} required placeholder="e.g. HRA, Tax" />
                </label>
              </div>
              <label>Amount
                <input type="number" value={newItem.amount} onChange={e => setNewItem(f => ({ ...f, amount: e.target.value }))} required min="0" step="0.01" placeholder="0.00" />
              </label>
              <div className="inline-form-actions">
                <button type="submit" className="btn-primary btn-sm" disabled={addingItem}>
                  {addingItem ? <><Spinner /> Adding…</> : 'Add'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="side-panel-actions">
          <button className="btn-secondary" onClick={() => setShowSlip(true)}>View Payslip</button>
          {isDraft && can('editPayroll') && (
            <button className="btn-primary" onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? <><Spinner /> …</> : 'Finalize'}
            </button>
          )}
        </div>
      </aside>

      {showSlip && <PayslipPrint payroll={payroll} employee={employee} onClose={() => setShowSlip(false)} />}
    </>
  );
}

// ── Main Payroll View ────────────────────────────────────────────────────────
export default function PayrollView({ employees }) {
  const { can, user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ employeeId: '', notes: '' });
  const [generating, setGenerating] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getPayrolls({ month, year });
      setPayrolls(res.data);
    } catch { setError('Failed to load payroll.'); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleBulkGenerate = async () => {
    if (!window.confirm(`Generate payroll for ALL active employees for ${MONTH_NAMES[month - 1]} ${year}? Already-generated employees will be skipped.`)) return;
    setBulkGenerating(true);
    try {
      const res = await api.post('/payroll/bulk', { month, year, notes: null });
      alert(`Done! Created: ${res.data.created}, Skipped (already exists): ${res.data.skipped}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Bulk generation failed.');
    } finally { setBulkGenerating(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === parseInt(genForm.employeeId));
    if (!emp) return;
    setGenerating(true);
    try {
      const res = await createPayroll({ employeeId: emp.id, month, year, baseSalary: emp.salary, notes: genForm.notes || null });
      setShowGenerate(false);
      setGenForm({ employeeId: '', notes: '' });
      load();
      setSelected(res.data);
    } catch (err) { setError(err.response?.data?.message ?? 'Failed to generate payroll.'); }
    setGenerating(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft payroll?')) return;
    try { await deletePayroll(id); load(); if (selected?.id === id) setSelected(null); }
    catch { setError('Failed to delete.'); }
  };

  const generatedIds = new Set(payrolls.map(p => p.employeeId));
  const ungeneratedEmployees = employees.filter(e => !generatedIds.has(e.id));

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div>
      {error && <div className="error-banner">{error}<button onClick={() => setError('')}>✕</button></div>}

      <div className="content-panel">
        {/* Controls */}
        <div className="search-filter">
          <div className="search-filter-controls">
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="filter-result-count">{payrolls.length} record{payrolls.length !== 1 ? 's' : ''}</span>
          </div>
          {can('editPayroll') && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={handleBulkGenerate} disabled={bulkGenerating}>
                {bulkGenerating ? 'Generating…' : '⚡ Bulk Generate All'}
              </button>
              {ungeneratedEmployees.length > 0 && (
                <button className="btn-primary" onClick={() => { setShowGenerate(true); setGenForm({ employeeId: '', notes: '' }); }}>
                  + Generate Payroll
                </button>
              )}
            </div>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Base Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr><td colSpan={8} className="empty">No payroll records for {MONTH_NAMES[month - 1]} {year}.</td></tr>
              ) : payrolls.map(p => {
                const emp = employees.find(e => e.id === p.employeeId);
                const totalAllow = p.items?.filter(i => i.type === 'Allowance').reduce((s,i) => s+i.amount, 0) ?? 0;
                const totalDeduc = p.items?.filter(i => i.type === 'Deduction').reduce((s,i) => s+i.amount, 0) ?? 0;
                return (
                  <tr key={p.id} className={selected?.id === p.id ? 'row-selected' : ''} onClick={() => setSelected(p)}>
                    <td className="cell-name-text">{emp ? `${emp.firstName} ${emp.lastName}` : `#${p.employeeId}`}</td>
                    <td>{monthLabel(p.month, p.year)}</td>
                    <td>${p.baseSalary.toLocaleString()}</td>
                    <td>{totalAllow > 0 ? <span style={{ color: '#86efac' }}>+${totalAllow.toLocaleString()}</span> : <span className="muted">—</span>}</td>
                    <td>{totalDeduc > 0 ? <span style={{ color: '#fca5a5' }}>-${totalDeduc.toLocaleString()}</span> : <span className="muted">—</span>}</td>
                    <td><strong>${p.netPay.toLocaleString()}</strong></td>
                    <td><span className={`badge ${p.status === 'Finalized' ? 'badge-active' : 'badge-on-leave'}`}>{p.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="actions-inner">
                        {p.status === 'Draft' && can('editPayroll') && (
                          <button className="btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate modal */}
      {showGenerate && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440 }}>
            <h2>Generate Payroll — {MONTH_NAMES[month - 1]} {year}</h2>
            <form onSubmit={handleGenerate}>
              <div className="form-grid">
                <label className="form-full">Employee
                  <select value={genForm.employeeId} onChange={e => setGenForm(f => ({ ...f, employeeId: e.target.value }))} required>
                    <option value="">Select employee…</option>
                    {ungeneratedEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — ${e.salary.toLocaleString()}/mo</option>
                    ))}
                  </select>
                </label>
                <label className="form-full">Notes (optional)
                  <textarea value={genForm.notes} onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any remarks for this payroll period…" />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGenerate(false)} disabled={generating}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={generating}>
                  {generating ? <><Spinner /> Generating…</> : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <PayrollDetail
          payroll={selected}
          employees={employees}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
