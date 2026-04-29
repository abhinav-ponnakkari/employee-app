import { useState, useEffect, useCallback } from 'react';
import { getMySkills, getEmployeeSkills, addSkill, updateSkill, deleteSkill } from '../api/funFeaturesApi';

const CATEGORIES = ['Skill', 'Certification', 'Language', 'Tool'];
const LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const LEVEL_COLOR = { Beginner: '#ffd700', Intermediate: '#4ecdc4', Expert: '#2ecc71' };
const CAT_ICON = { Skill: '⚡', Certification: '🏅', Language: '🌐', Tool: '🔧' };

export default function SkillsPanel({ employeeId, role, readOnly = false }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Skill', level: 'Intermediate', expiryDate: '' });
  const [saving, setSaving] = useState(false);

  const isHrAdmin = role === 'Admin' || role === 'HR';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = employeeId ? await getEmployeeSkills(employeeId) : await getMySkills();
      setSkills(r.data);
    } catch {}
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (skill) => {
    setEditing(skill.id);
    setForm({ name: skill.name, category: skill.category, level: skill.level || 'Intermediate', expiryDate: skill.expiryDate || '' });
    setShowForm(true);
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ name: '', category: 'Skill', level: 'Intermediate', expiryDate: '' }); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name, category: form.category, level: form.level, expiryDate: form.expiryDate || null, employeeId: employeeId || null };
      if (editing) await updateSkill(editing, payload);
      else await addSkill(payload);
      resetForm();
      load();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this skill?')) return;
    await deleteSkill(id);
    load();
  };

  const grouped = CATEGORIES.map(cat => ({ cat, items: skills.filter(s => s.category === cat) })).filter(g => g.items.length > 0);

  if (loading) return <div style={{ color: '#aaa', padding: 20, textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>{skills.length} skill{skills.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowForm(true)}
            style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            + Add Skill
          </button>
        </div>
      )}

      {showForm && (
        <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <h4 style={{ color: '#a29bfe', margin: '0 0 14px', fontSize: 14 }}>{editing ? 'Edit Skill' : 'Add Skill'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Skill / Certification name"
              style={{ padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              style={{ padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          {form.category === 'Certification' && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ color: '#888', fontSize: 12 }}>Expiry Date (optional)</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                style={{ display: 'block', marginTop: 4, padding: '8px 12px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 6, color: '#fff' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 20px', background: '#a29bfe', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
            <button onClick={resetForm}
              style={{ padding: '8px 16px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 6, color: '#aaa', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {skills.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
          <div>No skills added yet.</div>
        </div>
      ) : (
        grouped.map(({ cat, items }) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ color: '#888', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              {CAT_ICON[cat]} {cat}s
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {items.map(skill => (
                <div key={skill.id} style={{ background: '#2a2a3e', border: '1px solid #444', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#fff', fontSize: 13 }}>{skill.name}</span>
                  {skill.level && (
                    <span style={{ background: LEVEL_COLOR[skill.level] + '33', color: LEVEL_COLOR[skill.level], fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                      {skill.level}
                    </span>
                  )}
                  {skill.expiryDate && (
                    <span style={{ color: new Date(skill.expiryDate) < new Date() ? '#ff6b6b' : '#ffd700', fontSize: 11 }}>
                      exp {skill.expiryDate}
                    </span>
                  )}
                  {!readOnly && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(skill)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, padding: '0 2px' }}>✏</button>
                      {(isHrAdmin || !employeeId) && <button onClick={() => handleDelete(skill.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b88', cursor: 'pointer', fontSize: 13, padding: '0 2px' }}>×</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
