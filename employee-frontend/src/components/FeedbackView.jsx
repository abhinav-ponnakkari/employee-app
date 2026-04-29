import { useState, useEffect, useCallback } from 'react';
import { submitFeedback, getAllFeedback, markFeedbackRead, replyToFeedback, deleteFeedback, getFeedbackStats } from '../api/funFeaturesApi';

const CATEGORIES = ['General', 'Suggestion', 'Concern', 'Appreciation'];
const CAT_COLOR = { General: '#74b9ff', Suggestion: '#a29bfe', Concern: '#ff6b6b', Appreciation: '#2ecc71' };
const CAT_ICON = { General: '💬', Suggestion: '💡', Concern: '⚠️', Appreciation: '💚' };

function SubmitForm() {
  const [form, setForm] = useState({ content: '', category: 'General' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.content.trim()) return;
    setSending(true);
    try {
      await submitFeedback(form);
      setSuccess(true);
      setForm({ content: '', category: 'General' });
    } catch {}
    setSending(false);
  };

  if (success) return (
    <div style={{ background: '#1e1e2e', border: '1px solid #2ecc71', borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <div style={{ color: '#2ecc71', fontWeight: 700, marginTop: 12 }}>Feedback submitted anonymously!</div>
      <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>Thank you for sharing your thoughts.</div>
      <button onClick={() => setSuccess(false)} style={{ marginTop: 16, padding: '8px 20px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}>
        Submit Another
      </button>
    </div>
  );

  return (
    <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 700 }}>Anonymous Feedback</div>
          <div style={{ color: '#888', fontSize: 12 }}>Your identity is never stored.</div>
        </div>
      </div>
      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        style={{ padding: '8px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff', marginBottom: 12 }}>
        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        placeholder="Share your thoughts, suggestions, or concerns..."
        rows={4}
        style={{ width: '100%', padding: '10px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
      <button onClick={handleSubmit} disabled={sending || !form.content.trim()}
        style={{ padding: '10px 28px', background: 'linear-gradient(135deg,#74b9ff,#0984e3)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: form.content.trim() ? 1 : 0.5 }}>
        {sending ? 'Sending...' : '🔒 Submit Anonymously'}
      </button>
    </div>
  );
}

export default function FeedbackView({ role }) {
  const isHrAdmin = role === 'Admin' || role === 'HR';
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!isHrAdmin) return;
    setLoading(true);
    try {
      const [fb, st] = await Promise.all([getAllFeedback(filter === 'unread' ? { unread: true } : {}), getFeedbackStats()]);
      setFeedbacks(fb.data);
      setStats(st.data);
    } catch {}
    setLoading(false);
  }, [isHrAdmin, filter]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    await replyToFeedback(id, replyText);
    setReplyId(null); setReplyText('');
    load();
  };

  const handleMarkRead = async (id) => { await markFeedbackRead(id); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete this feedback?')) return; await deleteFeedback(id); load(); };

  return (
    <div>
      <SubmitForm />

      {isHrAdmin && (
        <div>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ color: '#74b9ff', fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
                <div style={{ color: '#888', fontSize: 12 }}>Total</div>
              </div>
              <div style={{ background: '#1e1e2e', border: '1px solid #ff6b6b44', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ color: '#ff6b6b', fontSize: 28, fontWeight: 700 }}>{stats.unread}</div>
                <div style={{ color: '#888', fontSize: 12 }}>Unread</div>
              </div>
              {stats.byCategory?.map(c => (
                <div key={c.category} style={{ background: '#1e1e2e', border: `1px solid ${CAT_COLOR[c.category]}44`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 20 }}>{CAT_ICON[c.category]}</div>
                  <div style={{ color: CAT_COLOR[c.category], fontSize: 20, fontWeight: 700 }}>{c.count}</div>
                  <div style={{ color: '#888', fontSize: 11 }}>{c.category}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all', 'unread'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: filter === f ? '#74b9ff' : '#2a2a3e', color: filter === f ? '#000' : '#aaa' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Loading...</div>
          ) : feedbacks.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>No feedback yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {feedbacks.map(fb => (
                <div key={fb.id} style={{ background: '#1e1e2e', border: `1px solid ${fb.isRead ? '#333' : '#74b9ff44'}`, borderRadius: 10, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ background: CAT_COLOR[fb.category] + '22', color: CAT_COLOR[fb.category], padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {CAT_ICON[fb.category]} {fb.category}
                      </span>
                      {!fb.isRead && <span style={{ background: '#ff6b6b', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>NEW</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!fb.isRead && <button onClick={() => handleMarkRead(fb.id)} style={{ padding: '4px 10px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>Mark Read</button>}
                      <button onClick={() => { setReplyId(fb.id); setReplyText(fb.hrReply || ''); }}
                        style={{ padding: '4px 10px', background: '#74b9ff22', border: '1px solid #74b9ff44', borderRadius: 6, color: '#74b9ff', cursor: 'pointer', fontSize: 12 }}>Reply</button>
                      <button onClick={() => handleDelete(fb.id)}
                        style={{ padding: '4px 10px', background: '#ff6b6b22', border: '1px solid #ff6b6b44', borderRadius: 6, color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                    </div>
                  </div>
                  <p style={{ color: '#ddd', margin: '0 0 8px', lineHeight: 1.6 }}>{fb.content}</p>
                  <div style={{ color: '#666', fontSize: 12 }}>{new Date(fb.createdAt).toLocaleString()}</div>
                  {fb.hrReply && (
                    <div style={{ marginTop: 12, background: '#2a2a3e', borderRadius: 8, padding: 14, borderLeft: '3px solid #74b9ff' }}>
                      <div style={{ color: '#74b9ff', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>HR Response</div>
                      <p style={{ color: '#ddd', margin: 0, fontSize: 14 }}>{fb.hrReply}</p>
                    </div>
                  )}
                  {replyId === fb.id && (
                    <div style={{ marginTop: 12 }}>
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a reply..." rows={3}
                        style={{ width: '100%', padding: '10px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleReply(fb.id)}
                          style={{ padding: '8px 20px', background: '#74b9ff', border: 'none', borderRadius: 6, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                          Send Reply
                        </button>
                        <button onClick={() => setReplyId(null)}
                          style={{ padding: '8px 14px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 6, color: '#aaa', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
