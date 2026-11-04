import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function Header({ title, onNewTask, searchQuery, onSearchChange }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();

  // Keyboard shortcut listener: N for new task, / for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewTask();
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('gs');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewTask]);

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Student';
  const initial = (displayName[0] || 'S').toUpperCase();

  return (
    <header className="top">
      <h1>{title}</h1>

      <input
        id="gs"
        type="search"
        placeholder="Search tasks ( / )"
        aria-label="Search tasks"
        value={searchQuery || ''}
        onChange={(e) => onSearchChange?.(e.target.value)}
      />

      <button className="btn" onClick={() => onNewTask()} title="Shortcut: N">
        + Quick add
      </button>

      <button
        className="ghost theme-toggle"
        id="thm"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Switch to Forest Dark theme' : 'Switch to Mint Light theme'}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        {theme === 'light' ? (
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        ) : (
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        )}
        <span className="lb">{theme === 'light' ? 'Light' : 'Dark'}</span>
      </button>

      {user ? (
        <button
          className="ghost me"
          onClick={() => navigate('/profile')}
          title="Go to My Profile"
          style={{ padding: '4px 8px', borderRadius: '12px' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="av" />
          ) : (
            <span className="av">{initial}</span>
          )}
          <span className="lb" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {displayName.split(' ')[0]}
          </span>
        </button>
      ) : (
        <button
          className="btn"
          style={{ background: 'var(--sec)', padding: '6px 14px', fontSize: '0.85rem' }}
          onClick={() => navigate('/signin')}
        >
          Sign In
        </button>
      )}
    </header>
  );
}
