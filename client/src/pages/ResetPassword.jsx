import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';

export function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('[Reset Password] Error:', err);
      setError(err.message || 'Could not update password. The reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '50px auto', padding: '0 16px', width: '100%' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="logo" style={{ margin: '0 auto 12px', width: '42px', height: '42px' }}>
            🔒
          </div>
          <h2>Create New Password</h2>
          <p className="mu" style={{ margin: '6px 0 0' }}>
            Enter a strong new password for your Deadline Dost account.
          </p>
        </div>

        {error && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--err) 16%, transparent)', color: 'var(--err)', marginBottom: '16px' }}>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--ok) 16%, transparent)', color: 'var(--ok)', marginBottom: '16px' }}>
            <span>Password updated successfully! Redirecting to your dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label>
            New Password
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              required
              placeholder="Retype new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <button type="submit" className="btn mt" disabled={loading} style={{ padding: '10px' }}>
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>

        <p className="mu" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem' }}>
          <Link to="/signin" style={{ color: 'var(--sec)', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
