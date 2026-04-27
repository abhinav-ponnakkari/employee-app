export default function Dashboard({ employees, departments }) {
  const total = employees.length;
  const active = employees.filter(e => (e.status ?? 'Active') === 'Active').length;
  const avgSalary = total > 0
    ? employees.reduce((sum, e) => sum + e.salary, 0) / total
    : 0;
  const newestHire = employees.reduce((latest, e) => {
    if (!latest) return e;
    return new Date(e.hireDate) > new Date(latest.hireDate) ? e : latest;
  }, null);

  return (
    <div className="dashboard">
      <div className="stat-card">
        <div className="stat-icon blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Employees</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-value">{active}</div>
          <div className="stat-label">Active</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-value">{departments.length}</div>
          <div className="stat-label">Departments</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon orange">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-value">
            ${avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="stat-label">Avg Salary</div>
        </div>
      </div>

      {newestHire && (
        <div className="stat-card stat-card-wide">
          <div className="stat-icon teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ fontSize: '1.05rem' }}>
              {newestHire.firstName} {newestHire.lastName}
            </div>
            <div className="stat-label">
              Latest Hire &mdash; {new Date(newestHire.hireDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
