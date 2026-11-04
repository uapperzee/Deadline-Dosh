import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/*
  Deadline Dost ships with exactly two themes:
    - "light" → Mint Glass   (soft mint-white surfaces, emerald accents)
    - "dark"  → Forest Glass (deep forest-green surfaces, mint accents)
  All colours live in styles/main.css under [data-theme="light"] / [data-theme="dark"].
*/
export const THEMES = [
  { id: 'light', name: 'Mint Light', blurb: 'Soft mint-white glass with emerald accents.' },
  { id: 'dark', name: 'Forest Dark', blurb: 'Deep forest green with glowing mint accents.' }
];

const ThemeContext = createContext(null);

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const readTheme = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('dd_theme'));
    if (saved?.m === 'light' || saved?.m === 'dark') return saved.m;
  } catch {
    /* ignore */
  }
  return systemTheme(); // first visit (or legacy "system" value) follows the OS
};

const readReduceMotion = () => {
  try {
    return !!JSON.parse(localStorage.getItem('dd_motion'))?.rm;
  } catch {
    return false;
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);
  const [reduceMotion, setReduceMotion] = useState(readReduceMotion);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem('dd_theme', JSON.stringify({ m: theme }));
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('rm', reduceMotion);
    try {
      localStorage.setItem('dd_motion', JSON.stringify({ rm: reduceMotion }));
    } catch {
      /* ignore */
    }
  }, [reduceMotion]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);

  const value = { theme, setTheme, toggleTheme, reduceMotion, setReduceMotion, themes: THEMES };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
