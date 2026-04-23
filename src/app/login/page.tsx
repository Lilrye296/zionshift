'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/* ── Forgot Password Modal ────────────────────────── */
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
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
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 16, padding: '14px' }}
                >
                  {loading ? 'Sending…' : <>Send reset link <span className="chev">→</span></>}
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
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showForgot, setShowForgot] = useState(false);
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
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/"><img src="/logo.png" alt="ZionShift" className="login-logo" /></a>
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
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
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
