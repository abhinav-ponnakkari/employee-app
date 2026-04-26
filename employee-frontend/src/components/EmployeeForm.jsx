import { useState, useEffect } from 'react';

const empty = {
  firstName: '', lastName: '', email: '', phone: '',
  department: '', position: '', salary: '', hireDate: '',
  status: 'Active', gender: '', dateOfBirth: '', photoUrl: '',
};

export default function EmployeeForm({ employee, departments, onSave, onCancel }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (employee) {
      setForm({
        ...empty,
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
      setForm(empty);
    }
  }, [employee]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: employee?.id ?? 0,
      salary: parseFloat(form.salary),
      dateOfBirth: form.dateOfBirth || null,
      phone: form.phone || null,
      position: form.position || null,
      gender: form.gender || null,
      photoUrl: form.photoUrl || null,
    });
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
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary">Save Employee</button>
          </div>
        </form>
      </div>
    </div>
  );
}
