'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface ClientProfile {
  firm_name: string;
  logo_url: string | null;
  emails_sent: number;
  reply_rate: number;
  meetings_booked: number;
  campaign_status: string;
}

export default function ClientPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading]  = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('client_stats')
        .select('firm_name, logo_url, emails_sent, reply_rate, meetings_booked, campaign_status')
        .eq('client_id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="portal-page">
      <header className="portal-nav">
        <div className="portal-nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZionShift" className="portal-logo" />

          {/* Client logo — center */}
          <div className="client-logo-slot">
            {profile?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logo_url} alt={profile.firm_name ?? 'Client'} className="client-logo-img" />
            ) : profile?.firm_name ? (
              <span className="client-logo-text">{profile.firm_name}</span>
            ) : (
              <div className="client-logo-placeholder">Client Logo</div>
            )}
          </div>

          <button className="btn btn-ghost" onClick={handleSignOut} style={{ fontSize: 13, padding: '8px 16px' }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="portal-main">
        {loading ? (
          <div className="portal-empty"><p>Loading your dashboard…</p></div>
        ) : (
          <>
            <div className="portal-section-header">
              <h2 className="portal-heading">{profile?.firm_name ?? 'Your Dashboard'}</h2>
            </div>

            <div className="portal-metrics">
              <div className="portal-metric-card">
                <div className="portal-metric-label">Emails Sent This Month</div>
                <div className="portal-metric-value">{profile?.emails_sent ?? '—'}</div>
              </div>
              <div className="portal-metric-card">
                <div className="portal-metric-label">Reply Rate</div>
                <div className="portal-metric-value">
                  {profile?.reply_rate != null ? `${profile.reply_rate}%` : '—'}
                </div>
              </div>
              <div className="portal-metric-card">
                <div className="portal-metric-label">Meetings Booked</div>
                <div className="portal-metric-value">{profile?.meetings_booked ?? '—'}</div>
              </div>
              <div className="portal-metric-card">
                <div className="portal-metric-label">Campaign Status</div>
                <div className="portal-metric-value" style={{ fontSize: 20 }}>
                  {profile?.campaign_status ?? '—'}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
