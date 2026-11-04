import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.js';

export function AuthCallback() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Verifying your session...');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[Auth Callback] Error:', error);
        setStatusMessage('Authentication verification encountered an error. Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 2500);
      } else if (session) {
        setStatusMessage('Authentication successful! Welcome to Deadline Dost...');
        setTimeout(() => navigate('/'), 800);
      } else {
        setTimeout(() => navigate('/'), 1200);
      }
    });
  }, [navigate]);

  return (
    <div style={{ maxWidth: '440px', margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="card" style={{ padding: '36px' }}>
        <div className="logo" style={{ margin: '0 auto 16px', width: '48px', height: '48px', fontSize: '1.4rem' }}>
          ✓
        </div>
        <h2>{statusMessage}</h2>
        <p className="mu mt">Synchronizing your academic workspace...</p>
      </div>
    </div>
  );
}
