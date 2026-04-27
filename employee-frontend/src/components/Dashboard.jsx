import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getLeaveRequests } from '../api/leaveApi';

const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
const PIE_COLORS = { Approved: '#10b981', Pending: '#f59e0b', Rejected: '#ef4444' };

function ChartCard({ title, children }) {
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ employees, departments }) {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    getLeaveRequests().then(r => setLeaves(r.data)).catch(() => {});
  }, []);

  const total = employees.length;
  const active = employees.filter(e => (e.status ?? 'Active') === 'Active').length;
  const avgSalary = total > 0 ? employees.reduce((s, e) => s + e.salary, 0) / total : 0;
  const newestHire = employees.reduce((latest, e) =>
    (!latest || new Date(e.hireDate) > new Date(latest.hireDate)) ? e : latest, null);

  // Chart 1 — headcount by department
  const deptData = departments.map(d => ({
    dept: d.name.length > 10 ? d.name.slice(0, 9) + '…' : d.name,
    fullName: d.name,
    count: employees.filter(e => e.department === d.name).length,
  })).sort((a, b) => b.count - a.count);

  // Chart 2 — leave requests per month (last 6 months)
  const monthLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthLabels.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('default', { month: 'short' }) });
  }
  const leaveByMonth = monthLabels.map(({ key, label }) => {
    const [year, month] = key.split('-').map(Number);
    return {
      month: label,
      count: leaves.filter(l => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    };
  });

  // Chart 3 — leave status pie
  const statusCount = leaves.reduce((acc, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc; }, {});
  const pieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  return (
    <>
      {/* Stat cards */}
      <div className="dashboard">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
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
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">${avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="stat-label">Avg Salary</div>
          </div>
        </div>
        {newestHire && (
          <div className="stat-card stat-card-wide">
            <div className="stat-icon teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ fontSize: '1.05rem' }}>{newestHire.firstName} {newestHire.lastName}</div>
              <div className="stat-label">Latest Hire &mdash; {new Date(newestHire.hireDate).toLocaleDateString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Charts row */}
      {(deptData.length > 0 || leaves.length > 0) && (
        <div className="charts-row">
          {deptData.length > 0 && (
            <ChartCard title="Headcount by Department">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="dept" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
                    {deptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {leaves.length > 0 && (
            <ChartCard title="Leave Requests — Last 6 Months">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={leaveByMonth} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" name="Requests" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {pieData.length > 0 && (
            <ChartCard title="Leave Status Breakdown">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
    </>
  );
}
