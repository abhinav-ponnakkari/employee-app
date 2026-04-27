import { useState, useEffect } from 'react';

const emptyEmp = {
  firstName: '', lastName: '', email: '', phone: '',
  department: '', position: '', salary: '', hireDate: '',
  status: 'Active', gender: '', dateOfBirth: '', photoUrl: '',
};

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

// onSave(empData, loginData)
// loginData = { username, password, userId } — all optional
export default function EmployeeForm({ employee, departments, linkedUser, onSave, onCancel }) {
  const [form, setForm] = useState(emptyEmp);
  const [login, setLogin] = useState({ username: '', password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (employee) {
      setForm({
        ...emptyEmp,
        ...employee,
        salary: employee.salary.toString(),
        hireDate: employee.hireDate.split('T')[0],
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
        phone: employee.phone ?? '',
        position: employee.position ?? '',
        status: employee.status ?? 'Active',
        gender: employee.gender ?? '',
        photoUrl: employee.photoUrl ?? '',
      });
    } else {
      setForm(emptyEmp);
    }
    setLogin({ username: '', password: '', confirm: '' });
    setLoginError('');
  }, [employee]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setL = (e) => { setLogin({ ...login, [e.target.name]: e.target.value }); setLoginError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    // Validate login fields if any are filled
    const wantsLogin = linkedUser ? !!login.password : !!(login.username || login.password);
    if (wantsLogin) {
      if (!linkedUser && !login.username) { setLoginError('Username is required to set login access.'); return; }
      if (!login.password) { setLoginError('Password is required.'); return; }
      if (login.password.length < 6) { setLoginError('Password must be at least 6 characters.'); return; }
      if (login.password !== login.confirm) { setLoginError('Passwords do not match.'); return; }
    }

    setSaving(true);
    const empData = {
      ...form,
      id: employee?.id ?? 0,
      salary: parseFloat(form.salary),
      dateOfBirth: form.dateOfBirth || null,
      phone: form.phone || null,
      position: form.position || null,
      gender: form.gender || null,
      photoUrl: form.photoUrl || null,
    };
    const loginData = wantsLogin
      ? { username: linkedUser ? linkedUser.username : login.username, password: login.password, userId: linkedUser?.id ?? null }
      : null;

    await onSave(empData, loginData);
    setSaving(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{employee ? 'Edit Employee' : 'Add Employee'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-section-title">Basic Information</div>
            <label>First Name
              <input name="firstName" value={form.firstName} onChange={set} required />
            </label>
            <label>Last Name
              <input name="lastName" value={form.lastName} onChange={set} required />
            </label>
            <label>Email
              <input type="email" name="email" value={form.email} onChange={set} required />
            </label>
            <label>Phone
              <input type="tel" name="phone" value={form.phone} onChange={set} placeholder="Optional" />
            </label>

            <div className="form-section-title">Employment Details</div>
            <label>Position / Job Title
              <input name="position" value={form.position} onChange={set} placeholder="e.g. Senior Engineer" />
            </label>
            <label>Department
              {departments.length > 0 ? (
                <select name="department" value={form.department} onChange={set} required>
                  <option value="">Select department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              ) : (
                <input name="department" value={form.department} onChange={set} required placeholder="Enter department name" />
              )}
            </label>
            <label>Salary
              <input type="number" name="salary" value={form.salary} onChange={set} min="0" step="0.01" required />
            </label>
            <label>Hire Date
              <input type="date" name="hireDate" value={form.hireDate} onChange={set} required />
            </label>
            <label>Employment Status
              <select name="status" value={form.status} onChange={set}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </label>

            <div className="form-section-title">Personal Information</div>
            <label>Gender
              <select name="gender" value={form.gender} onChange={set}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </label>
            <label>Date of Birth
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={set} />
            </label>
            <label className="form-full">Photo URL
              <input name="photoUrl" value={form.photoUrl} onChange={set} placeholder="https://... (optional)" />
            </label>

            {/* ── Login Access ── */}
            <div className="form-section-title form-full">Login Access</div>

            {linkedUser ? (
              <>
                <div className="form-full login-status-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Active login: <strong>{linkedUser.username}</strong></span>
                </div>
                <label>New Password <span className="form-hint">(leave blank to keep current)</span>
                  <input type="password" name="password" value={login.password} onChange={setL} autoComplete="new-password" placeholder="Enter new password" />
                </label>
                <label>Confirm Password
                  <input type="password" name="confirm" value={login.confirm} onChange={setL} autoComplete="new-password" placeholder="Repeat new password" />
                </label>
              </>
            ) : (
              <>
                <div className="form-full" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Assign login credentials so this employee can access the portal. Leave blank to skip.
                </div>
                <label>Username
                  <input name="username" value={login.username} onChange={setL} autoComplete="off" placeholder="e.g. john.doe" />
                </label>
                <label>Password
                  <input type="password" name="password" value={login.password} onChange={setL} autoComplete="new-password" placeholder="Min. 6 characters" />
                </label>
                <label className="form-full">Confirm Password
                  <input type="password" name="confirm" value={login.confirm} onChange={setL} autoComplete="new-password" placeholder="Repeat password" />
                </label>
              </>
            )}

            {loginError && (
              <div className="form-full login-field-error">{loginError}</div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><Spinner /> Saving…</> : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
