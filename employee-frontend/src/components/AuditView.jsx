import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '../api/auditApi';

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', entityType: '', username: '' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.username) params.username = filters.username;
      const res = await getAuditLogs(params);
      setLogs(res.data);
      setPage(1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginated = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const actions = [...new Set(logs.map(l => l.action))].sort();
  const entityTypes = [...new Set(logs.map(l => l.entityType))].sort();

  return (
    <div className="content-panel">
      <div className="panel-header">
        <h2 className="panel-title">Audit Log</h2>
        <span className="muted" style={{ fontSize: '0.85rem' }}>{logs.length} entries</span>
      </div>

      <div className="filter-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select className="filter-select" value={filters.action} onChange={e => setFilter('action', e.target.value)}>
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="filter-select" value={filters.entityType} onChange={e => setFilter('entityType', e.target.value)}>
          <option value="">All Types</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          className="search-input"
          placeholder="Filter by user..."
          value={filters.username}
          onChange={e => setFilter('username', e.target.value)}
          style={{ maxWidth: 180 }}
        />
        {(filters.action || filters.entityType || filters.username) && (
          <button className="btn-secondary" onClick={() => setFilters({ action: '', entityType: '', username: '' })}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty" style={{ padding: '2rem' }}>Loading…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Type</th>
                <th>Entity ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="empty">No audit entries found.</td></tr>
              ) : paginated.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>{log.username}</td>
                  <td>
                    <span className={`badge badge-${actionColor(log.action)}`}>{log.action}</span>
                  </td>
                  <td>{log.entityType}</td>
                  <td className="muted">{log.entityId ?? '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{log.details ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">
            {`${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, logs.length)} of ${logs.length}`}
          </span>
          <div className="page-controls">
            <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}

function actionColor(action) {
  const a = action?.toLowerCase();
  if (a === 'deleted') return 'on-leave';
  if (a === 'created') return 'active';
  if (a === 'login') return 'probation';
  return 'inactive';
}
