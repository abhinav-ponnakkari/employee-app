import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from './api/employeeApi';
import { getDepartments } from './api/departmentApi';
import { getUsers, createUser, resetPassword } from './api/usersApi';
import EmployeeForm from './components/EmployeeForm';
import EmployeeDetail from './components/EmployeeDetail';
import SearchFilter from './components/SearchFilter';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import { avatarColor, exportEmployeesToCSV } from './utils';
import './App.css';

const Dashboard     = lazy(() => import('./components/Dashboard'));
const EmployeePortal = lazy(() => import('./components/EmployeePortal'));
const LeaveView     = lazy(() => import('./components/LeaveView'));
const CircularsView = lazy(() => import('./components/CircularsView'));
const UsersView     = lazy(() => import('./components/UsersView'));
const PayrollView   = lazy(() => import('./components/PayrollView'));
const AuditView     = lazy(() => import('./components/AuditView'));

function ViewLoader() {
  return <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
}

const PAGE_SIZE = 10;

function Avatar({ emp }) {
  const initials = `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase();
  const color = avatarColor(emp.firstName + emp.lastName);
  if (emp.photoUrl) return <img className="avatar" src={emp.photoUrl} alt={initials} />;
  return <div className={`avatar avatar-${color}`}>{initials}</div>;
}

function StatusBadge({ status }) {
  const s = status ?? 'Active';
  return <span className={`badge badge-${s.toLowerCase().replace(' ', '-')}`}>{s}</span>;
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="sort-icon">↕</span>;
  return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function App() {
  const { isAuthenticated, user, logout, can } = useAuth();

  if (!isAuthenticated) return <LoginPage />;

  // Employee role gets a self-service portal, not the admin/HR view
  if (user.role === 'Employee') return <EmployeePortalLayout user={user} logout={logout} />;

  return <MainApp user={user} logout={logout} can={can} />;
}

function EmployeePortalLayout({ user, logout }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <div className="header-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <h1>HR Manager</h1>
              <span className="header-subtitle">Employee Portal</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-user">
            <span className="role-badge role-badge-employee">Employee</span>
            <span className="header-username">{user.displayName}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>
      <main className="app-main" style={{ padding: 0 }}>
        <Suspense fallback={<ViewLoader />}>
          <EmployeePortal />
        </Suspense>
      </main>
    </div>
  );
}

function MainApp({ user, logout, can }) {
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('firstName');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState('employees');
  const searchDebounce = useRef(null);

  const loadEmployees = useCallback(async (params) => {
    try {
      const res = await getEmployees(params);
      setEmployees(res.data.items);
      setTotalEmployees(res.data.total);
    } catch {
      setError('Failed to load employees. Is the backend running?');
    }
  }, []);

  const loadSupport = useCallback(async () => {
    try {
      const calls = [getDepartments()];
      if (can('manageUsers')) calls.push(getUsers());
      const [deptRes, usersRes] = await Promise.all(calls);
      setDepartments(deptRes.data);
      if (usersRes) setUsers(usersRes.data);
    } catch {
      setError('Failed to load data. Is the backend running?');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSupport(); }, [loadSupport]);

  useEffect(() => {
    loadEmployees({ search, department: filterDept, status: filterStatus, sortBy: sortField, sortDir, page, pageSize: PAGE_SIZE });
  }, [search, filterDept, filterStatus, sortField, sortDir, page, loadEmployees]);

  const load = useCallback(() => {
    loadEmployees({ search, department: filterDept, status: filterStatus, sortBy: sortField, sortDir, page, pageSize: PAGE_SIZE });
  }, [search, filterDept, filterStatus, sortField, sortDir, page, loadEmployees]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (empData, loginData) => {
    try {
      let savedId = empData.id;
      if (empData.id) {
        await updateEmployee(empData.id, empData);
      } else {
        const res = await createEmployee(empData);
        savedId = res.data.id;
      }

      if (loginData?.password) {
        if (loginData.userId) {
          await resetPassword(loginData.userId, loginData.password);
        } else if (loginData.username) {
          await createUser({
            username: loginData.username,
            password: loginData.password,
            role: 'Employee',
            displayName: `${empData.firstName} ${empData.lastName}`,
            employeeId: savedId,
          });
        }
      }

      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save employee.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await deleteEmployee(id);
      setSelected(null);
      load();
    } catch {
      setError('Failed to delete employee.');
    }
  };

  const handleSort = (field) => {
    setSortField(prev => {
      if (prev === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else setSortDir('asc');
      return field;
    });
    setPage(1);
  };

  const handleSearch = (val) => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const totalPages = Math.max(1, Math.ceil(totalEmployees / PAGE_SIZE));
  const paginated = employees;

  const openEdit = (emp) => { setEditing(emp); setShowForm(true); };

  const pageNums = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  }, [totalPages, page]);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <div className="header-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <h1>HR Manager</h1>
              <span className="header-subtitle">Employee Management System</span>
            </div>
          </div>
          <nav className="header-nav">
            <button className={`nav-tab ${activeView === 'employees' ? 'active' : ''}`} onClick={() => setActiveView('employees')}>
              Employees
            </button>
            <button className={`nav-tab ${activeView === 'leave' ? 'active' : ''}`} onClick={() => setActiveView('leave')}>
              Leave Requests
            </button>
            <button className={`nav-tab ${activeView === 'circulars' ? 'active' : ''}`} onClick={() => setActiveView('circulars')}>
              Circulars
            </button>
            {(user.role === 'Admin' || user.role === 'HR') && (
              <button className={`nav-tab ${activeView === 'payroll' ? 'active' : ''}`} onClick={() => setActiveView('payroll')}>
                Payroll
              </button>
            )}
            {user.role === 'Admin' && (
              <button className={`nav-tab ${activeView === 'users' ? 'active' : ''}`} onClick={() => setActiveView('users')}>
                User Accounts
              </button>
            )}
            {user.role === 'Admin' && (
              <button className={`nav-tab ${activeView === 'audit' ? 'active' : ''}`} onClick={() => setActiveView('audit')}>
                Audit Log
              </button>
            )}
          </nav>
        </div>

        <div className="header-actions">
          {activeView === 'employees' && (
            <>
              {can('exportCSV') && (
                <button className="btn-secondary" onClick={() => exportEmployeesToCSV(employees)}>Export CSV</button>
              )}
              {can('addEmployee') && (
                <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ Add Employee</button>
              )}
            </>
          )}
          <div className="header-user">
            <span className={`role-badge role-badge-${user.role.toLowerCase()}`}>{user.role}</span>
            <span className="header-username">{user.displayName}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            {error}<button onClick={() => setError('')}>&#x2715;</button>
          </div>
        )}

        {activeView === 'employees' && (
          <>
            <Suspense fallback={<ViewLoader />}>
              <Dashboard employees={employees} departments={departments} />
            </Suspense>
            <div className="content-panel">
              <SearchFilter
                search={search} onSearch={v => { handleSearch(v); }}
                filterDept={filterDept} onFilterDept={v => { setFilterDept(v); setPage(1); }}
                filterStatus={filterStatus} onFilterStatus={v => { setFilterStatus(v); setPage(1); }}
                departments={departments}
                resultCount={totalEmployees}
                totalCount={totalEmployees}
                onClear={() => { setSearch(''); setFilterDept(''); setFilterStatus(''); setPage(1); }}
              />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort('firstName')}>Name <SortIcon field="firstName" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('position')}>Position <SortIcon field="position" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('department')}>Department <SortIcon field="department" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('salary')}>Salary <SortIcon field="salary" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('status')}>Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('hireDate')}>Hire Date <SortIcon field="hireDate" sortField={sortField} sortDir={sortDir} /></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={7} className="empty">No employees found.</td></tr>
                    ) : paginated.map(emp => (
                      <tr key={emp.id} className={selected?.id === emp.id ? 'row-selected' : ''} onClick={() => setSelected(emp)}>
                        <td className="cell-name">
                          <Avatar emp={emp} />
                          <div>
                            <div className="cell-name-text">{emp.firstName} {emp.lastName}</div>
                            {emp.email && <div className="cell-name-sub">{emp.email}</div>}
                          </div>
                        </td>
                        <td>{emp.position ?? <span className="muted">—</span>}</td>
                        <td>{emp.department}</td>
                        <td>${emp.salary.toLocaleString()}</td>
                        <td><StatusBadge status={emp.status} /></td>
                        <td>{new Date(emp.hireDate).toLocaleDateString()}</td>
                        <td className="actions" onClick={e => e.stopPropagation()}>
                          <div className="actions-inner">
                            {can('editEmployee') && <button className="btn-edit" onClick={() => openEdit(emp)}>Edit</button>}
                            {can('deleteEmployee') && <button className="btn-delete" onClick={() => handleDelete(emp.id)}>Delete</button>}
                            {!can('editEmployee') && !can('deleteEmployee') && <span className="muted" style={{ fontSize: '0.78rem' }}>View only</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <span className="page-info">
                    {totalEmployees === 0 ? '0 results' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalEmployees)} of ${totalEmployees}`}
                  </span>
                  <div className="page-controls">
                    <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                    {pageNums.map(n => <button key={n} onClick={() => setPage(n)} className={page === n ? 'page-active' : ''}>{n}</button>)}
                    <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Suspense fallback={<ViewLoader />}>
          {activeView === 'leave' && <LeaveView employees={employees} />}
          {activeView === 'circulars' && <CircularsView />}
          {activeView === 'payroll' && <PayrollView employees={employees} />}
          {activeView === 'users' && <UsersView />}
          {activeView === 'audit' && <AuditView />}
        </Suspense>
      </main>

      {selected && activeView === 'employees' && (
        <EmployeeDetail
          employee={selected}
          onEdit={() => openEdit(selected)}
          onDelete={() => handleDelete(selected.id)}
          onClose={() => setSelected(null)}
          onRefresh={load}
        />
      )}

      {showForm && can('addEmployee') && (
        <EmployeeForm
          employee={editing}
          departments={departments}
          linkedUser={editing ? users.find(u => u.employeeId === editing.id) ?? null : null}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
