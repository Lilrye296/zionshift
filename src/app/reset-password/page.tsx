'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const [ready, setReady]       = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const tokenHash = searchParams.get('token_hash');
    const type      = searchParams.get('type');
    const code      = searchParams.get('code'); // legacy fallback

    if (tokenHash && type === 'recovery') {
      // Direct token — no PKCE verifier needed, works regardless of how many
      // reset emails were sent or which browser tab initiated the request
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error: err }) => {
        if (!err) {
          setReady(true);
        } else {
          setError('This reset link is invalid or has already been used. Please request a new one.');
        }
      });
      return;
    }

    if (code) {
      // PKCE fallback for any old links still in circulation
      supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
        if (!err) {
          setReady(true);
        } else {
          setError('This reset link is invalid or has already been used. Please request a new one.');
        }
      });
      return;
    }

    // No token at all — show a clear error after a brief pause
    const timeout = setTimeout(() => {
      setError('No valid reset link found. Please request a new one from the login page.');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/"><img src="/logo.png" alt="ZionShift" className="login-logo" /></a>
        <h1 className="login-heading">Set a new password.</h1>
        <p className="login-sub">Choose a strong password for your ZionShift account.</p>

        {done ? (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999,
              background: '#E8F1EA', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#1F6B3A" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: '#1F6B3A', fontSize: 16, marginBottom: 8 }}>
              Password updated!
            </p>
            <p style={{ color: '#6B7280', fontSize: 14 }}>
              Taking you to sign in…
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p className="login-error" style={{ marginBottom: 20 }}>{error}</p>
            <a href="/login"
              className="btn btn-primary"
              style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none' }}>
              Back to login
            </a>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p className="login-sub">Verifying reset link…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 12, padding: '14px' }}
            >
              {loading ? 'Updating…' : <>Update password <span className="chev">→</span></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="login-card">
          <p className="login-sub">Loading…</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
