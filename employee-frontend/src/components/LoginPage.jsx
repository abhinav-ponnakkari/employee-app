import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

const DEMO_CREDENTIALS = [
  { username: 'admin',  password: 'admin123',  role: 'Admin'  },
  { username: 'hr',     password: 'hr123',     role: 'HR'     },
  { username: 'viewer', password: 'viewer123', role: 'Viewer' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid username or password');
    }
    setLoading(false);
  };

  const fillDemo = (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        <h1 className="login-title">HR Manager</h1>
        <p className="login-subtitle">Sign in to your account</p>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              placeholder="Enter username"
            />
          </label>
          <label>
            Password
            <div className="password-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter password"
              />
              <button
                type="button"
                className="show-pass-btn"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
            {loading ? <><Spinner /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <div className="login-hint-title">Demo credentials</div>
          <div className="login-hint-list">
            {DEMO_CREDENTIALS.map(c => (
              <button key={c.username} className="login-hint-row" onClick={() => fillDemo(c)} type="button">
                <span className={`role-badge role-badge-${c.role.toLowerCase()}`}>{c.role}</span>
                <code>{c.username}</code>
                <span className="login-hint-sep">/</span>
                <code>{c.password}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
