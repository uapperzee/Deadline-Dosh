import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext.jsx';

export function QuickNotes() {
  const { note, saveNote } = useData();

  const [title, setTitle] = useState(() => note?.title || 'Quick note');
  const [body, setBody] = useState(() => note?.body || '');
  const [status, setStatus] = useState('Saved');

  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || 'Quick note');
      setBody(note.body || '');
    }
  }, [note]);

  const handleTitleChange = (val) => {
    setTitle(val);
    setStatus('Saving...');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNote(val, body);
      setStatus('Saved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  const handleBodyChange = (val) => {
    setBody(val);
    setStatus('Saving...');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNote(title, val);
      setStatus('Saved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="card notes">
      <div className="row between">
        <input
          className="nt"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          maxLength={60}
          aria-label="Note title"
          placeholder="Note title"
        />
        <span className="mu" id="ns">
          {status}
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => handleBodyChange(e.target.value)}
        rows={16}
        placeholder="Write your study notes, formulas, lecture reminders, or thoughts here. They save as you type."
        aria-label="Note text"
      />

      <div className="row between mt">
        <p className="mu" style={{ margin: 0 }}>
          <span id="nw">{wordCount}</span> words • {body.length} characters
        </p>
        <span className="mu" style={{ fontSize: '0.8rem' }}>
          ☁️ Automatically saved to your account
        </span>
      </div>
    </div>
  );
}
