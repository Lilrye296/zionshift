'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router = useRouter();

  const configured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    router.push(profile?.role === 'admin' ? '/portal' : '/client');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <a href="/" className="login-back">← Back to site</a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ZionShift" className="login-logo" />
        <h1 className="login-heading">Welcome back.</h1>
        <p className="login-sub">Sign in to your ZionShift portal.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
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

        <p className="login-note">ZionShift client portal · Authorized access only</p>
      </div>
    </div>
  );
}
