import { useState, useEffect } from 'react';
import { getAiInsights } from '../api/funFeaturesApi';

export default function AiInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await getAiInsights();
      setData(r.data);
    } catch (e) {
      setError(e.response?.status === 403 ? 'Admin/HR access required.' : 'Failed to load insights.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const STAT_ITEMS = data ? [
    { label: 'Active Employees', value: data.stats.totalEmployees, icon: '👥', color: '#74b9ff' },
    { label: 'Pending Leaves', value: data.stats.pendingLeaves, icon: '⏳', color: '#ffd700' },
    { label: 'Leaves This Month', value: data.stats.approvedLeavesThisMonth, icon: '✅', color: '#2ecc71' },
    { label: 'Avg Mood', value: `${data.stats.avgMood}/5`, icon: '😊', color: '#4ecdc4' },
    { label: 'Unread Feedback', value: data.stats.openFeedback, icon: '💬', color: '#a29bfe' },
    { label: 'Expiring Certs', value: data.stats.expiringCerts, icon: '🏅', color: '#ff6b6b' },
  ] : [];

  const parseInsights = (text) => {
    if (!text) return [];
    return text.split(/\n+/).filter(l => l.trim()).map(l => l.replace(/^[\d\.\-\*\s]+/, '').trim()).filter(Boolean);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ color: '#fff', margin: 0 }}>AI Insights 🤖</h3>
        <button onClick={load} disabled={loading}
          style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: 'spin 2s linear infinite', display: 'inline-block' }}>🤖</div>
          <div>Analysing your HR data...</div>
        </div>
      ) : error ? (
        <div style={{ background: '#ff6b6b11', border: '1px solid #ff6b6b44', borderRadius: 10, padding: 20, color: '#ff6b6b' }}>{error}</div>
      ) : data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
            {STAT_ITEMS.map(s => (
              <div key={s.label} style={{ background: '#1e1e2e', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>{s.icon}</div>
                <div style={{ color: s.color, fontSize: 24, fontWeight: 700, marginTop: 6 }}>{s.value}</div>
                <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid #a29bfe44', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <div>
                <div style={{ color: '#a29bfe', fontWeight: 700, fontSize: 15 }}>AI-Generated Insights</div>
                <div style={{ color: '#666', fontSize: 12 }}>Powered by Llama 3.1 via Groq</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {parseInsights(data.insights).map((insight, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#ffffff08', borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#a29bfe33', color: '#a29bfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <p style={{ color: '#ddd', margin: 0, fontSize: 14, lineHeight: 1.6 }}>{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
