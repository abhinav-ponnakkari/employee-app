const AVATAR_COLORS = ['blue', 'green', 'purple', 'orange', 'teal'];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

export default function EmployeeDetail({ employee: emp, onEdit, onDelete, onClose }) {
  const initials = `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase();
  const color = avatarColor(emp.firstName + emp.lastName);
  const status = emp.status ?? 'Active';

  return (
    <>
      <div className="side-panel-backdrop" onClick={onClose} />
      <aside className="side-panel">
        <div className="side-panel-header">
          <button className="side-panel-close" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="side-panel-body">
          <div className="detail-profile">
            {emp.photoUrl ? (
              <img className={`detail-avatar`} src={emp.photoUrl} alt={`${emp.firstName} ${emp.lastName}`} />
            ) : (
              <div className={`detail-avatar avatar-${color}`}>{initials}</div>
            )}
            <div className="detail-name">{emp.firstName} {emp.lastName}</div>
            {emp.position && <div className="detail-position">{emp.position}</div>}
            <div className="detail-badge-row">
              <span className={`badge badge-${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Contact</div>
            <DetailRow label="Email" value={emp.email} />
            <DetailRow label="Phone" value={emp.phone} />
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Employment</div>
            <DetailRow label="Department" value={emp.department} />
            <DetailRow label="Position" value={emp.position} />
            <DetailRow label="Salary" value={`$${emp.salary.toLocaleString()}`} />
            <DetailRow label="Hire Date" value={new Date(emp.hireDate).toLocaleDateString()} />
            <DetailRow label="Status" value={status} />
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Personal</div>
            <DetailRow label="Gender" value={emp.gender} />
            <DetailRow
              label="Date of Birth"
              value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : null}
            />
          </div>
        </div>

        <div className="side-panel-actions">
          <button className="btn-edit" onClick={onEdit}>Edit</button>
          <button className="btn-delete" onClick={onDelete}>Delete</button>
        </div>
      </aside>
    </>
  );
}
