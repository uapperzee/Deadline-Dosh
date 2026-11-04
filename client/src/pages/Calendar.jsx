import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';

const CATS = ['Assignment', 'Exam', 'Lecture', 'Study', 'Reminder'];

const pad = (n) => String(n).padStart(2, '0');
const dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fD = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fT = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function Calendar({ onNewTask, onEditTask }) {
  const { tasks, subjects } = useData();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => dk(new Date()));
  const [activeCategories, setActiveCategories] = useState({
    Assignment: true,
    Exam: true,
    Lecture: true,
    Study: true,
    Reminder: true
  });
  const [calViewMode, setCalViewMode] = useState('grid'); // 'grid' or 'list'

  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth();

  // First day of grid (Monday start)
  const firstOfMonth = new Date(y, m, 1);
  const startDayOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(y, m, 1 - startDayOffset);

  const toggleCategory = (cat) => {
    setActiveCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const nextMonth = () => setCurrentMonth(new Date(y, m + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(y, m - 1, 1));
  const resetToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(dk(today));
  };

  const getSubjectName = (subjId) => subjects.find(s => s.id === subjId)?.name || 'General';

  const filterTask = (t) => {
    return activeCategories[t.category] !== false;
  };

  // Generate 42 calendar grid cells
  const gridCells = Array.from({ length: 42 }).map((_, i) => {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);
    const dateKey = dk(cellDate);
    const dayTasks = tasks.filter(t => filterTask(t) && dk(new Date(t.due_date || t.due)) === dateKey);
    const isCurrentMonth = cellDate.getMonth() === m;
    const isToday = dateKey === dk(new Date());
    const isSelected = dateKey === selectedDate;

    return {
      date: cellDate,
      dateKey,
      dayNum: cellDate.getDate(),
      tasks: dayTasks,
      isCurrentMonth,
      isToday,
      isSelected
    };
  });

  const selectedDayTasks = tasks
    .filter(t => filterTask(t) && dk(new Date(t.due_date || t.due)) === selectedDate)
    .sort((a, b) => new Date(a.due_date || a.due) - new Date(b.due_date || b.due));

  const monthTasks = tasks.filter(t => {
    const d = new Date(t.due_date || t.due);
    return filterTask(t) && d.getMonth() === m && d.getFullYear() === y;
  }).sort((a, b) => new Date(a.due_date || a.due) - new Date(b.due_date || b.due));

  return (
    <div>
      {/* Month Navigation & Controls */}
      <div className="row mb" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <button className="ghost" onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <h2 style={{ minWidth: '170px', textAlign: 'center' }}>
            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <button className="ghost" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
          <button className="ghost" onClick={resetToday}>
            Today
          </button>
        </div>

        <button
          className="ghost"
          onClick={() => setCalViewMode(prev => (prev === 'grid' ? 'list' : 'grid'))}
        >
          {calViewMode === 'grid' ? 'Show Month List' : 'Show Month Grid'}
        </button>
      </div>

      {/* Category Toggles */}
      <div className="row mb">
        {CATS.map(cat => (
          <button
            key={cat}
            className="ghost"
            onClick={() => toggleCategory(cat)}
            aria-pressed={activeCategories[cat]}
            style={{
              background: activeCategories[cat] ? 'var(--soft)' : 'transparent',
              borderColor: activeCategories[cat] ? 'var(--sec)' : 'var(--bd)'
            }}
          >
            <span className={`ch c-${cat}`} style={{ display: 'inline', margin: '0 4px 0 0' }}>
              {cat[0]}
            </span>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid or List View */}
      {calViewMode === 'grid' ? (
        <div className="cal" role="group" aria-label="Month view">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <b key={day} className="mu">{day}</b>
          ))}

          {gridCells.map((cell) => (
            <button
              key={cell.dateKey}
              className={`cd ${!cell.isCurrentMonth ? 'dim' : ''} ${cell.isSelected ? 'sel' : ''} ${cell.isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(cell.dateKey)}
              aria-label={`${cell.date.toDateString()}, ${cell.tasks.length} items`}
            >
              <b>{cell.dayNum}</b>
              {cell.tasks.slice(0, 2).map((t, idx) => (
                <span key={idx} className={`ch c-${t.category}`}>
                  {t.title}
                </span>
              ))}
              {cell.tasks.length > 2 && (
                <span className="mu" style={{ fontSize: '0.68rem', display: 'block', marginTop: '2px' }}>
                  +{cell.tasks.length - 2} more
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="card">
          {monthTasks.length > 0 ? (
            monthTasks.map(t => (
              <div key={t.id} className="tr">
                <span className={`ch c-${t.category}`} style={{ width: '92px', margin: 0 }}>
                  {t.category}
                </span>
                <span className="t">
                  <b>{t.title}</b>
                  <br />
                  <small className="mu">
                    {fD(t.due_date || t.due)} {fT(t.due_date || t.due)} • {getSubjectName(t.subject_id || t.subj)}
                  </small>
                </span>
                <button className="ghost" onClick={() => onEditTask(t)}>
                  Open
                </button>
              </div>
            ))
          ) : (
            <p className="empty">No events scheduled for this month.</p>
          )}
        </div>
      )}

      {/* Selected Day Schedule */}
      <div className="card mt">
        <div className="row between mb">
          <h2>Schedule for {fD(`${selectedDate}T00:00:00`)}</h2>
          <button className="btn" onClick={() => onNewTask(null, selectedDate)}>
            + Add event on this day
          </button>
        </div>

        {selectedDayTasks.length > 0 ? (
          selectedDayTasks.map(t => (
            <div key={t.id} className="tr">
              <span className={`ch c-${t.category}`} style={{ width: '90px', margin: 0 }}>
                {t.category}
              </span>
              <span className="t">
                <b>{t.title}</b>
                <br />
                <small className="mu">
                  {fT(t.due_date || t.due)} • {getSubjectName(t.subject_id || t.subj)}
                  {t.estimated_minutes ? ` • ${t.estimated_minutes} min` : ''}
                </small>
              </span>
              <span className={`b ${t.priority}`}>{t.priority}</span>
              <button className="ghost" onClick={() => onEditTask(t)}>
                Open
              </button>
            </div>
          ))
        ) : (
          <p className="empty">Nothing planned for this day.</p>
        )}
      </div>
    </div>
  );
}
