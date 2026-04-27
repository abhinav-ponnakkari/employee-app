export default function SearchFilter({
  search, onSearch,
  filterDept, onFilterDept,
  filterStatus, onFilterStatus,
  departments,
  resultCount,
  totalCount,
  onClear,
}) {
  const hasFilters = search || filterDept || filterStatus;

  return (
    <div className="search-filter">
      <div className="search-filter-controls">
        <div className="search-input-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search by name, email or position..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        <select value={filterDept} onChange={e => onFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={e => onFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
        </select>

        {hasFilters && (
          <button className="btn-clear" onClick={onClear}>Clear filters</button>
        )}
      </div>

      <div className="filter-result-count">
        {hasFilters
          ? `${resultCount} of ${totalCount} employees`
          : `${totalCount} employee${totalCount !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}
