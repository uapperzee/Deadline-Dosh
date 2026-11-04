import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

const SLOTS = [
  '8:00 - 9:00',
  '9:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 1:00',
  '1:00 - 2:00',
  '2:00 - 3:00',
  '3:00 - 4:00',
  '4:00 - 5:00'
];

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Timetable() {
  const { timetable, updateTimetableSlot, clearTimetable } = useData();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <div className="card">
      <div className="row between mb">
        <div>
          <h2>Weekly Timetable</h2>
          <span className="mu">Type in any slot to update your schedule. Syncs directly to your account.</span>
        </div>
        <button className="ghost danger" onClick={() => setShowClearConfirm(true)}>
          Clear all slots
        </button>
      </div>

      <div className="tw mt">
        <table className="ttable">
          <thead>
            <tr>
              <th scope="col" style={{ width: '110px' }}>Time</th>
              {WEEK.map((d, i) => (
                <th key={d} scope="col" className={i === todayIndex ? 'now' : ''}>
                  {d} {i === todayIndex ? ' (Today)' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slotTime, r) => (
              <tr key={r}>
                <th scope="row">{slotTime}</th>
                {WEEK.map((dayName, c) => {
                  const key = `${r}_${c}`;
                  const isToday = c === todayIndex;
                  return (
                    <td key={c} className={isToday ? 'now' : ''}>
                      <input
                        type="text"
                        maxLength={40}
                        value={timetable[key] || ''}
                        onChange={(e) => updateTimetableSlot(r, c, e.target.value)}
                        placeholder="Free"
                        aria-label={`${dayName} ${slotTime}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearTimetable}
        title="Clear Entire Timetable?"
        message="Are you sure you want to clear every entry in your weekly timetable? This cannot be undone."
        confirmText="Clear Timetable"
      />
    </div>
  );
}
