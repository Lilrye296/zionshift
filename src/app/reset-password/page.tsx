'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <a href="/"><img src="/logo.png" alt="ZionShift" className="login-logo" /></a>
        <h1 className="login-heading">Set new password.</h1>
        <p className="login-sub">Choose a strong password for your ZionShift account.</p>
        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: '#1F6B3A', fontWeight: 500 }}>Password updated. Redirecting to login...</p>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p className="login-sub">Verifying reset link...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password">New Password</label>
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" autoComplete="new-password" autoFocus />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm Password</label>
              <input id="confirm" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" autoComplete="new-password" />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 16, padding: '14px' }}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="login-page"><div className="login-card"><p className="login-sub">Loading...</p></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
