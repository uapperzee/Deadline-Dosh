import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { api } from '../services/api.js';

const pad = (n) => String(n).padStart(2, '0');
const dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fD = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fT = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function StudyPlanner() {
  const { subjects, tasks, createTask, showToast } = useData();

  const [selectedSubjectId, setSelectedSubjectId] = useState(() => subjects[0]?.id || '');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return dk(d);
  });
  const [dailyHours, setDailyHours] = useState(2);
  const [suggestedPlan, setSuggestedPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [addingTasks, setAddingTasks] = useState(false);
  const [error, setError] = useState('');

  const activeSubjects = subjects.filter(s => !s.is_archived);

  // Study tasks this week
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  const studyBlocksThisWeek = tasks
    .filter(t => t.category === 'Study' && t.status !== 'Completed')
    .filter(t => {
      const d = new Date(t.due_date || t.due);
      return d >= now && d <= weekFromNow;
    })
    .sort((a, b) => new Date(a.due_date || a.due) - new Date(b.due_date || b.due));

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setError('Please select a subject.');
      return;
    }
    if (!examDate) {
      setError('Please select an exam date.');
      return;
    }

    setLoadingPlan(true);
    setError('');
    try {
      // Call backend AI study planner
      const res = await api.post('/api/ai/study-plan', {
        subject_id: selectedSubjectId,
        exam_date: examDate,
        daily_hours: parseFloat(dailyHours)
      });

      if (res.success && res.data) {
        setSuggestedPlan({
          ...res.data,
          schedule: res.data.schedule.map(item => ({
            ...item,
            included: true
          }))
        });
      }
    } catch (err) {
      console.warn('[Planner] Fallback local generation:', err.message);
      // Fallback local calculation
      const subj = subjects.find(s => s.id === selectedSubjectId);
      const ex = new Date(examDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.round((ex.getTime() - today.getTime()) / 86400000);

      if (diffDays <= 0) {
        setError('Exam date must be in the future.');
        setLoadingPlan(false);
        return;
      }

      const rows = [];
      const topics = [
        `Review Core Chapters for ${subj?.name || 'Exam'}`,
        `Practice Problem Sets & Diagrams`,
        `Solve Previous Year Questions`,
        `Formula & Theorem Cheat-sheet Review`,
        `Mock Timed Exam Simulation`
      ];

      for (let i = 1; i <= Math.min(diffDays - 1, 14); i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        rows.push({
          date: dk(d),
          topic: topics[i % topics.length],
          minutes: Math.round(dailyHours * 60),
          included: true
        });
      }

      setSuggestedPlan({
        subject_id: selectedSubjectId,
        subject_name: subj?.name || 'Subject',
        exam_date: examDate,
        schedule: rows
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleToggleRow = (index) => {
    setSuggestedPlan(prev => ({
      ...prev,
      schedule: prev.schedule.map((row, i) =>
        i === index ? { ...row, included: !row.included } : row
      )
    }));
  };

  const handleMinutesChange = (index, mins) => {
    setSuggestedPlan(prev => ({
      ...prev,
      schedule: prev.schedule.map((row, i) =>
        i === index ? { ...row, minutes: parseInt(mins, 10) || 30 } : row
      )
    }));
  };

  const handleAddSelectedToCalendar = async (e) => {
    e.preventDefault();
    if (!suggestedPlan) return;

    const selectedRows = suggestedPlan.schedule.filter(r => r.included);
    if (!selectedRows.length) {
      showToast('No study blocks selected.');
      return;
    }

    setAddingTasks(true);
    try {
      let count = 0;
      for (const row of selectedRows) {
        await createTask({
          title: `Study: ${row.topic}`,
          description: `Generated exam review block for ${suggestedPlan.subject_name}`,
          subject_id: suggestedPlan.subject_id,
          category: 'Study',
          due_date: `${row.date}T18:00:00`,
          priority: 'Medium',
          status: 'To Do',
          estimated_minutes: row.minutes
        });
        count++;
      }
      showToast(`Added ${count} study session${count > 1 ? 's' : ''} to your calendar!`);
      setSuggestedPlan(null);
    } catch (err) {
      showToast(err.message || 'Could not add study blocks to calendar.');
    } finally {
      setAddingTasks(false);
    }
  };

  return (
    <div>
      <div className="grid g2">
        {/* Exam Plan Form */}
        <form onSubmit={handleGeneratePlan} className="card" style={{ display: 'grid', gap: '14px' }}>
          <h2>Exam Preparation Plan</h2>
          <p className="mu" style={{ margin: 0 }}>
            Specify your upcoming exam and study availability. The algorithm generates a personalized spaced-repetition plan.
          </p>

          <label>
            Subject
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              required
            >
              <option value="">Select subject</option>
              {activeSubjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            Exam Date
            <input
              type="date"
              required
              min={dk(new Date(Date.now() + 86400000))}
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </label>

          <label>
            Daily Study Availability (Hours)
            <input
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
            />
          </label>

          {error && <p className="err">{error}</p>}

          <button type="submit" className="btn" disabled={loadingPlan}>
            {loadingPlan ? 'Generating Schedule...' : 'Suggest Study Schedule'}
          </button>
        </form>

        {/* Study Blocks This Week */}
        <div className="card">
          <h2>Study Blocks This Week</h2>
          {studyBlocksThisWeek.length > 0 ? (
            studyBlocksThisWeek.map(task => (
              <div key={task.id} className="tr">
                <span className="t">
                  <b>{task.title}</b>
                  <br />
                  <small className="mu">
                    {fD(task.due_date || task.due)} {fT(task.due_date || task.due)} • {task.estimated_minutes || 60} min
                  </small>
                </span>
                <span className="b">{task.status}</span>
              </div>
            ))
          ) : (
            <div className="empty">
              <p>No study sessions scheduled for this week yet.</p>
              <p className="mu">Generate an exam plan on the left or schedule study blocks in My Tasks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Plan Results */}
      {suggestedPlan && (
        <form onSubmit={handleAddSelectedToCalendar} className="card mt" style={{ display: 'grid', gap: '12px' }}>
          <div className="row between">
            <div>
              <h2>Suggested Plan for {suggestedPlan.subject_name}</h2>
              <span className="b" style={{ background: 'var(--soft)', marginTop: '4px' }}>
                Preview Only — Untick any block or adjust minutes before adding to calendar
              </span>
            </div>
            <button type="submit" className="btn" disabled={addingTasks}>
              {addingTasks ? 'Adding to Calendar...' : 'Add Selected to Calendar'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
            {suggestedPlan.schedule.map((row, idx) => (
              <div key={idx} className="tr" style={{ background: row.included ? 'transparent' : 'var(--soft)', opacity: row.included ? 1 : 0.6 }}>
                <input
                  type="checkbox"
                  checked={row.included}
                  onChange={() => handleToggleRow(idx)}
                  aria-label={`Include block on ${row.date}`}
                />
                <span className="t">
                  <b>{fD(`${row.date}T00:00:00`)}</b>: {row.topic}
                </span>
                <div className="row">
                  <input
                    type="number"
                    min="15"
                    max="600"
                    step="5"
                    value={row.minutes}
                    onChange={(e) => handleMinutesChange(idx, e.target.value)}
                    style={{ width: '80px', minHeight: '34px' }}
                    aria-label="Minutes"
                  />
                  <span className="mu">min</span>
                </div>
              </div>
            ))}
          </div>

          <div className="row end mt">
            <button type="button" className="ghost" onClick={() => setSuggestedPlan(null)}>
              Dismiss Plan
            </button>
            <button type="submit" className="btn" disabled={addingTasks}>
              {addingTasks ? 'Adding to Calendar...' : 'Add Selected to Calendar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
