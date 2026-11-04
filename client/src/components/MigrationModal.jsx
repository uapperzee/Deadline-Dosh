import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { api } from '../services/api.js';

export function MigrationModal() {
  const { showMigrationModal, dismissMigration } = useAuth();
  const { refreshAll, showToast } = useData();

  const [localSummary, setLocalSummary] = useState({
    tasks: 0,
    subjects: 0,
    sessions: 0,
    timetable: 0
  });
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showMigrationModal) {
      try {
        const raw = localStorage.getItem('dd_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          const ttCount = parsed.tt ? Object.values(parsed.tt).filter(Boolean).length : 0;
          setLocalSummary({
            tasks: parsed.tasks?.length || 0,
            subjects: parsed.subjects?.length || 0,
            sessions: parsed.sessions?.length || 0,
            timetable: ttCount
          });
        }
      } catch {
        // ignore
      }
    }
  }, [showMigrationModal]);

  if (!showMigrationModal) return null;

  const handleImport = async () => {
    setMigrating(true);
    setError('');
    try {
      const raw = localStorage.getItem('dd_data');
      if (!raw) {
        dismissMigration();
        return;
      }
      const parsed = JSON.parse(raw);

      const res = await api.post('/api/migrate', {
        tasks: parsed.tasks || [],
        subjects: parsed.subjects || [],
        sessions: parsed.sessions || [],
        timetable: parsed.tt || {},
        note: parsed.note || null,
        preferences: parsed.prefs || null
      });

      if (res.success) {
        setResult(res.summary);
        await refreshAll();
        showToast('Local browser data successfully imported to your cloud account! 🚀');
        dismissMigration(true); // Marks as migrated, preserves local backup in localStorage
      } else {
        throw new Error(res.error || 'Migration failed');
      }
    } catch (err) {
      console.error('[Migration] Failed:', err);
      setError(err.message || 'Could not migrate local records.');
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    dismissMigration(false);
  };

  return (
    <Modal
      isOpen={showMigrationModal}
      onClose={handleSkip}
      title="Import Your Existing Local Data to Cloud"
      maxWidth="540px"
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          We detected existing Deadline Dost records saved in your browser from demo mode.
          Would you like to import them into your authenticated cloud account so you can access them from any device?
        </p>

        <div className="card" style={{ background: 'var(--soft)', padding: '14px' }}>
          <h3 style={{ marginBottom: '8px' }}>Detected Local Records:</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
            <li><b>{localSummary.tasks}</b> Tasks & Subtasks</li>
            <li><b>{localSummary.subjects}</b> Academic Subjects</li>
            <li><b>{localSummary.sessions}</b> Focus Sessions</li>
            <li><b>{localSummary.timetable}</b> Timetable Slots</li>
          </ul>
        </div>

        <p className="mu" style={{ margin: 0, fontSize: '0.8rem' }}>
          🔒 Safe import guarantee: Your original local records will be preserved. Data will only be linked to your private user account with PostgreSQL Row Level Security (RLS).
        </p>

        {error && <p className="err">{error}</p>}

        <div className="row end mt">
          <button type="button" className="ghost" onClick={handleSkip} disabled={migrating}>
            Keep Separate / Skip
          </button>
          <button type="button" className="btn" onClick={handleImport} disabled={migrating}>
            {migrating ? 'Importing Data...' : 'Import to My Account'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
