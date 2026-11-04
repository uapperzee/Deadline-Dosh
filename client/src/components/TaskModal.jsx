import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { useData } from '../context/DataContext.jsx';

const CATS = ['Assignment', 'Exam', 'Lecture', 'Study', 'Reminder'];
const PRI = ['Low', 'Medium', 'High', 'Urgent'];
const ST = ['To Do', 'In Progress', 'Completed'];

const pad = (n) => String(n).padStart(2, '0');
const toDateTimeLocal = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date(Date.now() + 86400000);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function TaskModal({ isOpen, onClose, taskToEdit, initialDate }) {
  const { subjects, createTask, updateTask } = useData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState('Assignment');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setSubjectId(taskToEdit.subject_id || '');
      setCategory(taskToEdit.category || 'Assignment');
      setDueDate(toDateTimeLocal(taskToEdit.due_date || taskToEdit.due));
      setPriority(taskToEdit.priority || 'Medium');
      setStatus(taskToEdit.status || 'To Do');
      setEstimatedMinutes(taskToEdit.estimated_minutes || taskToEdit.est || 60);
      setNotes(taskToEdit.notes || '');
      setSubtasks(
        (taskToEdit.subtasks || taskToEdit.subs || []).map(s => ({
          title: s.title || s.t || '',
          is_completed: !!(s.is_completed || s.d)
        }))
      );
    } else {
      setTitle('');
      setDescription('');
      setSubjectId('');
      setCategory('Assignment');
      setDueDate(initialDate ? `${initialDate}T09:00` : toDateTimeLocal());
      setPriority('Medium');
      setStatus('To Do');
      setEstimatedMinutes(60);
      setNotes('');
      setSubtasks([]);
    }
    setError('');
  }, [taskToEdit, initialDate, isOpen]);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, { title: newSubtaskTitle.trim(), is_completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleSubtask = (index) => {
    setSubtasks(prev =>
      prev.map((st, i) => (i === index ? { ...st, is_completed: !st.is_completed } : st))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }
    if (!dueDate) {
      setError('Please choose a valid deadline date and time.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        subject_id: subjectId || null,
        category,
        due_date: new Date(dueDate).toISOString(),
        priority,
        status,
        estimated_minutes: parseInt(estimatedMinutes, 10) || 60,
        notes: notes.trim(),
        subtasks
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, payload);
      } else {
        await createTask(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'New Task'}
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <label>
          Title *
          <input
            type="text"
            required
            maxLength={120}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label>
          Description
          <textarea
            rows={2}
            placeholder="Add relevant instructions, links, or notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="grid g2" style={{ margin: 0 }}>
          <label>
            Subject
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">No subject (General)</option>
              {subjects
                .filter(s => !s.is_archived || s.id === subjectId)
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATS.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label>
            Due Date & Time *
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          <label>
            Estimated Minutes
            <input
              type="number"
              min={5}
              max={1440}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </label>

          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRI.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {ST.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Subtasks Section */}
        <div style={{ marginTop: '4px' }}>
          <span className="mu" style={{ fontWeight: 600 }}>Subtasks ({subtasks.length})</span>
          <div style={{ display: 'grid', gap: '6px', marginTop: '6px' }}>
            {subtasks.map((st, idx) => (
              <div key={idx} className="row" style={{ background: 'var(--soft)', padding: '6px 10px', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  checked={st.is_completed}
                  onChange={() => handleToggleSubtask(idx)}
                  aria-label="Mark subtask completed"
                />
                <span style={{ flex: 1, textDecoration: st.is_completed ? 'line-through' : 'none', opacity: st.is_completed ? 0.7 : 1 }}>
                  {st.title}
                </span>
                <button
                  type="button"
                  className="ghost"
                  style={{ padding: '2px 8px', minWidth: 'auto' }}
                  onClick={() => handleRemoveSubtask(idx)}
                  aria-label="Remove subtask"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="row mt">
            <input
              type="text"
              placeholder="Add a subtask step..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask(e);
                }
              }}
              style={{ flex: 1 }}
            />
            <button type="button" className="ghost" onClick={handleAddSubtask}>
              + Add step
            </button>
          </div>
        </div>

        <label>
          Notes & Reflection
          <textarea
            rows={2}
            placeholder="Key reminders or post-task learnings..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {error && <p className="err" role="alert">{error}</p>}

        <div className="row end mt">
          <button type="button" className="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
