import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

const PRI = ['Low', 'Medium', 'High', 'Urgent'];
const ST = ['To Do', 'In Progress', 'Completed'];

const fD = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fT = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const pad = (n) => String(n).padStart(2, '0');
const dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function Tasks({ onEditTask, onNewTask, searchQuery }) {
  const { tasks, subjects, toggleTask, deleteTask } = useData();

  const [filterSubject, setFilterSubject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('due');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'

  const [deleteTarget, setDeleteTarget] = useState(null);

  const now = new Date();
  const todayKey = dk(now);

  const getSubject = (subjId) => subjects.find(s => s.id === subjId);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const q = (searchQuery || '').toLowerCase();
    const titleMatch = (t.title || '').toLowerCase().includes(q);
    const descMatch = (t.description || '').toLowerCase().includes(q);
    const notesMatch = (t.notes || '').toLowerCase().includes(q);
    const subjName = (getSubject(t.subject_id || t.subj)?.name || '').toLowerCase();
    const matchesSearch = !q || titleMatch || descMatch || notesMatch || subjName.includes(q);

    const matchesSubj = !filterSubject || (t.subject_id === filterSubject || t.subj === filterSubject);
    const matchesPri = !filterPriority || t.priority === filterPriority;
    const matchesStatus = !filterStatus || t.status === filterStatus;

    let matchesDate = true;
    const dueTime = new Date(t.due_date || t.due);
    if (filterDate === 'today') {
      matchesDate = !isNaN(dueTime.getTime()) && dk(dueTime) === todayKey;
    } else if (filterDate === 'over') {
      matchesDate = t.status !== 'Completed' && dueTime < now;
    } else if (filterDate === 'later') {
      matchesDate = dueTime > now && dk(dueTime) !== todayKey;
    }

    return matchesSearch && matchesSubj && matchesPri && matchesStatus && matchesDate;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOrder === 'pri') {
      return PRI.indexOf(b.priority) - PRI.indexOf(a.priority);
    }
    if (sortOrder === 'new') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortOrder === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    // Default: due
    return new Date(a.due_date || a.due) - new Date(b.due_date || b.due);
  });

  const isOverdue = (t) => t.status !== 'Completed' && new Date(t.due_date || t.due) < now;
  const isDueToday = (t) => t.status !== 'Completed' && dk(new Date(t.due_date || t.due)) === todayKey;

  return (
    <div>
      {/* Control Bar */}
      <div className="row mb" style={{ justifyContent: 'space-between', gap: '10px' }}>
        <div className="row">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            aria-label="Filter by subject"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">Any Priority</option>
            {PRI.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">Any Status</option>
            {ST.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            aria-label="Filter by date"
          >
            <option value="">Any Deadline</option>
            <option value="today">Due Today</option>
            <option value="over">Overdue</option>
            <option value="later">Later</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            aria-label="Sort tasks"
          >
            <option value="due">Sort by deadline</option>
            <option value="pri">Sort by priority</option>
            <option value="new">Sort by newest</option>
            <option value="title">Sort by title</option>
          </select>
        </div>

        <div className="row">
          <button
            className="ghost"
            onClick={() => setViewMode(prev => (prev === 'list' ? 'board' : 'list'))}
          >
            {viewMode === 'list' ? 'Show Kanban Board' : 'Show List View'}
          </button>
          <button className="btn" onClick={() => onNewTask()}>
            + Add Task
          </button>
        </div>
      </div>

      {/* Task Content */}
      {viewMode === 'list' ? (
        <div className="card">
          {sortedTasks.length > 0 ? (
            sortedTasks.map(task => {
              const subj = getSubject(task.subject_id || task.subj);
              const subs = task.subtasks || task.subs || [];
              const completedSubs = subs.filter(s => s.is_completed || s.d).length;
              const isDone = task.status === 'Completed';

              return (
                <div key={task.id} className={`tr ${isDone ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`Mark task ${task.title} complete`}
                  />

                  <div className="t">
                    <b>{task.title}</b>
                    {task.sample && <span className="b" style={{ marginLeft: '6px' }}>Sample</span>}
                    <br />
                    <small className="mu">
                      {subj?.name ? (
                        <span style={{ color: subj.color, fontWeight: 600 }}>
                          {subj.name} •{' '}
                        </span>
                      ) : null}
                      {task.category} • {fD(task.due_date || task.due)} {fT(task.due_date || task.due)}
                      {subs.length > 0 && ` • ${completedSubs} of ${subs.length} subtasks`}
                    </small>
                  </div>

                  {isOverdue(task) && <span className="b od">Overdue</span>}
                  {isDueToday(task) && <span className="b High">Due today</span>}
                  <span className={`b ${task.priority}`}>{task.priority}</span>
                  <span className="b">{task.status}</span>

                  <button
                    className="ghost"
                    onClick={() => onEditTask(task)}
                    style={{ padding: '4px 10px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="ghost danger"
                    onClick={() => setDeleteTarget(task)}
                    style={{ padding: '4px 10px' }}
                    aria-label={`Delete task ${task.title}`}
                  >
                    Delete
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <p>No tasks match the active filters or search.</p>
              <button className="btn mt" onClick={() => onNewTask()}>
                Add a task
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="board">
          {ST.map(statusCol => {
            const colTasks = sortedTasks.filter(t => t.status === statusCol);
            return (
              <div key={statusCol} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="row between">
                  <h3>{statusCol}</h3>
                  <span className="b">{colTasks.length}</span>
                </div>
                {colTasks.length > 0 ? (
                  colTasks.map(task => {
                    const subj = getSubject(task.subject_id || task.subj);
                    return (
                      <div
                        key={task.id}
                        className="card"
                        style={{
                          padding: '12px',
                          background: 'var(--soft)',
                          borderLeft: `4px solid ${subj?.color || 'var(--sec)'}`
                        }}
                      >
                        <b>{task.title}</b>
                        <p className="mu" style={{ margin: '4px 0 8px', fontSize: '0.8rem' }}>
                          {subj?.name ? `${subj.name} • ` : ''}
                          {fD(task.due_date || task.due)}
                        </p>
                        <div className="row between">
                          <span className={`b ${task.priority}`}>{task.priority}</span>
                          <div className="row">
                            <button
                              className="ghost"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => toggleTask(task.id)}
                            >
                              {task.status === 'Completed' ? 'Reopen' : 'Complete'}
                            </button>
                            <button
                              className="ghost"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => onEditTask(task)}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty" style={{ padding: '16px 0' }}>No {statusCol.toLowerCase()} tasks</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteTask(deleteTarget.id)}
        title="Delete Task?"
        message={`Are you sure you want to delete “${deleteTarget?.title}”? This action cannot be undone.`}
        confirmText="Delete Task"
      />
    </div>
  );
}
