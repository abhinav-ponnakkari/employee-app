import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getMyMood, submitMoodCheckin, getTeamPulse, getMoodDistribution } from '../api/funFeaturesApi';

const MOODS = [
  { rating: 1, emoji: '😞', label: 'Rough', color: '#ff6b6b' },
  { rating: 2, emoji: '😕', label: 'Low', color: '#ffa500' },
  { rating: 3, emoji: '😐', label: 'Okay', color: '#ffd700' },
  { rating: 4, emoji: '😊', label: 'Good', color: '#4ecdc4' },
  { rating: 5, emoji: '😄', label: 'Great', color: '#2ecc71' },
];

export default function MoodPulse({ role }) {
  const isHrAdmin = role === 'Admin' || role === 'HR';
  const [myMood, setMyMood] = useState([]);
  const [teamPulse, setTeamPulse] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mine] = await Promise.all([getMyMood()]);
      setMyMood(mine.data);
      if (mine.data.length > 0) {
        const latest = mine.data[0];
        const thisMonday = getMonday(new Date());
        const latestWeek = new Date(latest.week);
        if (latestWeek >= thisMonday) setDone(true);
      }
    } catch {}
    if (isHrAdmin) {
      try {
        const [pulse, dist] = await Promise.all([getTeamPulse(8), getMoodDistribution()]);
        setTeamPulse(pulse.data.map(d => ({ ...d, week: d.week })));
        setDistribution(dist.data);
      } catch {}
    }
  }, [isHrAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleCheckin = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await submitMoodCheckin({ rating: selected, note: note.trim() || null });
      setDone(true);
      load();
    } catch {}
    setSaving(false);
  };

  return (
    <div>
      {!done ? (
        <div style={{ background: '#1e1e2e', borderRadius: 16, padding: 28, marginBottom: 24, border: '1px solid #333' }}>
          <h4 style={{ color: '#fff', margin: '0 0 8px' }}>How are you feeling this week? 💭</h4>
          <p style={{ color: '#888', fontSize: 13, margin: '0 0 20px' }}>Your check-in is anonymous to your team.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
            {MOODS.map(m => (
              <button key={m.rating} onClick={() => setSelected(m.rating)}
                style={{
                  background: selected === m.rating ? m.color + '33' : '#2a2a3e',
                  border: `2px solid ${selected === m.rating ? m.color : '#444'}`,
                  borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
                  transition: 'all 0.2s', textAlign: 'center'
                }}>
                <div style={{ fontSize: 32 }}>{m.emoji}</div>
                <div style={{ color: selected === m.rating ? m.color : '#888', fontSize: 12, marginTop: 4, fontWeight: 600 }}>{m.label}</div>
              </button>
            ))}
          </div>
          {selected && (
            <>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Optional: share a thought..." rows={2}
                style={{ width: '100%', padding: '10px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
              <button onClick={handleCheckin} disabled={saving}
                style={{ padding: '10px 28px', background: 'linear-gradient(135deg,#4ecdc4,#2ecc71)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving...' : '✓ Check In'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ background: '#1e1e2e', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #2ecc71', textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div style={{ color: '#2ecc71', fontWeight: 700, marginTop: 8 }}>Checked in for this week!</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Come back next Monday for your next check-in.</div>
        </div>
      )}

      {myMood.length > 0 && (
        <div style={{ background: '#1e1e2e', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #333' }}>
          <h4 style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>My Mood History</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {myMood.slice(0, 8).map(m => {
              const mood = MOODS.find(x => x.rating === m.rating);
              return (
                <div key={m.id} style={{ background: '#2a2a3e', borderRadius: 8, padding: '8px 14px', border: `1px solid ${mood?.color}44` }}>
                  <span style={{ fontSize: 18 }}>{mood?.emoji}</span>
                  <span style={{ color: '#888', fontSize: 11, marginLeft: 6 }}>{m.week}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isHrAdmin && teamPulse.length > 0 && (
        <div style={{ background: '#1e1e2e', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #333' }}>
          <h4 style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>Team Mood Pulse (8 weeks)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={teamPulse}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="week" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #444', borderRadius: 8 }} labelStyle={{ color: '#aaa' }} itemStyle={{ color: '#4ecdc4' }} />
              <Line type="monotone" dataKey="avgRating" stroke="#4ecdc4" strokeWidth={2} dot={{ fill: '#4ecdc4', r: 4 }} name="Avg Mood" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {isHrAdmin && distribution.length > 0 && (
        <div style={{ background: '#1e1e2e', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
          <h4 style={{ color: '#aaa', margin: '0 0 16px', fontSize: 14 }}>This Week's Distribution</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
            {MOODS.map(m => {
              const d = distribution.find(x => x.rating === m.rating);
              const count = d?.count ?? 0;
              const maxCount = Math.max(...distribution.map(x => x.count), 1);
              return (
                <div key={m.rating} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ color: '#888', fontSize: 11 }}>{count}</div>
                  <div style={{ width: '100%', height: `${(count / maxCount) * 60 + 4}px`, background: m.color + 'aa', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                  <div style={{ fontSize: 16 }}>{m.emoji}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
