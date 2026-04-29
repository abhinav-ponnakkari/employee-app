import { useState, useEffect, useCallback } from 'react';
import { getCurrentEmployeeOfMonth, nominateEmployeeOfMonth, getEmployeeOfMonth, deleteEmployeeOfMonth } from '../api/funFeaturesApi';
import { getEmployees } from '../api/employeeApi';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const EMOJIS = ['🥇','⭐','🏆','🎉','🌟'];

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 8,
  }));
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: '-10px',
          width: p.size, height: p.size, borderRadius: '2px',
          background: p.color, animation: `confettiFall 3s ${p.delay}s ease-in infinite`,
          transform: `rotate(${Math.random() * 360}deg)`
        }} />
      ))}
    </div>
  );
}

export default function EmployeeOfMonthSpotlight({ role }) {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showNominate, setShowNominate] = useState(false);
  const [form, setForm] = useState({ employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), reason: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isHrAdmin = role === 'Admin' || role === 'HR';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cur, hist] = await Promise.all([getCurrentEmployeeOfMonth(), getEmployeeOfMonth()]);
      setCurrent(cur.data);
      setHistory(hist.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (isHrAdmin) getEmployees().then(r => setEmployees(r.data?.items ?? r.data ?? [])).catch(() => {});
  }, [isHrAdmin]);

  const handleNominate = async () => {
    if (!form.employeeId || !form.reason.trim()) { setError('Fill all fields'); return; }
    setSaving(true); setError('');
    try {
      await nominateEmployeeOfMonth({ ...form, employeeId: +form.employeeId, month: +form.month, year: +form.year });
      setShowNominate(false);
      load();
    } catch (e) {
      setError(e.response?.data || 'Already set for this period.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this nomination?')) return;
    await deleteEmployeeOfMonth(id);
    load();
  };

  if (loading) return <div style={{ color: '#aaa', padding: 32, textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <style>{`
        @keyframes confettiFall { 0%{top:-10px;opacity:1} 100%{top:110%;opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      `}</style>

      {current ? (
        <div style={{ position: 'relative', background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', borderRadius: 16, padding: 32, marginBottom: 24, overflow: 'hidden', border: '2px solid #FFD700' }}>
          <Confetti />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <div style={{ color: '#FFD700', fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Employee of the Month — {MONTHS[current.month - 1]} {current.year}
            </div>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD700,#FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 12px', animation: 'pulse 2s infinite', border: '3px solid #FFD700' }}>
              {current.employee?.name?.charAt(0) ?? '?'}
            </div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{current.employee?.name}</div>
            <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>{current.employee?.position} · {current.employee?.department}</div>
            <div style={{ color: '#ddd', fontSize: 14, marginTop: 12, fontStyle: 'italic', maxWidth: 400, margin: '12px auto 0' }}>"{current.reason}"</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>Nominated by {current.nominatedBy}</div>
            {isHrAdmin && (
              <button onClick={() => handleDelete(current.id)} style={{ marginTop: 16, padding: '6px 16px', background: 'transparent', border: '1px solid #555', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 24, border: '2px dashed #333' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏅</div>
          <div style={{ color: '#888' }}>No Employee of the Month set for {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</div>
          {isHrAdmin && (
            <button onClick={() => setShowNominate(true)} style={{ marginTop: 16, padding: '10px 24px', background: 'linear-gradient(135deg,#FFD700,#FFA500)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
              🏆 Nominate
            </button>
          )}
        </div>
      )}

      {isHrAdmin && !current && showNominate && (
        <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h4 style={{ color: '#FFD700', margin: '0 0 16px' }}>Nominate Employee of the Month</h4>
          {error && <div style={{ color: '#ff6b6b', marginBottom: 12, fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
              style={{ padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={form.month} onChange={e => setForm(f => ({ ...f, month: +e.target.value }))}
              style={{ padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))}
              style={{ padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }} />
          </div>
          <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="Why do they deserve this recognition?" rows={3}
            style={{ width: '100%', padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff', resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleNominate} disabled={saving}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#FFD700,#FFA500)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : '🏆 Nominate'}
            </button>
            <button onClick={() => setShowNominate(false)}
              style={{ padding: '10px 24px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isHrAdmin && history.length > 0 && (
        <div>
          <h4 style={{ color: '#aaa', marginBottom: 12 }}>Past Recipients</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
            {history.slice(0, 6).map((h, i) => (
              <div key={h.id} style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{EMOJIS[i % EMOJIS.length]}</div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginTop: 8 }}>{h.employee?.name}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{MONTHS[h.month - 1]} {h.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
