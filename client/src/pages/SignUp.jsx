import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successEmailSent, setSuccessEmailSent] = useState('');

  const validatePasswordStrength = (pwd) => {
    if (pwd.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter carefully.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the Terms & Conditions and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    try {
      const data = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim()
      });

      // If Supabase requires email confirmation
      if (data.user && !data.session) {
        setSuccessEmailSent(email.trim());
      } else {
        // Direct session
        navigate('/');
      }
    } catch (err) {
      console.error('[SignUp] Error:', err);
      if (err.message && err.message.toLowerCase().includes('already registered')) {
        setError('An account with this email address already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Failed to create account. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('[Google Auth] Error:', err);
      setError(err.message || 'Could not initiate Google registration.');
      setLoading(false);
    }
  };

  if (successEmailSent) {
    return (
      <div style={{ maxWidth: '460px', margin: '50px auto', padding: '0 16px', width: '100%' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <div className="logo" style={{ margin: '0 auto 16px', width: '48px', height: '48px', fontSize: '1.4rem' }}>
            ✉️
          </div>
          <h2>Verify Your Email Address</h2>
          <p style={{ margin: '12px 0 16px', lineHeight: 1.6 }}>
            We have sent an authentication verification link to <b>{successEmailSent}</b>.
          </p>
          <div className="card" style={{ background: 'var(--soft)', padding: '14px', margin: '14px 0', fontSize: '0.88rem' }}>
            Please check your inbox (and spam folder) and click the verification link to activate your cloud account.
          </div>
          <Link to="/signin" className="btn mt" style={{ display: 'inline-block' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '460px', margin: '30px auto', padding: '0 16px', width: '100%' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div className="logo" style={{ margin: '0 auto 12px', width: '42px', height: '42px', fontSize: '1.2rem' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </div>
          <h2>Create your Student Account</h2>
          <p className="mu" style={{ margin: '6px 0 0' }}>
            Cloud-synced deadlines, study planner, and AI study assistant
          </p>
        </div>

        {!isConfigured && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', marginBottom: '18px' }}>
            <span>ℹ️ <b>Supabase Notice:</b> Configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>client/.env</code> to enable live registration.</span>
          </div>
        )}

        {error && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--err) 16%, transparent)', color: 'var(--err)', marginBottom: '18px' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Continue with Google */}
        <button
          type="button"
          className="ghost"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ width: '100%', padding: '10px', justifyContent: 'center', fontWeight: 600, marginBottom: '16px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <div className="row" style={{ alignItems: 'center', margin: '14px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--bd)' }} />
          <span className="mu" style={{ padding: '0 10px', fontSize: '0.8rem' }}>or register with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--bd)' }} />
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
          <label>
            Full Name *
            <input
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Maya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label>
            Email Address *
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password *
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--tx2)'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label>
            Confirm Password *
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <label className="row" style={{ cursor: 'pointer', alignItems: 'flex-start', marginTop: '6px' }}>
            <input
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
            <span style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
              I agree to the Terms of Service and acknowledge the Student Privacy Policy.
            </span>
          </label>

          <button
            type="submit"
            className="btn mt"
            disabled={loading}
            style={{ padding: '10px', fontSize: '1rem' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mu" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem' }}>
          Already have an account?{' '}
          <Link to="/signin" style={{ color: 'var(--sec)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/" style={{ fontSize: '0.8rem', color: 'var(--tx2)', textDecoration: 'none' }}>
            ← Back to Guest Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
