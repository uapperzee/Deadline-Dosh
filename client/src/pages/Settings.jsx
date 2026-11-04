import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

export function Settings() {
  const { theme, setTheme, reduceMotion, setReduceMotion, themes } = useTheme();
  const { user } = useAuth();
  const { preferences, updatePrefs, showToast } = useData();

  const [name, setName] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(() => preferences.weekly || 10);
  const [focMins, setFocMins] = useState(() => preferences.foc || 25);
  const [shortBreak, setShortBreak] = useState(() => preferences.sb || 5);
  const [longBreak, setLongBreak] = useState(() => preferences.lb || 15);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSavePrefs = (e) => {
    e.preventDefault();
    updatePrefs({
      weekly: parseFloat(weeklyTarget) || 10,
      foc: parseInt(focMins, 10) || 25,
      sb: parseInt(shortBreak, 10) || 5,
      lb: parseInt(longBreak, 10) || 15
    });
    showToast('Preferences saved successfully!');
  };

  const handleResetAll = () => {
    localStorage.removeItem('dd_data');
    localStorage.removeItem('dd_prefs');
    showToast('Local application storage reset. Reloading...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="grid g2">
      {/* Appearance Section */}
      <div className="card">
        <h2>Appearance</h2>
        <p className="mu" style={{ margin: '4px 0 14px' }}>
          Deadline Dost comes in two themes. Pick the one that suits your room and your eyes.
        </p>

        <fieldset style={{ border: 0, padding: 0, margin: '10px 0' }}>
          <legend className="mu" style={{ fontWeight: 600, marginBottom: '8px' }}>
            Theme
          </legend>
          <div className="theme-choices">
            {themes.map((t) => (
              <label key={t.id} className="theme-opt" data-preview={t.id}>
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={theme === t.id}
                  onChange={() => setTheme(t.id)}
                />
                <span className="theme-swatch" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <b>{t.name}</b>
                <small>{t.blurb}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="row mt" style={{ cursor: 'pointer', flexWrap: 'nowrap' }}>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
          />
          Reduce motion & disable complex transitions
        </label>
      </div>

      {/* Live Preview Card */}
      <div className="card">
        <h2>Live Preview</h2>
        <p className="mu" style={{ margin: '4px 0 14px' }}>
          How cards, badges and buttons look in the active theme.
        </p>

        <div className="card inset mt">
          <h3>Linked List & Binary Tree Assignment</h3>
          <p className="mu" style={{ margin: '4px 0 8px' }}>
            Due Tomorrow • Data Structures
          </p>
          <div className="pb mb">
            <i style={{ width: '68%' }} />
          </div>
          <div className="row mt">
            <span className="b Urgent">Urgent</span>
            <span className="b High">High</span>
            <span className="b Completed">Completed</span>
            <button className="btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
              Primary Button
            </button>
            <button className="ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
              Secondary Button
            </button>
          </div>
        </div>
      </div>

      {/* Study & Focus Preferences */}
      <div className="card" style={{ display: 'grid', gap: '12px' }}>
        <h2>Study & Focus Timer Preferences</h2>
        <form onSubmit={handleSavePrefs} style={{ display: 'grid', gap: '12px' }}>
          <label>
            Weekly Study Target (Hours)
            <input
              type="number"
              min={1}
              max={80}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(e.target.value)}
            />
          </label>

          <label>
            Focus Session Duration (Minutes)
            <input
              type="number"
              min={1}
              max={120}
              value={focMins}
              onChange={(e) => setFocMins(e.target.value)}
            />
          </label>

          <label>
            Short Break Duration (Minutes)
            <input
              type="number"
              min={1}
              max={60}
              value={shortBreak}
              onChange={(e) => setShortBreak(e.target.value)}
            />
          </label>

          <label>
            Long Break Duration (Minutes)
            <input
              type="number"
              min={1}
              max={90}
              value={longBreak}
              onChange={(e) => setLongBreak(e.target.value)}
            />
          </label>

          <button type="submit" className="btn mt">
            Save Preferences
          </button>
        </form>
      </div>

      {/* Data Management */}
      <div className="card" style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
        <h2>Cloud Sync & Local Cache</h2>
        <p className="mu" style={{ lineHeight: 1.6 }}>
          {user ? (
            <>
              ✅ <b>Signed in as {user.email}</b>.<br />
              All your tasks, subjects, sessions, timetable, and notes are synced to your cloud database automatically.
            </>
          ) : (
            <>
              ℹ️ <b>Operating in Local Demo Mode</b>.<br />
              Data is saved in this browser. Create an account to access your productivity platform from any phone or laptop.
            </>
          )}
        </p>

        <button
          className="ghost danger"
          onClick={() => setShowResetConfirm(true)}
        >
          Reset Local Browser Cache
        </button>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetAll}
        title="Reset Local Browser Data?"
        message="This erases local demo data saved in this browser's localStorage. If you have cloud-synced records, your account remains safe."
        confirmText="Reset Local Cache"
      />
    </div>
  );
}
