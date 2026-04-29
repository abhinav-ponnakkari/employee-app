import { useState, useEffect, useCallback } from 'react';
import { getLeaveRequests } from '../api/leaveApi';
import { getHolidays } from '../api/holidaysApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_COLOR = { Approved: '#2ecc71', Pending: '#ffd700', Rejected: '#ff6b6b' };

export default function LeaveCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const [lr, hol] = await Promise.all([getLeaveRequests(), getHolidays()]);
      setLeaves(lr.data?.items ?? lr.data ?? []);
      setHolidays(hol.data ?? []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const toKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const getEventsForDay = (day) => {
    const key = toKey(year, month, day);
    const dayLeaves = leaves.filter(l => {
      const start = l.startDate?.slice(0, 10);
      const end = l.endDate?.slice(0, 10);
      return start <= key && key <= end;
    });
    const dayHolidays = holidays.filter(h => h.date?.slice(0, 10) === key);
    return { dayLeaves, dayHolidays };
  };

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ color: '#fff', margin: 0 }}>Leave Calendar 📅</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{ padding: '6px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 7, color: '#fff', cursor: 'pointer' }}>‹</button>
          <span style={{ color: '#fff', fontWeight: 700, minWidth: 140, textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={{ padding: '6px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 7, color: '#fff', cursor: 'pointer' }}>›</button>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            style={{ padding: '6px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 7, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>Today</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ label: 'Approved Leave', color: '#2ecc71' }, { label: 'Pending Leave', color: '#ffd700' }, { label: 'Holiday', color: '#ff6b6b' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
            <span style={{ color: '#888', fontSize: 12 }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e1e2e', borderRadius: 12, overflow: 'hidden', border: '1px solid #333' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#2a2a3e' }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '10px 4px', color: '#888', fontSize: 12, fontWeight: 700 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} style={{ minHeight: 80, borderRight: '1px solid #2a2a3e', borderBottom: '1px solid #2a2a3e' }} />;
            const { dayLeaves, dayHolidays } = getEventsForDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selected?.day === day;
            return (
              <div key={day}
                onClick={() => setSelected(isSelected ? null : { day, leaves: dayLeaves, holidays: dayHolidays })}
                style={{
                  minHeight: 80, borderRight: '1px solid #2a2a3e', borderBottom: '1px solid #2a2a3e', padding: '6px 4px',
                  cursor: dayLeaves.length + dayHolidays.length > 0 ? 'pointer' : 'default',
                  background: isSelected ? '#2a2a3e' : 'transparent', transition: 'background 0.15s'
                }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: isToday ? '#a29bfe' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isToday ? '#fff' : '#ddd', fontWeight: isToday ? 700 : 400, fontSize: 13, margin: '0 auto 4px' }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 2px' }}>
                  {dayHolidays.map(h => (
                    <div key={h.id} style={{ background: '#ff6b6b33', borderLeft: '2px solid #ff6b6b', padding: '1px 4px', borderRadius: 3, fontSize: 10, color: '#ff6b6b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🎌 {h.name}
                    </div>
                  ))}
                  {dayLeaves.slice(0, 3).map(l => (
                    <div key={l.id} style={{ background: (STATUS_COLOR[l.status] || '#888') + '22', borderLeft: `2px solid ${STATUS_COLOR[l.status] || '#888'}`, padding: '1px 4px', borderRadius: 3, fontSize: 10, color: STATUS_COLOR[l.status] || '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.employeeName || l.type}
                    </div>
                  ))}
                  {dayLeaves.length > 3 && <div style={{ color: '#666', fontSize: 10 }}>+{dayLeaves.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (selected.leaves.length + selected.holidays.length > 0) && (
        <div style={{ marginTop: 20, background: '#1e1e2e', border: '1px solid #333', borderRadius: 12, padding: 20 }}>
          <h4 style={{ color: '#fff', margin: '0 0 14px', fontSize: 15 }}>
            {MONTHS[month]} {selected.day}, {year}
          </h4>
          {selected.holidays.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#ff6b6b11', borderRadius: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>🎌</span>
              <div>
                <div style={{ color: '#ff6b6b', fontWeight: 600, fontSize: 14 }}>{h.name}</div>
                <div style={{ color: '#888', fontSize: 12 }}>Public Holiday</div>
              </div>
            </div>
          ))}
          {selected.leaves.map(l => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: (STATUS_COLOR[l.status] || '#888') + '11', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLOR[l.status] || '#888', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{l.employeeName || 'Employee'}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{l.type} leave · {l.startDate?.slice(0, 10)} to {l.endDate?.slice(0, 10)}</div>
              </div>
              <span style={{ color: STATUS_COLOR[l.status] || '#888', fontSize: 12, fontWeight: 600 }}>{l.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
