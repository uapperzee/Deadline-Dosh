import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService.js';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authService.resetPasswordForEmail(email.trim());
      setMessage(`A password reset link has been dispatched to ${email}. Please check your inbox.`);
      setEmail('');
    } catch (err) {
      console.error('[Forgot Password] Error:', err);
      setError(err.message || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '50px auto', padding: '0 16px', width: '100%' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="logo" style={{ margin: '0 auto 12px', width: '42px', height: '42px' }}>
            🔑
          </div>
          <h2>Reset Your Password</h2>
          <p className="mu" style={{ margin: '6px 0 0' }}>
            Enter your account email to receive a secure recovery link.
          </p>
        </div>

        {error && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--err) 16%, transparent)', color: 'var(--err)', marginBottom: '16px' }}>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--ok) 16%, transparent)', color: 'var(--ok)', marginBottom: '16px' }}>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            Email Address
            <input
              type="email"
              required
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <button type="submit" className="btn mt" disabled={loading} style={{ padding: '10px' }}>
            {loading ? 'Sending Link...' : 'Send Recovery Link'}
          </button>
        </form>

        <p className="mu" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem' }}>
          Remembered your password?{' '}
          <Link to="/signin" style={{ color: 'var(--sec)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
