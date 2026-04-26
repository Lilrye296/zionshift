'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { sendPasswordResetEmail } from '@/app/actions/resetPassword';

/* ── Forgot Password Modal ────────────────────────── */
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [sent, setSent]         = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCooldown(seconds: number) {
    setCooldown(seconds);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const result = await sendPasswordResetEmail(email);
      if (result.error) {
        if (result.error === 'rate_limited') {
          setError('Too many requests. Please wait a minute before trying again.');
          startCooldown(60);
        } else {
          setError(result.error);
        }
        return;
      }
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-scroll">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div className="fp-icon-wrap">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="3"/>
                  <path d="M2 7l10 7 10-7"/>
                </svg>
              </div>
              <h3 className="fp-heading">Check your email.</h3>
              <p className="fp-sub">
                We sent a reset link to <strong>{email}</strong>.<br />
                It may take a minute to arrive.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 24, width: '100%', padding: '14px' }}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <h3 className="fp-heading">Reset your password</h3>
              <p className="fp-sub">Enter the email you use to sign in and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {error && <p className="login-error" style={{ marginTop: 12 }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 16, padding: '14px' }}
                >
                  {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : <>Send reset link <span className="chev">→</span></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Login Page ───────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const configured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !data.user) {
        setError('Invalid email or password. Please try again.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      router.push(profile?.role === 'admin' ? '/admin' : '/client');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* ── Top-left logo ── */}
      <a href="/" className="login-logo-link">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="ZionShift"
          className="login-logo-img"
          onMouseEnter={e => { e.currentTarget.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))'; e.currentTarget.style.opacity = '0.75'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.opacity = '1'; }}
        />
      </a>
      <div className="login-card">
        <h1 className="login-heading">Welcome back.</h1>
        <p className="login-sub">Sign in to your ZionShift portal.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 4,
                  color: '#9CA3AF', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <button
              type="button"
              className="login-forgot"
              onClick={() => setShowForgot(true)}
            >
              Forgot password?
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 12, padding: '14px' }}
          >
            {loading ? 'Signing in…' : <>Sign in <span className="chev">→</span></>}
          </button>
        </form>

      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
