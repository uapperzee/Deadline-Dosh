import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
const dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const lti = (d) => `${dk(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fD = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fT = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function Dashboard({ onNewTask }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { tasks, subjects, sessions, preferences, createTask, toggleTask } = useData();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickDue, setQuickDue] = useState(() => lti(new Date(Date.now() + DAY)));
  const [quickError, setQuickError] = useState('');

  const now = new Date();
  const todayKey = dk(now);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Student';

  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const dueTodayTasks = activeTasks.filter(t => {
    const due = new Date(t.due_date || t.due);
    return !isNaN(due.getTime()) && dk(due) === todayKey;
  });

  const upcomingDeadlines = activeTasks
    .filter(t => {
      const diff = new Date(t.due_date || t.due).getTime() - now.getTime();
      return diff > 0 && diff <= 7 * DAY;
    })
    .sort((a, b) => new Date(a.due_date || a.due) - new Date(b.due_date || b.due));

  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  // Study hours this week (last 7 days)
  const last7Days = [6, 5, 4, 3, 2, 1, 0].map(offset => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    return d;
  });

  const dailyMinutes = last7Days.map(d => {
    const key = dk(d);
    return sessions
      .filter(s => dk(new Date(s.created_at || s.started_at)) === key)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  });

  const weeklyStudyMinutes = dailyMinutes.reduce((a, b) => a + b, 0);
  const weeklyStudyHours = parseFloat((weeklyStudyMinutes / 60).toFixed(1));
  const weeklyTarget = preferences.weekly || 10;
  const weeklyProgress = Math.min(100, Math.round((weeklyStudyHours / weeklyTarget) * 100));

  // Today's schedule
  const todaySchedule = [
    ...tasks
      .filter(t => dk(new Date(t.due_date || t.due)) === todayKey)
      .map(t => ({
        at: t.due_date || t.due,
        title: t.title,
        category: t.category,
        duration: t.estimated_minutes || 60,
        isDone: t.status === 'Completed'
      })),
    ...sessions
      .filter(s => dk(new Date(s.created_at || s.started_at)) === todayKey)
      .map(s => ({
        at: s.created_at || s.started_at,
        title: 'Focus session',
        category: 'Study',
        duration: s.duration_minutes,
        isDone: true
      }))
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  const getSubjectName = (subjId) => {
    return subjects.find(s => s.id === subjId)?.name || 'General';
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      setQuickError('Please add a task title.');
      return;
    }
    setQuickError('');
    try {
      await createTask({
        title: quickTitle.trim(),
        due_date: new Date(quickDue).toISOString(),
        category: 'Assignment',
        priority: 'Medium',
        status: 'To Do',
        estimated_minutes: 60
      });
      setQuickTitle('');
      setQuickDue(lti(new Date(Date.now() + DAY)));
    } catch (err) {
      setQuickError(err.message || 'Could not add task.');
    }
  };

  const maxMin = Math.max(...dailyMinutes, 1);

  return (
    <div>
      {/* Greeting & Quick Capture Banner */}
      <section className="card mb">
        <h2>{greeting}, {displayName}</h2>
        <p className="mu" style={{ margin: '4px 0 14px' }}>
          {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.{' '}
          {dueTodayTasks.length > 0
            ? `${dueTodayTasks.length} deadline${dueTodayTasks.length > 1 ? 's' : ''} scheduled for today. Let's conquer them step by step.`
            : 'No deadlines due today! A wonderful day to get ahead or study with focus.'}
        </p>

        <form onSubmit={handleQuickAdd} className="row">
          <input
            type="text"
            placeholder="Quick capture: what needs doing?"
            aria-label="Task title"
            maxLength={120}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            style={{ flex: 2, minWidth: '180px' }}
          />
          <input
            type="datetime-local"
            aria-label="Due date and time"
            value={quickDue}
            onChange={(e) => setQuickDue(e.target.value)}
            style={{ flex: 1, minWidth: '180px' }}
          />
          <button type="submit" className="btn">
            Add task
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => navigate('/planner')}
          >
            Plan study
          </button>
        </form>
        {quickError && <p className="err" role="alert">{quickError}</p>}
      </section>

      {/* Primary Metrics Grid */}
      <div className="grid g3">
        <div className="card stat">
          <b>{activeTasks.length}</b>
          <span>Active tasks</span>
        </div>
        <div className="card stat">
          <b>{dueTodayTasks.length}</b>
          <span>Due today</span>
        </div>
        <div className="card stat">
          <b>{upcomingDeadlines.length}</b>
          <span>Due in 7 days</span>
        </div>
        <div className="card stat">
          <b>{completedCount}</b>
          <span>Completed</span>
        </div>
        <div className="card stat">
          <b>{weeklyStudyHours} h</b>
          <span>Study time (7 days)</span>
        </div>
        <div className="card stat">
          <b>{profile?.current_streak || 0}</b>
          <span>Day streak</span>
        </div>
      </div>

      {/* Main Dashboard Cards */}
      <div className="grid g2">
        {/* Today's Schedule */}
        <div className="card">
          <h2>Today’s Schedule</h2>
          {todaySchedule.length > 0 ? (
            todaySchedule.map((item, idx) => (
              <div key={idx} className={`tr ${item.isDone ? 'done' : ''}`}>
                <span className="mu" style={{ width: '60px', flex: 'none' }}>
                  {fT(item.at)}
                </span>
                <span className="t">
                  <b>{item.title}</b>
                  <br />
                  <small className="mu">
                    {item.category}, {item.duration} min{item.isDone ? ' (Completed)' : ''}
                  </small>
                </span>
              </div>
            ))
          ) : (
            <p className="empty">Nothing scheduled for today yet.</p>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="row between">
            <h2>Upcoming Deadlines</h2>
            <button className="ghost" style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => navigate('/tasks')}>
              View all
            </button>
          </div>
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.slice(0, 5).map(task => (
              <div key={task.id} className="tr">
                <span className="t">
                  <b>{task.title}</b>
                  <br />
                  <small className="mu">
                    {getSubjectName(task.subject_id || task.subj)}, {fD(task.due_date || task.due)} {fT(task.due_date || task.due)}
                  </small>
                </span>
                <span className={`b ${task.priority}`}>{task.priority}</span>
                <button
                  className="ghost"
                  onClick={() => onNewTask(task)}
                  style={{ padding: '4px 10px' }}
                >
                  Open
                </button>
              </div>
            ))
          ) : (
            <div className="empty">
              <p>No deadlines in the next 7 days.</p>
              <button className="btn mt" onClick={() => onNewTask()}>
                Add a deadline
              </button>
            </div>
          )}
        </div>

        {/* Study This Week Bar Chart */}
        <div className="card">
          <h2>Study this Week</h2>
          {weeklyStudyMinutes > 0 ? (
            <svg className="ch2" viewBox="0 0 308 126" role="img" aria-label="Study minutes per day">
              {dailyMinutes.map((mins, i) => {
                const height = maxMin > 0 ? (mins / maxMin) * 82 : 0;
                const shortDay = last7Days[i].toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
                const x = i * 44 + 8;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={104 - height}
                      width={28}
                      height={height}
                      rx={5}
                      fill="var(--sec)"
                    >
                      <title>{shortDay}: {mins} min</title>
                    </rect>
                    <text x={x + 14} y={120} textAnchor="middle" fontSize={11} fill="var(--tx2)">
                      {shortDay}
                    </text>
                    <text x={x + 14} y={Math.max(12, 98 - height)} textAnchor="middle" fontSize={10} fill="var(--tx)">
                      {mins || ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="empty">
              <p>No study sessions recorded this week.</p>
              <button className="btn mt" onClick={() => navigate('/focus')}>
                Start a focus session
              </button>
            </div>
          )}
          <p className="mu mt">
            Weekly target: <b>{weeklyTarget} hrs</b> ({weeklyProgress}% achieved).
          </p>
        </div>

        {/* Progress by Subject */}
        <div className="card">
          <div className="row between">
            <h2>Progress by Subject</h2>
            <button className="ghost" style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => navigate('/subjects')}>
              Manage
            </button>
          </div>
          {subjects.filter(s => !s.is_archived).length > 0 ? (
            subjects
              .filter(s => !s.is_archived)
              .slice(0, 5)
              .map(subj => {
                const subjTasks = tasks.filter(t => (t.subject_id === subj.id || t.subj === subj.id));
                const completed = subjTasks.filter(t => t.status === 'Completed').length;
                const percent = subjTasks.length ? Math.round((completed / subjTasks.length) * 100) : 0;
                return (
                  <div key={subj.id} style={{ margin: '10px 0' }}>
                    <div className="row between" style={{ marginBottom: '4px' }}>
                      <b>{subj.name}</b>
                      <span className="mu">{completed} of {subjTasks.length} done ({percent}%)</span>
                    </div>
                    <div className="pb">
                      <i style={{ width: `${percent}%`, background: subj.color || 'var(--sec)' }}></i>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="empty">
              <p>Add your academic subjects to track progress.</p>
              <button className="btn mt" onClick={() => navigate('/subjects')}>
                Add Subject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Study Tip Card */}
      <div className="card tipc mt">
        <h2>Study Strategy & Productivity Tip</h2>
        <p style={{ margin: '6px 0 12px', maxWidth: '65ch', lineHeight: 1.6 }}>
          💡 <b>Spaced Testing beats Passive Re-reading</b>: Write down key principles from memory before checking your textbook. This triggers active memory retrieval pathways and dramatically increases retention during exams.
        </p>
        <button className="ghost" onClick={() => navigate('/assistant')}>
          Ask the Study Assistant →
        </button>
      </div>
    </div>
  );
}
