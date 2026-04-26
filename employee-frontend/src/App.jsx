import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from './api/employeeApi';
import EmployeeForm from './components/EmployeeForm';
import './App.css';

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch {
      setError('Failed to load employees. Is the backend running?');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await updateEmployee(data.id, data);
      } else {
        await createEmployee(data);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch {
      setError('Failed to save employee.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await deleteEmployee(id);
      load();
    } catch {
      setError('Failed to delete employee.');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Employee Manager</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Employee
        </button>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Hire Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr><td colSpan={6} className="empty">No employees found.</td></tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.firstName} {emp.lastName}</td>
                <td>{emp.email}</td>
                <td>{emp.department}</td>
                <td>${emp.salary.toLocaleString()}</td>
                <td>{new Date(emp.hireDate).toLocaleDateString()}</td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => { setEditing(emp); setShowForm(true); }}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(emp.id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showForm && (
        <EmployeeForm
          employee={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
