import { useState, useEffect, useCallback } from 'react';
import {
  getReviewCycles, createReviewCycle, closeReviewCycle, deleteReviewCycle,
  getReviews, createReview, updateReview, deleteReview,
} from '../api/performanceApi';

const RATINGS = [1, 2, 3, 4, 5];
const RATING_LABELS = { 1: 'Poor', 2: 'Below Average', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Outstanding' };
const RATING_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#3b82f6', 4: '#10b981', 5: '#8b5cf6' };

function Stars({ rating }) {
  if (!rating) return <span className="muted">—</span>;
  return (
    <span style={{ color: RATING_COLORS[rating] }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)} <span style={{ fontSize: '0.78rem' }}>{RATING_LABELS[rating]}</span>
    </span>
  );
}

export default function PerformanceView({ employees }) {
  const [cycles, setCycles] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [cycleForm, setCycleForm] = useState({ title: '', type: 'Annual', startDate: '', endDate: '' });
  const [reviewForm, setReviewForm] = useState({ employeeId: '', overallRating: '', goals: '', managerComments: '', selfAssessment: '' });
  const [saving, setSaving] = useState(false);

  const loadCycles = useCallback(async () => {
    const res = await getReviewCycles().catch(() => null);
    if (res) setCycles(res.data);
  }, []);

  const loadReviews = useCallback(async (cycleId) => {
    const res = await getReviews(cycleId).catch(() => null);
    if (res) setReviews(res.data);
  }, []);

  useEffect(() => { loadCycles(); }, [loadCycles]);
  useEffect(() => { if (activeCycle) loadReviews(activeCycle.id); }, [activeCycle, loadReviews]);

  const handleCreateCycle = async () => {
    if (!cycleForm.title || !cycleForm.startDate || !cycleForm.endDate) return;
    setSaving(true);
    try {
      await createReviewCycle(cycleForm);
      setShowCycleForm(false);
      loadCycles();
    } finally { setSaving(false); }
  };

  const handleCloseCycle = async (id) => {
    if (!window.confirm('Close this review cycle? No more reviews can be added.')) return;
    await closeReviewCycle(id);
    loadCycles();
    if (activeCycle?.id === id) setActiveCycle(c => ({ ...c, status: 'Closed' }));
  };

  const handleDeleteCycle = async (id) => {
    if (!window.confirm('Delete this cycle and all its reviews?')) return;
    await deleteReviewCycle(id);
    setCycles(cs => cs.filter(c => c.id !== id));
    if (activeCycle?.id === id) { setActiveCycle(null); setReviews([]); }
  };

  const openReviewForm = (review = null) => {
    setEditingReview(review);
    setReviewForm(review
      ? { employeeId: review.employeeId, overallRating: review.overallRating ?? '', goals: review.goals ?? '', managerComments: review.managerComments ?? '', selfAssessment: review.selfAssessment ?? '' }
      : { employeeId: '', overallRating: '', goals: '', managerComments: '', selfAssessment: '' });
    setShowReviewForm(true);
  };

  const handleSaveReview = async () => {
    if (!activeCycle) return;
    setSaving(true);
    try {
      const payload = {
        overallRating: reviewForm.overallRating ? +reviewForm.overallRating : null,
        goals: reviewForm.goals || null,
        managerComments: reviewForm.managerComments || null,
        selfAssessment: reviewForm.selfAssessment || null,
      };
      if (editingReview) {
        await updateReview(activeCycle.id, editingReview.id, payload);
      } else {
        await createReview(activeCycle.id, { ...payload, employeeId: +reviewForm.employeeId });
      }
      setShowReviewForm(false);
      loadReviews(activeCycle.id);
    } finally { setSaving(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    await deleteReview(activeCycle.id, reviewId);
    loadReviews(activeCycle.id);
  };

  const empName = (id) => {
    const e = employees?.find(e => e.id === id);
    return e ? `${e.firstName} ${e.lastName}` : `Employee #${id}`;
  };

  const reviewedIds = new Set(reviews.map(r => r.employeeId));
  const unreviewed = (employees ?? []).filter(e => !reviewedIds.has(e.id));

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%', minHeight: 0 }}>
      {/* Cycles sidebar */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div className="content-panel" style={{ height: '100%' }}>
          <div className="panel-header">
            <h3 className="panel-title" style={{ fontSize: '1rem' }}>Review Cycles</h3>
            <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => setShowCycleForm(true)}>+ New</button>
          </div>
          {cycles.length === 0 && <p className="muted" style={{ padding: '0.5rem 0' }}>No cycles yet.</p>}
          {cycles.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveCycle(c)}
              style={{
                padding: '0.75rem', borderRadius: 8, marginBottom: '0.5rem', cursor: 'pointer',
                background: activeCycle?.id === c.id ? '#1e3a8a22' : '#0f172a',
                border: `1px solid ${activeCycle?.id === c.id ? '#3b82f6' : '#1e293b'}`,
              }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{c.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{c.type} · {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`badge badge-${c.status === 'Active' ? 'active' : 'inactive'}`}>{c.status}</span>
                {c.status === 'Active' && (
                  <button className="btn-edit" style={{ fontSize: '0.7rem', padding: '2px 6px' }} onClick={e => { e.stopPropagation(); handleCloseCycle(c.id); }}>Close</button>
                )}
                <button className="btn-delete" style={{ fontSize: '0.7rem', padding: '2px 6px' }} onClick={e => { e.stopPropagation(); handleDeleteCycle(c.id); }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!activeCycle ? (
          <div className="content-panel">
            <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>Select a review cycle from the left to view or manage reviews.</p>
          </div>
        ) : (
          <div className="content-panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{activeCycle.title}</h2>
                <span className="muted" style={{ fontSize: '0.82rem' }}>{reviews.length} reviews · {activeCycle.type}</span>
              </div>
              {activeCycle.status === 'Active' && (
                <button className="btn-primary" onClick={() => openReviewForm()}>+ Add Review</button>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Rating</th>
                    <th>Goals</th>
                    <th>Manager Comments</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr><td colSpan={6} className="empty">No reviews yet. Click "+ Add Review" to start.</td></tr>
                  ) : reviews.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{empName(r.employeeId)}</td>
                      <td><Stars rating={r.overallRating} /></td>
                      <td style={{ maxWidth: 180, fontSize: '0.82rem', color: '#94a3b8' }}>{r.goals ?? <span className="muted">—</span>}</td>
                      <td style={{ maxWidth: 200, fontSize: '0.82rem', color: '#94a3b8' }}>{r.managerComments ?? <span className="muted">—</span>}</td>
                      <td><span className={`badge badge-${r.status === 'Completed' ? 'active' : 'probation'}`}>{r.status}</span></td>
                      <td className="actions">
                        <div className="actions-inner">
                          <button className="btn-edit" onClick={() => openReviewForm(r)}>Edit</button>
                          <button className="btn-delete" onClick={() => handleDeleteReview(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Cycle Modal */}
      {showCycleForm && (
        <div className="modal-overlay" onClick={() => setShowCycleForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Review Cycle</h3>
              <button className="modal-close" onClick={() => setShowCycleForm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className="form-label">Title<input className="form-input" value={cycleForm.title} onChange={e => setCycleForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Q1 2026 Review" /></label>
              <label className="form-label">Type
                <select className="form-input" value={cycleForm.type} onChange={e => setCycleForm(f => ({ ...f, type: e.target.value }))}>
                  <option>Annual</option><option>Quarterly</option><option>Mid-Year</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label className="form-label" style={{ flex: 1 }}>Start Date<input type="date" className="form-input" value={cycleForm.startDate} onChange={e => setCycleForm(f => ({ ...f, startDate: e.target.value }))} /></label>
                <label className="form-label" style={{ flex: 1 }}>End Date<input type="date" className="form-input" value={cycleForm.endDate} onChange={e => setCycleForm(f => ({ ...f, endDate: e.target.value }))} /></label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCycleForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateCycle} disabled={saving || !cycleForm.title || !cycleForm.startDate || !cycleForm.endDate}>{saving ? 'Creating…' : 'Create Cycle'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="modal-overlay" onClick={() => setShowReviewForm(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingReview ? 'Edit Review' : 'Add Review'}</h3>
              <button className="modal-close" onClick={() => setShowReviewForm(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!editingReview && (
                <label className="form-label">Employee
                  <select className="form-input" value={reviewForm.employeeId} onChange={e => setReviewForm(f => ({ ...f, employeeId: e.target.value }))}>
                    <option value="">Select employee…</option>
                    {unreviewed.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </label>
              )}
              <label className="form-label">Overall Rating
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 6 }}>
                  {RATINGS.map(r => (
                    <button key={r} onClick={() => setReviewForm(f => ({ ...f, overallRating: f.overallRating === r ? '' : r }))}
                      style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${reviewForm.overallRating === r ? RATING_COLORS[r] : '#334155'}`, background: reviewForm.overallRating === r ? RATING_COLORS[r] + '33' : 'transparent', color: reviewForm.overallRating === r ? RATING_COLORS[r] : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>
                      {r}
                    </button>
                  ))}
                  {reviewForm.overallRating && <span style={{ alignSelf: 'center', color: RATING_COLORS[reviewForm.overallRating], fontSize: '0.85rem' }}>{RATING_LABELS[reviewForm.overallRating]}</span>}
                </div>
              </label>
              <label className="form-label">Goals<textarea className="form-input" rows={2} value={reviewForm.goals} onChange={e => setReviewForm(f => ({ ...f, goals: e.target.value }))} placeholder="Key objectives for this period…" /></label>
              <label className="form-label">Manager Comments<textarea className="form-input" rows={2} value={reviewForm.managerComments} onChange={e => setReviewForm(f => ({ ...f, managerComments: e.target.value }))} placeholder="Feedback and observations…" /></label>
              <label className="form-label">Self Assessment<textarea className="form-input" rows={2} value={reviewForm.selfAssessment} onChange={e => setReviewForm(f => ({ ...f, selfAssessment: e.target.value }))} placeholder="Employee self-assessment…" /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveReview} disabled={saving || (!editingReview && !reviewForm.employeeId)}>{saving ? 'Saving…' : 'Save Review'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
