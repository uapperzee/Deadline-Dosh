import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

export function Subjects({ onEditSubject, onNewSubject }) {
  const { subjects, tasks, archiveSubject, deleteSubject } = useData();

  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div>
      <div className="row end mb">
        <button className="btn" onClick={() => onNewSubject()}>
          + Add Subject
        </button>
      </div>

      <div className="grid g2">
        {subjects.map(subj => {
          const subjTasks = tasks.filter(t => t.subject_id === subj.id || t.subj === subj.id);
          const completedCount = subjTasks.filter(t => t.status === 'Completed').length;
          const upcomingExams = subjTasks.filter(
            t => t.category === 'Exam' && t.status !== 'Completed' && new Date(t.due_date || t.due) > new Date()
          ).length;
          const percent = subjTasks.length ? Math.round((completedCount / subjTasks.length) * 100) : 0;

          return (
            <div
              key={subj.id}
              className="card"
              style={{
                borderTop: `6px solid ${subj.color || 'var(--sec)'}`,
                opacity: subj.is_archived ? 0.65 : 1
              }}
            >
              <div className="row between">
                <h2>{subj.name}</h2>
                <div className="row">
                  {subj.sample && <span className="b">Sample</span>}
                  {subj.is_archived && <span className="b">Archived</span>}
                </div>
              </div>

              <p className="mu" style={{ margin: '4px 0 12px' }}>
                {subj.code ? `${subj.code} • ` : ''}
                {subj.semester || 'Current Semester'}
                {subj.teacher ? ` • ${subj.teacher}` : ''}
                {subj.target_grade ? ` • Target: ${subj.target_grade}` : ''}
              </p>

              {/* Progress bar */}
              <div className="pb">
                <i style={{ width: `${percent}%`, background: subj.color || 'var(--sec)' }} />
              </div>

              <p className="mu" style={{ margin: '8px 0 12px', fontSize: '0.85rem' }}>
                <b>{subjTasks.length}</b> tasks ({percent}% complete) • <b>{upcomingExams}</b> upcoming exam{upcomingExams === 1 ? '' : 's'} • <b>{subj.study_hours || 0} h</b> studied
              </p>

              {subj.notes && (
                <div style={{ background: 'var(--soft)', padding: '8px 12px', borderRadius: '8px', margin: '10px 0', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {subj.notes}
                </div>
              )}

              <div className="row mt">
                <button
                  className="ghost"
                  onClick={() => onEditSubject(subj)}
                >
                  Edit
                </button>

                <button
                  className="ghost"
                  onClick={() => archiveSubject(subj.id)}
                >
                  {subj.is_archived ? 'Restore' : 'Archive'}
                </button>

                {subjTasks.length === 0 ? (
                  <button
                    className="ghost danger"
                    onClick={() => setDeleteTarget(subj)}
                  >
                    Delete
                  </button>
                ) : (
                  <span className="mu" style={{ fontSize: '0.75rem', alignSelf: 'center' }}>
                    (Has {subjTasks.length} tasks; archive to preserve records)
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {subjects.length === 0 && (
          <div className="card empty" style={{ gridColumn: '1 / -1' }}>
            <p>No academic subjects added yet.</p>
            <button className="btn mt" onClick={() => onNewSubject()}>
              Add your first subject
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteSubject(deleteTarget.id)}
        title="Delete Subject?"
        message={`Are you sure you want to delete “${deleteTarget?.name}”? This subject has no tasks.`}
        confirmText="Delete Subject"
      />
    </div>
  );
}
