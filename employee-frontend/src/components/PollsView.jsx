import { useState, useEffect, useCallback } from 'react';
import { getPolls, createPoll, votePoll, closePoll, deletePoll } from '../api/funFeaturesApi';

export default function PollsView({ role }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ question: '', options: ['', ''], expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [voting, setVoting] = useState({});

  const isHrAdmin = role === 'Admin' || role === 'HR';

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getPolls(); setPolls(r.data); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (pollId, optionIndex) => {
    setVoting(v => ({ ...v, [pollId]: true }));
    try { await votePoll(pollId, optionIndex); load(); } catch {}
    setVoting(v => ({ ...v, [pollId]: false }));
  };

  const handleCreate = async () => {
    const opts = form.options.filter(o => o.trim());
    if (!form.question.trim() || opts.length < 2) return;
    setSaving(true);
    try {
      await createPoll({ question: form.question, options: opts, expiresAt: form.expiresAt || null });
      setShowCreate(false);
      setForm({ question: '', options: ['', ''], expiresAt: '' });
      load();
    } catch {}
    setSaving(false);
  };

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, ''] }));
  const setOption = (i, v) => setForm(f => ({ ...f, options: f.options.map((o, idx) => idx === i ? v : o) }));
  const removeOption = (i) => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));

  const COLORS = ['#4ecdc4', '#ff6b6b', '#ffd700', '#a29bfe', '#fd79a8', '#74b9ff', '#55efc4', '#fdcb6e'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ color: '#fff', margin: 0 }}>Company Polls 📊</h3>
        {isHrAdmin && (
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            + New Poll
          </button>
        )}
      </div>

      {showCreate && (
        <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h4 style={{ color: '#a29bfe', margin: '0 0 16px' }}>Create Poll</h4>
          <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Ask your question..."
            style={{ width: '100%', padding: '10px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff', boxSizing: 'border-box', marginBottom: 12 }} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>Options</div>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={opt} onChange={e => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  style={{ flex: 1, padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }} />
                {form.options.length > 2 && (
                  <button onClick={() => removeOption(i)}
                    style={{ padding: '8px 12px', background: '#ff6b6b22', border: '1px solid #ff6b6b44', borderRadius: 6, color: '#ff6b6b', cursor: 'pointer' }}>×</button>
                )}
              </div>
            ))}
            <button onClick={addOption}
              style={{ padding: '6px 14px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 13 }}>
              + Add Option
            </button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#aaa', fontSize: 13 }}>Expires At (optional)</label>
            <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              style={{ display: 'block', marginTop: 6, padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} disabled={saving}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Creating...' : 'Create Poll'}
            </button>
            <button onClick={() => setShowCreate(false)}
              style={{ padding: '10px 24px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Loading polls...</div>
      ) : polls.length === 0 ? (
        <div style={{ color: '#666', textAlign: 'center', padding: 60, background: '#1e1e2e', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div>No active polls right now.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {polls.map(poll => {
            const hasVoted = poll.myVoteIndex != null;
            const showResults = hasVoted || isHrAdmin;
            return (
              <div key={poll.id} style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ color: '#fff', margin: '0 0 16px', flex: 1 }}>{poll.question}</h4>
                  {isHrAdmin && (
                    <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                      <button onClick={() => { closePoll(poll.id).then(load); }}
                        style={{ padding: '4px 12px', background: '#ffd70022', border: '1px solid #ffd70044', borderRadius: 6, color: '#ffd700', cursor: 'pointer', fontSize: 12 }}>
                        Close
                      </button>
                      <button onClick={() => { deletePoll(poll.id).then(load); }}
                        style={{ padding: '4px 12px', background: '#ff6b6b22', border: '1px solid #ff6b6b44', borderRadius: 6, color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {poll.options.map((opt, i) => {
                    const count = poll.tally.find(t => t.index === i)?.count ?? 0;
                    const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
                    const isMyVote = poll.myVoteIndex === i;
                    const color = COLORS[i % COLORS.length];
                    return (
                      <div key={i}>
                        {!hasVoted ? (
                          <button onClick={() => handleVote(poll.id, i)} disabled={voting[poll.id]}
                            style={{ width: '100%', padding: '12px 16px', background: '#2a2a3e', border: `1px solid ${color}44`, borderRadius: 8, color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                            {opt}
                          </button>
                        ) : (
                          <div style={{ position: 'relative', padding: '12px 16px', borderRadius: 8, border: `1px solid ${isMyVote ? color : '#333'}`, overflow: 'hidden', background: '#2a2a3e' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color + '33', transition: 'width 0.5s' }} />
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: isMyVote ? color : '#ddd' }}>{isMyVote ? '✓ ' : ''}{opt}</span>
                              <span style={{ color: '#888', fontSize: 13 }}>{pct}% ({count})</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
                  {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''} · by {poll.createdBy}
                  {poll.expiresAt && ` · expires ${new Date(poll.expiresAt).toLocaleDateString()}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
