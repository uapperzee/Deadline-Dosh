import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { useData } from '../context/DataContext.jsx';

const DEFAULT_COLORS = ['#2FA879', '#5FB6A5', '#6FA8DC', '#9B8FD6', '#E0A458', '#E27D7D', '#8BC34A'];

export function SubjectModal({ isOpen, onClose, subjectToEdit }) {
  const { createSubject, updateSubject } = useData();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [teacher, setTeacher] = useState('');
  const [semester, setSemester] = useState('');
  const [targetGrade, setTargetGrade] = useState('');
  const [color, setColor] = useState('#2FA879');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name || '');
      setCode(subjectToEdit.code || '');
      setTeacher(subjectToEdit.teacher || '');
      setSemester(subjectToEdit.semester || '');
      setTargetGrade(subjectToEdit.target_grade || subjectToEdit.target || '');
      setColor(subjectToEdit.color || '#2FA879');
      setNotes(subjectToEdit.notes || '');
    } else {
      setName('');
      setCode('');
      setTeacher('');
      setSemester('Semester 3');
      setTargetGrade('A');
      setColor('#2FA879');
      setNotes('');
    }
    setError('');
  }, [subjectToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        teacher: teacher.trim(),
        semester: semester.trim(),
        target_grade: targetGrade.trim(),
        color,
        notes: notes.trim()
      };

      if (subjectToEdit) {
        await updateSubject(subjectToEdit.id, payload);
      } else {
        await createSubject(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subjectToEdit ? 'Edit Subject' : 'New Subject'}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <label>
          Subject Name *
          <input
            type="text"
            required
            maxLength={60}
            placeholder="e.g. Data Structures & Algorithms"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="grid g2" style={{ margin: 0 }}>
          <label>
            Course Code
            <input
              type="text"
              maxLength={30}
              placeholder="e.g. CS201"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>

          <label>
            Instructor / Teacher
            <input
              type="text"
              maxLength={60}
              placeholder="e.g. Prof. Sharma"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
            />
          </label>

          <label>
            Semester
            <input
              type="text"
              maxLength={40}
              placeholder="e.g. Semester 3"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </label>

          <label>
            Target Grade
            <input
              type="text"
              maxLength={20}
              placeholder="e.g. A+"
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
            />
          </label>
        </div>

        <div>
          <span className="mu" style={{ fontWeight: 600 }}>Theme Color</span>
          <div className="row mt" style={{ gap: '10px' }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '48px', height: '40px', padding: '2px', cursor: 'pointer' }}
            />
            {DEFAULT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '3px solid var(--tx)' : '1px solid var(--bd)',
                  cursor: 'pointer'
                }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <label>
          Syllabus Notes & Resources
          <textarea
            rows={3}
            placeholder="Key syllabus topics, textbook references, drive links..."
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
            {saving ? 'Saving...' : subjectToEdit ? 'Save Changes' : 'Add Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
