import { createContext, useContext, useState } from 'react';
import { login as loginApi } from '../api/authApi';

// Actions each role can perform. Admin always gets everything.
const ROLE_PERMISSIONS = {
  HR: [
    'addEmployee', 'editEmployee',
    'viewSalary', 'addSalaryHistory', 'deleteSalaryHistory',
    'createLeave', 'approveLeave', 'deleteLeave',
    'addNote', 'deleteNote',
    'exportCSV',
    'manageCirculars',
  ],
  // Admin gets everything via the `user.role === 'Admin'` check above,
  // so manageUsers doesn't need to be listed here.
  Employee: [
    'viewOwnProfile',
    'createLeave',
    'viewOwnPunch', 'punchInOut',
    'viewCirculars',
    'viewOwnSalary', 'printSalarySlip',
  ],
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hr_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('hr_token'));

  const login = async (username, password) => {
    const res = await loginApi({ username, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('hr_token', t);
    localStorage.setItem('hr_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    setToken(null);
    setUser(null);
  };

  const can = (action) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return ROLE_PERMISSIONS[user.role]?.includes(action) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, can, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
