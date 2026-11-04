import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext.jsx';

const pad = (n) => String(n).padStart(2, '0');
const mmss = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const fD = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fT = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function FocusRoom() {
  const { tasks, sessions, preferences, updatePrefs, recordSession, showToast } = useData();

  // Pomodoro timer states
  const [sessionType, setSessionType] = useState('focus'); // 'focus', 'short', 'long'
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [autoStart, setAutoStart] = useState(() => preferences.auto !== false);
  const [sessionCount, setSessionCount] = useState(0);

  const endTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);

  // Stopwatch states
  const [swRunning, setSwRunning] = useState(false);
  const [swSeconds, setSwSeconds] = useState(0);
  const swIntervalRef = useRef(null);

  const getDurationSeconds = (type) => {
    if (type === 'focus') return (preferences.foc || 25) * 60;
    if (type === 'short') return (preferences.sb || 5) * 60;
    if (type === 'long') return (preferences.lb || 15) * 60;
    return 25 * 60;
  };

  // Sync timer when session type or preferences change
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(getDurationSeconds(sessionType));
    }
  }, [sessionType, preferences.foc, preferences.sb, preferences.lb, isRunning]);

  // Pomodoro countdown effect
  useEffect(() => {
    if (isRunning) {
      endTimeRef.current = Date.now() + secondsLeft * 1000;

      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          handleSessionComplete();
        }
      }, 250);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isRunning]);

  const handleSessionComplete = async () => {
    setIsRunning(false);

    if (sessionType === 'focus') {
      const minutesFocused = preferences.foc || 25;
      await recordSession({
        task_id: selectedTaskId || null,
        duration_minutes: minutesFocused,
        session_type: 'focus',
        started_at: new Date(Date.now() - minutesFocused * 60 * 1000).toISOString()
      });

      const nextCount = sessionCount + 1;
      setSessionCount(nextCount);
      const isLongBreak = nextCount % 4 === 0;
      const nextType = isLongBreak ? 'long' : 'short';

      showToast(`Focus session complete! 🎉 Time for a ${isLongBreak ? 'long' : 'short'} break.`);
      setSessionType(nextType);
      setSecondsLeft(getDurationSeconds(nextType));

      if (autoStart) {
        setIsRunning(true);
      }
    } else {
      showToast('Break over! Ready to focus again? 💪');
      setSessionType('focus');
      setSecondsLeft(getDurationSeconds('focus'));

      if (autoStart) {
        setIsRunning(true);
      }
    }
  };

  const handleStartPause = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(getDurationSeconds(sessionType));
  };

  const handleSessionTypeChange = (type) => {
    setIsRunning(false);
    setSessionType(type);
    setSecondsLeft(getDurationSeconds(type));
  };

  // Stopwatch effect
  useEffect(() => {
    if (swRunning) {
      swIntervalRef.current = setInterval(() => {
        setSwSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(swIntervalRef.current);
    }
    return () => clearInterval(swIntervalRef.current);
  }, [swRunning]);

  const handleSwReset = () => {
    setSwRunning(false);
    setSwSeconds(0);
  };

  const handleSaveStopwatch = async () => {
    if (swSeconds < 60) {
      showToast('Session too short to record (< 1 min).');
      return;
    }
    const mins = Math.round(swSeconds / 60);
    await recordSession({
      task_id: selectedTaskId || null,
      duration_minutes: mins,
      session_type: 'stopwatch',
      started_at: new Date(Date.now() - swSeconds * 1000).toISOString()
    });
    handleSwReset();
    showToast(`Saved ${mins} minutes of stopwatch focus!`);
  };

  const requestNotifications = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        showToast(perm === 'granted' ? 'Notifications enabled!' : `Notifications are ${perm}`);
      });
    } else {
      showToast('Desktop notifications are not supported in this browser.');
    }
  };

  const totalDuration = getDurationSeconds(sessionType);
  const progressRatio = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0;
  const strokeOffset = 339.3 * (1 - progressRatio);

  const swHours = pad(Math.floor(swSeconds / 3600));
  const swMinutes = pad(Math.floor((swSeconds % 3600) / 60));
  const swSecs = pad(swSeconds % 60);

  // Today's sessions
  const todayKey = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => (s.created_at || s.started_at || '').startsWith(todayKey));
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const activeTasks = tasks.filter(t => t.status !== 'Completed');

  return (
    <div>
      <div className="grid g2">
        {/* Pomodoro Timer Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          {/* Mode Switcher */}
          <div className="row" style={{ justifyContent: 'center', marginBottom: '14px' }}>
            <button
              className="ghost"
              onClick={() => handleSessionTypeChange('focus')}
              aria-pressed={sessionType === 'focus'}
              style={sessionType === 'focus' ? { background: 'var(--soft)', fontWeight: 700 } : {}}
            >
              Focus ({preferences.foc || 25}m)
            </button>
            <button
              className="ghost"
              onClick={() => handleSessionTypeChange('short')}
              aria-pressed={sessionType === 'short'}
              style={sessionType === 'short' ? { background: 'var(--soft)', fontWeight: 700 } : {}}
            >
              Short Break ({preferences.sb || 5}m)
            </button>
            <button
              className="ghost"
              onClick={() => handleSessionTypeChange('long')}
              aria-pressed={sessionType === 'long'}
              style={sessionType === 'long' ? { background: 'var(--soft)', fontWeight: 700 } : {}}
            >
              Long Break ({preferences.lb || 15}m)
            </button>
          </div>

          {/* SVG Progress Ring */}
          <div className="rw">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="rb" cx="60" cy="60" r="54" />
              <circle
                className="rf"
                cx="60"
                cy="60"
                r="54"
                style={{ strokeDashoffset: strokeOffset }}
              />
            </svg>
            <div id="tm" role="timer" aria-live="off">
              {mmss(secondsLeft)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row" style={{ justifyContent: 'center', gap: '12px', marginTop: '14px' }}>
            <button className="btn" onClick={handleStartPause} style={{ minWidth: '120px' }}>
              {isRunning ? 'Pause' : secondsLeft < totalDuration ? 'Resume' : 'Start'}
            </button>
            <button className="ghost" onClick={handleReset}>
              Reset
            </button>
          </div>

          {/* Task Link Selector */}
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <label>
              Focusing on
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
              >
                <option value="">No specific task (General study)</option>
                {activeTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="row between mt" style={{ fontSize: '0.85rem' }}>
            <label className="row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => {
                  setAutoStart(e.target.checked);
                  updatePrefs({ auto: e.target.checked });
                }}
              />
              Start breaks automatically
            </label>

            <button type="button" className="ghost" style={{ padding: '4px 10px' }} onClick={requestNotifications}>
              Enable Notifications
            </button>
          </div>
        </div>

        {/* Today's Activity & History Card */}
        <div className="card">
          <h2>Focus Activity Today</h2>
          <div className="card mt" style={{ background: 'var(--soft)', padding: '14px' }}>
            <div className="row between">
              <div>
                <b>{todaySessions.length}</b> session{todaySessions.length === 1 ? '' : 's'}
              </div>
              <div>
                <b>{todayMinutes}</b> minutes focused
              </div>
            </div>
          </div>

          <h3 className="mt">Recent Study Sessions</h3>
          {sessions.length > 0 ? (
            <div style={{ maxHeight: '360px', overflowY: 'auto', marginTop: '8px' }}>
              {sessions.slice(0, 8).map(s => (
                <div key={s.id} className="tr">
                  <span className="t">
                    <b>{s.duration_minutes} min</b> • {s.task?.title || 'General Focus'}
                    <br />
                    <small className="mu">
                      {fD(s.created_at || s.started_at)} {fT(s.created_at || s.started_at)}
                    </small>
                  </span>
                  <span className="b">{s.session_type || 'focus'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>No focus sessions logged yet. Press Start to begin your first session!</p>
            </div>
          )}
        </div>
      </div>

      {/* Stopwatch Card */}
      <div className="card mt" style={{ textAlign: 'center' }}>
        <h2>Open-Ended Stopwatch</h2>
        <p className="mu">Count up when you want to study without a rigid countdown.</p>
        <p className="swt" style={{ margin: '14px 0', fontSize: '2.8rem' }}>
          {swHours}:{swMinutes}:{swSecs}
        </p>

        <div className="row" style={{ justifyContent: 'center', gap: '10px' }}>
          <button
            className="btn"
            onClick={() => setSwRunning(r => !r)}
            style={{ minWidth: '100px' }}
          >
            {swRunning ? 'Pause' : swSeconds > 0 ? 'Resume' : 'Start'}
          </button>
          <button className="ghost" onClick={handleSwReset}>
            Reset
          </button>
          {swSeconds >= 60 && (
            <button className="ghost" onClick={handleSaveStopwatch}>
              Save to Study History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
