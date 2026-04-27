const AVATAR_COLORS = ['blue', 'green', 'purple', 'orange', 'teal'];

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function calcDays(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

export function exportEmployeesToCSV(employees) {
  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Position', 'Salary', 'Status', 'Hire Date', 'Gender', 'Date of Birth'];
  const rows = employees.map(e => [
    e.id, e.firstName, e.lastName, e.email, e.phone ?? '',
    e.department, e.position ?? '', e.salary,
    e.status ?? 'Active', e.hireDate, e.gender ?? '', e.dateOfBirth ?? '',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
