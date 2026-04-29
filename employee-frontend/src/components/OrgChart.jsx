import { useState, useEffect } from 'react';
import { getOrgChart } from '../api/funFeaturesApi';

function OrgNode({ emp, allEmps, level = 0 }) {
  const [expanded, setExpanded] = useState(level < 2);
  const reports = allEmps.filter(e => e.managerId === emp.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        onClick={() => reports.length > 0 && setExpanded(e => !e)}
        style={{
          background: level === 0 ? 'linear-gradient(135deg,#a29bfe,#6c5ce7)' : '#1e1e2e',
          border: `2px solid ${level === 0 ? '#a29bfe' : '#333'}`,
          borderRadius: 10, padding: '10px 16px', cursor: reports.length > 0 ? 'pointer' : 'default',
          textAlign: 'center', minWidth: 120, maxWidth: 160, position: 'relative',
          transition: 'all 0.2s', userSelect: 'none'
        }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: level === 0 ? '#fff2' : '#2a2a3e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 18, fontWeight: 700, color: level === 0 ? '#fff' : '#a29bfe', border: `1px solid ${level === 0 ? '#fff4' : '#444'}` }}>
          {emp.name?.charAt(0) ?? '?'}
        </div>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>{emp.name}</div>
        <div style={{ color: level === 0 ? '#ddd' : '#888', fontSize: 11, marginTop: 2 }}>{emp.position || emp.department}</div>
        {reports.length > 0 && (
          <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#a29bfe', color: '#fff', width: 16, height: 16, borderRadius: '50%', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {expanded ? '−' : '+'}
          </div>
        )}
      </div>

      {expanded && reports.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 2, height: 24, background: '#444' }} />
          <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
            {reports.length > 1 && (
              <div style={{
                position: 'absolute', top: 0,
                left: `calc(${100 / reports.length / 2}% )`,
                right: `calc(${100 / reports.length / 2}% )`,
                height: 2, background: '#444'
              }} />
            )}
            {reports.map(r => (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 24, background: '#444' }} />
                <OrgNode emp={r} allEmps={allEmps} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getOrgChart().then(r => { setEmployees(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Building org chart...</div>;

  const roots = employees.filter(e => !e.managerId || !employees.find(x => x.id === e.managerId));
  const filtered = search ? employees.filter(e => e.name?.toLowerCase().includes(search.toLowerCase())) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ color: '#fff', margin: 0 }}>Org Chart 🏢</h3>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search employee..."
          style={{ padding: '8px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff', width: 200 }}
        />
      </div>

      {filtered ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {filtered.map(emp => (
            <div key={emp.id} style={{ background: '#1e1e2e', border: '1px solid #444', borderRadius: 10, padding: '12px 16px', minWidth: 160 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
              <div style={{ color: '#888', fontSize: 12 }}>{emp.position}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{emp.department}</div>
              {emp.managerId && <div style={{ color: '#a29bfe', fontSize: 11, marginTop: 4 }}>Reports to: {employees.find(x => x.id === emp.managerId)?.name ?? 'Unknown'}</div>}
            </div>
          ))}
        </div>
      ) : roots.length === 0 ? (
        <div style={{ color: '#666', textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
          <div>Set Manager IDs on employees to build the org chart.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', padding: '8px 0' }}>
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', paddingBottom: 24 }}>
            {roots.map(r => <OrgNode key={r.id} emp={r} allEmps={employees} level={0} />)}
          </div>
        </div>
      )}
    </div>
  );
}
