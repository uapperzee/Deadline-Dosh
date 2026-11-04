import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ICONS = {
  dash: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  task: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  cal: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  time: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M9 4v18M15 4v18" />
    </svg>
  ),
  book: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  timer: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M9 2h6" />
    </svg>
  ),
  note: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </svg>
  ),
  bot: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4M9 13h.01M15 13h.01M9 17h6" />
    </svg>
  ),
  folder: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  ),
  chart: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />
    </svg>
  ),
  award: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" />
    </svg>
  ),
  user: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  sliders: (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" />
    </svg>
  )
};

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'dash' },
  { path: '/tasks', label: 'My Tasks', icon: 'task' },
  { path: '/calendar', label: 'Calendar', icon: 'cal' },
  { path: '/timetable', label: 'Timetable', icon: 'time' },
  { path: '/planner', label: 'Study Planner', icon: 'book' },
  { path: '/focus', label: 'Focus Room', icon: 'timer' },
  { path: '/notes', label: 'Quick Notes', icon: 'note' },
  { path: '/assistant', label: 'Study Assistant', icon: 'bot' },
  { path: '/subjects', label: 'Subjects', icon: 'folder' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
  { path: '/achievements', label: 'Achievements', icon: 'award' },
  { path: '/profile', label: 'My Profile', icon: 'user' },
  { path: '/settings', label: 'Settings', icon: 'sliders' }
];

export function Sidebar() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mini, setMini] = useState(false);

  const toggleMini = () => {
    document.body.classList.toggle('mini');
    setMini(prev => !prev);
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Student';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initial = (displayName[0] || 'S').toUpperCase();

  return (
    <aside className="side">
      <NavLink to="/" className="brand">
        <span className="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
        <span className="lb">Deadline Dost</span>
      </NavLink>

      <div className="navw">
        <nav id="nav" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
              title={item.label}
            >
              {ICONS[item.icon]}
              <span className="lb">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="foot">
        <button
          className="ghost"
          onClick={toggleMini}
          aria-label="Collapse or expand sidebar"
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <span>⇔</span> <span className="lb">{mini ? 'Expand' : 'Collapse'}</span>
        </button>

        <span className="kb" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
          Shortcuts: <b>N</b> new task, <b>/</b> search
        </span>

        {user ? (
          <button
            className="ghost me"
            onClick={() => navigate('/profile')}
            style={{ padding: '6px 8px' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="av" />
            ) : (
              <span className="av">{initial}</span>
            )}
            <div className="me-text">
              <b style={{ fontSize: '0.85rem' }}>{displayName}</b>
              <br />
              <small style={{ color: 'var(--ok)', fontWeight: 600 }}>☁️ Cloud Sync Active</small>
            </div>
          </button>
        ) : (
          <button
            className="ghost me"
            onClick={() => navigate('/signin')}
            style={{ padding: '6px 8px' }}
          >
            <span className="av">?</span>
            <div className="me-text">
              <b style={{ fontSize: '0.85rem' }}>Local Demo Mode</b>
              <br />
              <small style={{ color: 'var(--warn)' }}>Sign in to sync</small>
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
