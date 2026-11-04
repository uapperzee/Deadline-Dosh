import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { api } from '../services/api.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, session } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [note, setNote] = useState({ title: 'Quick note', body: '' });
  const [achievements, setAchievements] = useState([]);
  const [profileStats, setProfileStats] = useState(null);
  const [preferences, setPreferences] = useState({
    foc: 25,
    sb: 5,
    lb: 15,
    weekly: 10,
    auto: true
  });

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2800);
  }, []);

  // Fetch all cloud data for authenticated user
  const loadCloudData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        tasksRes,
        subjRes,
        sessRes,
        ttRes,
        noteRes,
        achRes,
        profRes,
        prefRes
      ] = await Promise.allSettled([
        api.get('/api/tasks'),
        api.get('/api/subjects'),
        api.get('/api/sessions'),
        api.get('/api/timetable'),
        api.get('/api/notes'),
        api.get('/api/achievements'),
        api.get('/api/profile'),
        api.get('/api/profile/preferences')
      ]);

      if (tasksRes.status === 'fulfilled' && tasksRes.value.success) {
        setTasks(tasksRes.value.data || []);
      }
      if (subjRes.status === 'fulfilled' && subjRes.value.success) {
        setSubjects(subjRes.value.data || []);
      }
      if (sessRes.status === 'fulfilled' && sessRes.value.success) {
        setSessions(sessRes.value.data || []);
      }
      if (ttRes.status === 'fulfilled' && ttRes.value.success) {
        setTimetable(ttRes.value.data.map || {});
      }
      if (noteRes.status === 'fulfilled' && noteRes.value.success) {
        setNote(noteRes.value.data || { title: 'Quick note', body: '' });
      }
      if (achRes.status === 'fulfilled' && achRes.value.success) {
        setAchievements(achRes.value.data.badges || []);
      }
      if (profRes.status === 'fulfilled' && profRes.value.success) {
        setProfileStats(profRes.value.data.stats || null);
      }
      if (prefRes.status === 'fulfilled' && prefRes.value.success && prefRes.value.data) {
        const p = prefRes.value.data;
        setPreferences({
          foc: p.focus_minutes || 25,
          sb: p.short_break_minutes || 5,
          lb: p.long_break_minutes || 15,
          weekly: parseFloat(p.weekly_target_hours || 10),
          auto: p.auto_start_breaks !== false
        });
      }
    } catch (err) {
      console.error('[DataContext] Error loading cloud data:', err);
      showToast('Could not sync some cloud data. Working in offline mode.');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  // Fallback demo local loader when not logged in
  const loadDemoData = useCallback(() => {
    try {
      const raw = localStorage.getItem('dd_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        setTasks(parsed.tasks || []);
        setSubjects(parsed.subjects || []);
        setSessions(parsed.sessions || []);
        setTimetable(parsed.tt || {});
        setNote(parsed.note || { title: 'Quick note', body: '' });
        if (parsed.prefs) {
          setPreferences(prev => ({ ...prev, ...parsed.prefs }));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadCloudData();
    } else {
      loadDemoData();
    }
  }, [user, loadCloudData, loadDemoData]);

  // ================= TASK ACTIONS =================
  const createTask = async (taskData) => {
    if (user) {
      const res = await api.post('/api/tasks', taskData);
      if (res.success && res.data) {
        setTasks(prev => [res.data, ...prev]);
        showToast('Task added to cloud');
        return res.data;
      }
    } else {
      const newTask = {
        id: 't_' + Math.random().toString(36).substring(2, 9),
        ...taskData,
        created_at: new Date().toISOString(),
        done_at: taskData.status === 'Completed' ? new Date().toISOString() : null,
        subtasks: taskData.subtasks || []
      };
      setTasks(prev => [newTask, ...prev]);
      showToast('Task added (Local demo)');
      return newTask;
    }
  };

  const updateTask = async (id, updates) => {
    if (user) {
      const res = await api.patch(`/api/tasks/${id}`, updates);
      if (res.success && res.data) {
        setTasks(prev => prev.map(t => (t.id === id ? res.data : t)));
        showToast('Changes saved to cloud');
        return res.data;
      }
    } else {
      setTasks(prev =>
        prev.map(t => {
          if (t.id !== id) return t;
          const isDone = updates.status === 'Completed';
          return {
            ...t,
            ...updates,
            done_at: isDone ? new Date().toISOString() : updates.status ? null : t.done_at
          };
        })
      );
      showToast('Changes saved (Local)');
    }
  };

  const toggleTask = async (id) => {
    if (user) {
      const res = await api.patch(`/api/tasks/${id}/toggle`);
      if (res.success && res.data) {
        setTasks(prev => prev.map(t => (t.id === id ? res.data : t)));
        showToast(res.data.status === 'Completed' ? 'Task completed! ✨' : 'Task reopened');
        // Refresh achievements and stats
        api.get('/api/achievements').then(r => r.success && setAchievements(r.data.badges));
      }
    } else {
      setTasks(prev =>
        prev.map(t => {
          if (t.id !== id) return t;
          const nextStatus = t.status === 'Completed' ? 'To Do' : 'Completed';
          return {
            ...t,
            status: nextStatus,
            done_at: nextStatus === 'Completed' ? new Date().toISOString() : null
          };
        })
      );
      showToast('Task status updated');
    }
  };

  const deleteTask = async (id) => {
    if (user) {
      const res = await api.delete(`/api/tasks/${id}`);
      if (res.success) {
        setTasks(prev => prev.filter(t => t.id !== id));
        showToast('Task deleted from cloud');
      }
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
      showToast('Task deleted');
    }
  };

  // ================= SUBJECT ACTIONS =================
  const createSubject = async (subjData) => {
    if (user) {
      const res = await api.post('/api/subjects', subjData);
      if (res.success && res.data) {
        setSubjects(prev => [...prev, { ...res.data, total_tasks: 0, completed_tasks: 0, study_hours: 0 }]);
        showToast('Subject created in cloud');
        return res.data;
      }
    } else {
      const newSubj = {
        id: 's_' + Math.random().toString(36).substring(2, 9),
        ...subjData,
        is_archived: false,
        total_tasks: 0,
        completed_tasks: 0,
        study_hours: 0
      };
      setSubjects(prev => [...prev, newSubj]);
      showToast('Subject created');
      return newSubj;
    }
  };

  const updateSubject = async (id, updates) => {
    if (user) {
      const res = await api.patch(`/api/subjects/${id}`, updates);
      if (res.success && res.data) {
        setSubjects(prev => prev.map(s => (s.id === id ? { ...s, ...res.data } : s)));
        showToast('Subject updated');
      }
    } else {
      setSubjects(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
      showToast('Subject updated');
    }
  };

  const archiveSubject = async (id) => {
    if (user) {
      const res = await api.patch(`/api/subjects/${id}/archive`);
      if (res.success && res.data) {
        setSubjects(prev => prev.map(s => (s.id === id ? { ...s, is_archived: res.data.is_archived } : s)));
        showToast(res.data.is_archived ? 'Subject archived' : 'Subject restored');
      }
    } else {
      setSubjects(prev =>
        prev.map(s => (s.id === id ? { ...s, is_archived: !s.is_archived } : s))
      );
      showToast('Subject archive toggled');
    }
  };

  const deleteSubject = async (id) => {
    if (user) {
      try {
        const res = await api.delete(`/api/subjects/${id}`);
        if (res.success) {
          setSubjects(prev => prev.filter(s => s.id !== id));
          showToast('Subject deleted');
        }
      } catch (err) {
        showToast(err.message || 'Cannot delete subject linked to tasks.');
      }
    } else {
      setSubjects(prev => prev.filter(s => s.id !== id));
      showToast('Subject deleted');
    }
  };

  // ================= FOCUS SESSION ACTIONS =================
  const recordSession = async (sessData) => {
    if (user) {
      const res = await api.post('/api/sessions', sessData);
      if (res.success && res.data) {
        setSessions(prev => [res.data, ...prev]);
        showToast('Focus session saved to cloud!');
        // Update achievements in background
        api.get('/api/achievements').then(r => r.success && setAchievements(r.data.badges));
      }
    } else {
      const newSess = {
        id: 'sess_' + Math.random().toString(36).substring(2, 9),
        ...sessData,
        created_at: new Date().toISOString()
      };
      setSessions(prev => [newSess, ...prev]);
      showToast('Focus session logged');
    }
  };

  // ================= TIMETABLE ACTIONS =================
  const updateTimetableSlot = async (slot_row, day_col, content) => {
    setTimetable(prev => ({
      ...prev,
      [`${slot_row}_${day_col}`]: content
    }));

    if (user) {
      try {
        await api.post('/api/timetable/slot', { slot_row, day_col, content });
      } catch (err) {
        console.warn('[Timetable] Error updating slot:', err.message);
      }
    }
  };

  const clearTimetable = async () => {
    if (user) {
      await api.delete('/api/timetable');
    }
    setTimetable({});
    showToast('Timetable cleared');
  };

  // ================= QUICK NOTE ACTIONS =================
  const saveNote = async (title, body) => {
    setNote({ title, body });
    if (user) {
      try {
        await api.put('/api/notes', { title, body });
      } catch (err) {
        console.warn('[Notes] Error saving note:', err.message);
      }
    }
  };

  // ================= PREFERENCES =================
  const updatePrefs = async (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
    if (user) {
      try {
        await api.put('/api/profile/preferences', {
          focus_minutes: newPrefs.foc,
          short_break_minutes: newPrefs.sb,
          long_break_minutes: newPrefs.lb,
          weekly_target_hours: newPrefs.weekly,
          auto_start_breaks: newPrefs.auto
        });
        showToast('Preferences saved');
      } catch (err) {
        console.warn('[Prefs] Error saving preferences:', err.message);
      }
    }
  };

  const value = {
    tasks,
    subjects,
    sessions,
    timetable,
    note,
    achievements,
    profileStats,
    preferences,
    loading,
    toastMessage,
    toastVisible,
    showToast,
    refreshAll: loadCloudData,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    createSubject,
    updateSubject,
    archiveSubject,
    deleteSubject,
    recordSession,
    updateTimetableSlot,
    clearTimetable,
    saveNote,
    updatePrefs
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
