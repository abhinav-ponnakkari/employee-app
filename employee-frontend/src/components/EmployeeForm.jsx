import { useState, useEffect } from 'react';

const empty = { firstName: '', lastName: '', email: '', department: '', salary: '', hireDate: '' };

export default function EmployeeForm({ employee, onSave, onCancel }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (employee) {
      setForm({
        ...employee,
        salary: employee.salary.toString(),
        hireDate: employee.hireDate.split('T')[0],
      });
    } else {
      setForm(empty);
    }
  }, [employee]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: employee?.id ?? 0, salary: parseFloat(form.salary) });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{employee ? 'Edit Employee' : 'Add Employee'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>First Name
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </label>
            <label>Last Name
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </label>
            <label>Email
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>Department
              <input name="department" value={form.department} onChange={handleChange} required />
            </label>
            <label>Salary
              <input type="number" name="salary" value={form.salary} onChange={handleChange} min="0" step="0.01" required />
            </label>
            <label>Hire Date
              <input type="date" name="hireDate" value={form.hireDate} onChange={handleChange} required />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
