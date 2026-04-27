'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/* ── Calendar icons ─────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function OutlookIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://img.icons8.com/fluency/48/microsoft-outlook-2019.png"
      width={28} height={28}
      alt="Outlook"
      style={{ objectFit: 'contain' }}
    />
  );
}

type CalProvider = 'google' | 'outlook' | 'apple';

const CAL_INFO: Record<CalProvider, { name: string; icon: () => JSX.Element; steps: string[] }> = {
  google: {
    name: 'Google Calendar',
    icon: GoogleIcon,
    steps: [
      'Click Connect below to authorize with your Google account.',
      'Choose the Google account you want to sync with.',
      'Allow ZionShift to view your calendar availability.',
      'Your meetings will appear in Google Calendar automatically.',
    ],
  },
  outlook: {
    name: 'Outlook / Microsoft 365',
    icon: OutlookIcon,
    steps: [
      'Click Connect below to authorize with your Microsoft account.',
      'Sign in with the Microsoft 365 or Outlook account you use.',
      'Grant calendar access when prompted.',
      'Your meetings will appear in Outlook automatically.',
    ],
  },
  apple: {
    name: 'Apple Calendar',
    icon: AppleIcon,
    steps: [
      'Open your Apple ID settings at appleid.apple.com.',
      'Under Sign-In & Security, generate an App-Specific Password.',
      'Click Connect below and enter that password when prompted.',
      'Your meetings will sync to Apple Calendar automatically.',
    ],
  },
};

function AdminCalModal({
  provider,
  isConnected,
  onConnect,
  onDisconnect,
  onClose,
}: {
  provider: CalProvider;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}) {
  const info = CAL_INFO[provider];
  const Icon = info.icon;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-scroll">
          <div className="ccm-header">
            <Icon />
            <div>
              <div className="ccm-title">{info.name}</div>
              {isConnected && <div className="ccm-connected-label">Connected</div>}
            </div>
          </div>
          <div className="ccm-steps-label">How it works</div>
          <ol className="ccm-steps">
            {info.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <div className="ccm-note">
            Full OAuth integration coming soon. Connection state is saved for this session.
          </div>
          <div className="ccm-actions">
            {isConnected ? (
              <button className="ccm-btn-disconnect" onClick={() => { onDisconnect(); onClose(); }}>
                Disconnect
              </button>
            ) : (
              <button className="ccm-btn-connect" onClick={() => { onConnect(); onClose(); }}>
                Connect {info.name}
              </button>
            )}
            <button className="ccm-btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Types ─────────────────────────────────────────────────────── */

interface ActiveClient {
  id: string;
  name: string;
  email: string;
  firm: string;
  status: 'pending' | 'live' | 'paused' | 'cancelled';
  mrr: number;
  since: string;
  firstMonthPaid: boolean;
  setupFeePaid: boolean;
  headshotUrl: string | null;
  logoUrl: string | null;
  campaignStatus: string;
  warmupStartedAt: string | null;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: 'onboard' | 'churn' | 'milestone' | 'meeting' | 'mrr';
}

interface AdminPeriodStats {
  emails_sent:   number | null;
  total_replies: number | null;
}

interface ProspectMeeting {
  id: string;
  prospect: string;
  firm: string;
  date: string;
  day: number;
  month: number;
  year: number;
  time: string;
  zoom_url: string;
  status: 'upcoming' | 'completed';
}

/* ── Helpers ────────────────────────────────────────────────────── */

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtEventTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtMeetingDate(year: number, month: number, day: number): string {
  return `${SHORT_MONTHS[month]} ${day}, ${year}`;
}

/* ── Constants ──────────────────────────────────────────────────── */

// $2k → $6k → $10k → then $10k increments to $100k
const MRR_MILESTONES = [2000, 6000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];

const DOW_LABELS = ['S','M','T','W','T','F','S'];
const MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const TABS = ['Overview', 'Meetings'] as const;
type Tab = typeof TABS[number];

/* ── Component ──────────────────────────────────────────────────── */

type MetricPeriod = 'week' | 'month' | 'alltime';
const PERIOD_LABEL: Record<MetricPeriod, string> = { week: 'This Week', month: 'This Month', alltime: 'All Time' };

export default function AdminPage() {
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<Tab>('Overview');
  const [metricPeriod, setMetricPeriod]   = useState<MetricPeriod>('alltime');
  const [periodOpen, setPeriodOpen]       = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ProspectMeeting | null>(null);
  const [connectedCal, setConnectedCal]       = useState<CalProvider | null>(null);
  const [calModal, setCalModal]               = useState<CalProvider | null>(null);
  const [calMonth, setCalMonth]               = useState(() => new Date().getMonth());
  const [calYear, setCalYear]                 = useState(() => new Date().getFullYear());
  const [clients, setClients]                 = useState<ActiveClient[]>([]);
  const [activityFeed, setActivityFeed]       = useState<ActivityItem[]>([]);
  const [meetings, setMeetings]               = useState<ProspectMeeting[]>([]);
  const [periodStats, setPeriodStats]     = useState<AdminPeriodStats | null>(null);
  const [resendingId, setResendingId]     = useState<string | null>(null);
  const [resentId, setResentId]           = useState<string | null>(null);
  const [launchToast, setLaunchToast]     = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [intakeClient, setIntakeClient]     = useState<ActiveClient | null>(null);
  const [intakeData, setIntakeData]         = useState<Record<string, unknown> | null>(null);
  const [intakeLoading, setIntakeLoading]   = useState(false);
  const [onboardOpen, setOnboardOpen]     = useState(false);
  const [onboardName, setOnboardName]     = useState('');
  const [onboardEmail, setOnboardEmail]   = useState('');
  const [deleteClient, setDeleteClient]   = useState<ActiveClient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting]           = useState(false);
  const [onboardStatus, setOnboardStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const periodRef                         = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auth guard + data fetch
  useEffect(() => {
    async function load() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') { router.push('/client'); return; }

        // Fetch clients directly — RLS allows admin role (same pattern as profiles/events/meetings)
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, name, email, firm, status, mrr, since, first_month_paid, setup_fee_paid, headshot_url, logo_url, campaign_status, warmup_started_at')
          .order('created_at', { ascending: false });

        if (clientsData) {
          const mapped = clientsData.map((c: {
            id: string; name: string; email: string; firm: string;
            status: string; mrr: number; since: string;
            first_month_paid: boolean; setup_fee_paid: boolean;
            headshot_url: string | null; logo_url: string | null;
            campaign_status: string | null; warmup_started_at: string | null;
          }) => {
            // Auto-flip warming → active after 14 days
            let campaignStatus = c.campaign_status ?? 'pending';
            if (campaignStatus === 'warming' && c.warmup_started_at) {
              const daysSince = (Date.now() - new Date(c.warmup_started_at).getTime()) / 86400000;
              if (daysSince >= 14) campaignStatus = 'active';
            }
            return {
              id: c.id,
              name: c.name,
              email: c.email ?? '',
              firm: c.firm ?? '',
              status: (c.status === 'active' ? 'live' : c.status) as 'pending' | 'live' | 'paused' | 'cancelled',
              mrr: Number(c.mrr),
              since: c.since ? fmtDate(c.since) : '—',
              firstMonthPaid: c.first_month_paid,
              setupFeePaid: c.setup_fee_paid,
              headshotUrl: c.headshot_url ?? null,
              logoUrl: c.logo_url ?? null,
              campaignStatus,
              warmupStartedAt: c.warmup_started_at ?? null,
            };
          });

          // Persist any warming→active flips to DB
          mapped.forEach(async (client) => {
            const raw = clientsData.find((c: { id: string; campaign_status: string | null }) => c.id === client.id);
            if (raw && raw.campaign_status === 'warming' && client.campaignStatus === 'active') {
              await supabase.from('clients').update({ campaign_status: 'active' }).eq('id', client.id);
            }
          });

          setClients(mapped);
        }

        // Fetch business events (admin activity feed)
        const { data: eventsData } = await supabase
          .from('business_events')
          .select('id, label, event_type, created_at')
          .order('created_at', { ascending: false })
          .limit(20);

        if (eventsData) {
          setActivityFeed(eventsData.map(e => ({
            id: e.id,
            text: e.label ?? '',
            time: fmtEventTime(e.created_at),
            type: (e.event_type ?? 'milestone') as ActivityItem['type'],
          })));
        }

        // Fetch all prospect meetings
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('id, prospect, firm, day, month, year, meeting_time, zoom_url, status')
          .order('year',  { ascending: false })
          .order('month', { ascending: false })
          .order('day',   { ascending: false });

        if (meetingsData) {
          setMeetings(meetingsData.map(m => ({
            id: m.id,
            prospect: m.prospect ?? '',
            firm: m.firm ?? '',
            date: fmtMeetingDate(m.year, m.month, m.day),
            day: m.day,
            month: m.month,
            year: m.year,
            time: m.meeting_time ?? '',
            zoom_url: m.zoom_url ?? '',
            status: (m.status === 'scheduled' ? 'upcoming' : (m.status ?? 'upcoming')) as 'upcoming' | 'completed',
          })));
        }

      } catch {
        // Network or Supabase error — render with empty arrays.
      }
      setLoading(false);
    }
    load();
  }, [router]);

  // Close period dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close client actions dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as Element).closest('.adm-actions-wrap')) {
        setOpenDropdownId(null);
      }
    }
    if (openDropdownId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [openDropdownId]);

  // Period stats — shows '—' until Smartlead API is wired
  useEffect(() => {
    setPeriodStats(null);
  }, [metricPeriod]);

  function openOnboard() {
    setOnboardName('');
    setOnboardEmail('');
    setOnboardStatus('idle');
    setOnboardOpen(true);
  }

  async function handleSendPaymentLink() {
    if (!onboardName.trim() || !onboardEmail.trim()) return;
    setOnboardStatus('sending');
    try {
      const res = await fetch('/api/send-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: onboardName.trim(), email: onboardEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setOnboardStatus('error');
      } else {
        setOnboardStatus('success');
      }
    } catch {
      setOnboardStatus('error');
    }
  }

  async function handleResendOnboarding(clientId: string) {
    setResendingId(clientId);
    try {
      const res = await fetch('/api/resend-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        setResentId(clientId);
        setTimeout(() => setResentId(null), 3000);
      }
    } catch {
      // Silently fail — button returns to normal state
    } finally {
      setResendingId(null);
    }
  }


  async function handleDeleteClient() {
    if (!deleteClient) return;
    if (deleteConfirm.trim().toLowerCase() !== deleteClient.name.toLowerCase()) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      await supabase.from('clients').delete().eq('id', deleteClient.id);
      setClients(prev => prev.filter(c => c.id !== deleteClient.id));
      setDeleteClient(null);
      setDeleteConfirm('');
      setLaunchToast(`${deleteClient.name} has been removed.`);
      setTimeout(() => setLaunchToast(null), 5000);
    } catch {
      // Silently fail
    } finally {
      setDeleting(false);
    }
  }

  async function handlePauseClient(client: ActiveClient) {
    setOpenDropdownId(null);
    try {
      const supabase = createClient();
      await supabase.from('clients').update({ campaign_status: 'paused' }).eq('id', client.id);
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, campaignStatus: 'paused' } : c));
      await fetch('/api/notify-status-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: client.name, action: 'paused' }),
      });
      setLaunchToast(`${client.name}'s campaign paused — go pause in Smartlead.`);
      setTimeout(() => setLaunchToast(null), 6000);
    } catch { /* silently fail */ }
  }

  async function handleResumeClient(client: ActiveClient) {
    setOpenDropdownId(null);
    try {
      const supabase = createClient();
      const stillWarming = client.warmupStartedAt
        && (Date.now() - new Date(client.warmupStartedAt).getTime()) / 86400000 < 14;
      const resumeStatus = stillWarming ? 'warming' : 'active';
      await supabase.from('clients').update({ campaign_status: resumeStatus }).eq('id', client.id);
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, campaignStatus: resumeStatus } : c));
      setLaunchToast(`${client.name}'s campaign resumed.`);
      setTimeout(() => setLaunchToast(null), 5000);
    } catch { /* silently fail */ }
  }


  async function handleDownloadAssets(client: ActiveClient) {
    try {
      const res = await fetch(`/api/download-client-assets?email=${encodeURIComponent(client.email)}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${(client.firm || client.name).replace(/[^a-zA-Z0-9]/g, '_')}_assets.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — user still sees the button
    }
  }

  async function handleViewIntake(client: ActiveClient) {
    setIntakeClient(client);
    setIntakeData(null);
    setIntakeLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('onboarding_responses')
        .select('response_data')
        .eq('email', client.email)
        .single();
      setIntakeData((data?.response_data as Record<string, unknown>) ?? null);
    } catch {
      setIntakeData(null);
    }
    setIntakeLoading(false);
  }

  async function handleSignOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore sign-out errors — always redirect to login regardless.
      }
    }
    router.push('/login');
  }

  // MRR = only clients whose first monthly payment has cleared
  const totalMRR = clients
    .filter(c => c.firstMonthPaid)
    .reduce((s, c) => s + c.mrr, 0);

  // Setup fees = all clients who paid the $1k setup
  const setupFees = clients.filter(c => c.setupFeePaid).length * 1000;

  // Milestone ladder
  const nextMilestone  = MRR_MILESTONES.find(m => m > totalMRR) ?? 100000;
  const prevMilestone  = MRR_MILESTONES[MRR_MILESTONES.indexOf(nextMilestone) - 1] ?? 0;
  const mrrProgress    = nextMilestone === prevMilestone ? 100
    : Math.min(Math.round(((totalMRR - prevMilestone) / (nextMilestone - prevMilestone)) * 100), 100);

  const activeClientCount = clients.length;

  // Reply Rate
  const replyRate: string = (
    periodStats?.emails_sent != null &&
    periodStats.emails_sent > 0 &&
    periodStats.total_replies != null
  )
    ? `${((periodStats.total_replies / periodStats.emails_sent) * 100).toFixed(1)}%`
    : '—';

  const upcomingCount = meetings.filter(m => m.status === 'upcoming').length;

  // Calendar grid
  const calNow      = new Date();
  const calToday    = (calMonth === calNow.getMonth() && calYear === calNow.getFullYear()) ? calNow.getDate() : -1;
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDays     = new Date(calYear, calMonth + 1, 0).getDate();
  const meetingDays = new Set(
    meetings.filter(m => m.month === calMonth && m.year === calYear).map(m => m.day)
  );
  const calCells: (number | null)[] = [];
  for (let i = 0; i < calFirstDay; i++) calCells.push(null);
  for (let d = 1; d <= calDays; d++) calCells.push(d);
  while (calCells.length % 7 !== 0) calCells.push(null);

  function prevMonth() {
    setSelectedMeeting(null);
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedMeeting(null);
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  return (
    <div className="portal-page">

      {/* ── Launch Campaign Toast ────────────────────────────────── */}
      {launchToast && (
        <div className="adm-toast">
          <span>{launchToast}</span>
          <button className="adm-toast-close" onClick={() => setLaunchToast(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="portal-nav">
        <div className="portal-nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <a href="/"><img src="/logo.png" alt="ZionShift" className="portal-logo" /></a>
          <span className="adm-center-label">Admin</span>
          <button className="btn btn-ghost" onClick={handleSignOut} style={{ fontSize: 13, padding: '8px 16px' }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="portal-main">

        {loading ? (
          <div className="portal-empty"><p>Loading…</p></div>
        ) : (
          <>

        {/* ── Tab pills ── */}
        <div className="cd-tabs" style={{ marginBottom: 32 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`cd-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Meetings' && upcomingCount > 0 && (
                <span className="adm-badge adm-badge-meet">{upcomingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══ MEETINGS ════════════════════════════════════════════ */}
        {activeTab === 'Meetings' && (
          <div>
            {/* Header */}
            <div className="adm-section-head" style={{ marginBottom: 28 }}>
              <div>
                <h2 className="portal-heading" style={{ marginBottom: 6 }}>Meetings</h2>
                <p className="adm-subhead">Discovery calls booked by prospects via Calendly.</p>
              </div>
              <div className="adm-meetings-stats">
                <div className="adm-meet-stat">
                  <span className="adm-meet-stat-val">{upcomingCount}</span>
                  <span className="adm-meet-stat-label">Upcoming</span>
                </div>
                <div className="adm-meet-stat-divider" />
                <div className="adm-meet-stat">
                  <span className="adm-meet-stat-val">{meetings.filter(m => m.status === 'completed').length}</span>
                  <span className="adm-meet-stat-label">Completed</span>
                </div>
              </div>
            </div>

            <div className="adm-meet-grid">

              {/* Calendar */}
              <div className="adm-biz-card">
                <div className="adm-cal-nav">
                  <button className="adm-cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="adm-biz-card-title">{MONTH_NAMES_FULL[calMonth]} {calYear}</span>
                  <button className="adm-cal-nav-btn" onClick={nextMonth} aria-label="Next month">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="adm-cal-dow">
                  {DOW_LABELS.map((d, i) => <span key={i}>{d}</span>)}
                </div>
                <div className="adm-cal-grid">
                  {calCells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const hasMeet = meetingDays.has(d);
                    const isSelected = selectedMeeting?.day === d &&
                                       selectedMeeting?.month === calMonth &&
                                       selectedMeeting?.year === calYear;
                    return (
                      <button
                        key={i}
                        disabled={!hasMeet}
                        onClick={() => {
                          const m = meetings.find(x => x.day === d && x.month === calMonth && x.year === calYear);
                          setSelectedMeeting(prev => prev?.id === m?.id ? null : (m ?? null));
                        }}
                        className={[
                          'adm-cal-cell',
                          d === calToday ? 'today'    : '',
                          hasMeet        ? 'has-meet' : '',
                          isSelected     ? 'selected' : '',
                        ].join(' ').trim()}
                      >
                        {d}
                        {hasMeet && <span className="adm-cal-dot" />}
                      </button>
                    );
                  })}
                </div>

                {/* Selected meeting detail */}
                {selectedMeeting ? (
                  <div className="adm-meet-detail">
                    <div className="adm-meet-detail-head">
                      <div>
                        <div className="adm-meet-detail-name">{selectedMeeting.prospect}</div>
                        <div className="adm-meet-detail-firm">{selectedMeeting.firm}</div>
                      </div>
                      <span className={`adm-meet-pill adm-meet-pill--${selectedMeeting.status}`}>
                        {selectedMeeting.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>
                    <div className="adm-meet-detail-row">
                      <span className="adm-meet-detail-label">Date &amp; Time</span>
                      <span className="adm-meet-detail-val">{selectedMeeting.date} · {selectedMeeting.time}</span>
                    </div>
                    {selectedMeeting.status === 'upcoming' && (
                      <a href={selectedMeeting.zoom_url} target="_blank" rel="noopener noreferrer" className="adm-zoom-btn">
                        Join Zoom →
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="adm-cal-hint">Tap a highlighted date to see meeting details.</p>
                )}
              </div>

              {/* Meeting log */}
              <div className="adm-biz-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 24px 0' }}>
                  <div className="adm-biz-card-head">
                    <span className="adm-biz-card-title">All Meetings</span>
                    <span className="adm-count-chip">{meetings.length} Total</span>
                  </div>
                </div>
                <div className="adm-meet-log">
                  {meetings.length === 0 ? (
                    <p className="adm-empty-text" style={{ padding: '24px' }}>No meetings yet. Calendly bookings will appear here automatically.</p>
                  ) : meetings.map((m, i) => (
                    <Fragment key={m.id}>
                      {i > 0 && <div className="adm-divider" style={{ margin: '0 24px' }} />}
                      <div
                        className={`adm-meet-row${selectedMeeting?.id === m.id ? ' selected' : ''}`}
                        onClick={() => setSelectedMeeting(prev => prev?.id === m.id ? null : m)}
                      >
                        <div className="adm-meet-row-avatar">
                          {m.prospect.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div className="adm-meet-row-info">
                          <span className="adm-meet-row-name">{m.prospect}</span>
                          <span className="adm-meet-row-firm">{m.firm}</span>
                        </div>
                        <div className="adm-meet-row-right">
                          <span className="adm-meet-row-date">{m.date}</span>
                          <span className="adm-meet-row-time">{m.time}</span>
                          <span className={`adm-meet-pill adm-meet-pill--${m.status}`}>
                            {m.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>

            </div>

            {/* Calendar sync */}
            <div className="cd-card" style={{ marginTop: 20 }}>
              <div className="cd-cal-sync-top">
                <div>
                  <div className="cd-cal-sync-title">Sync to your calendar</div>
                  <div className="cd-cal-sync-sub">
                    New Calendly bookings will appear automatically once connected.
                  </div>
                </div>
              </div>
              <div className="cd-cal-options">
                {(['google', 'outlook', 'apple'] as CalProvider[]).map(p => (
                  <div
                    key={p}
                    className={`cd-cal-option cd-cal-option-btn${connectedCal === p ? ' cd-cal-option-active' : ''}`}
                    onClick={() => setCalModal(p)}
                  >
                    {p === 'google'  && <GoogleIcon />}
                    {p === 'outlook' && <OutlookIcon />}
                    {p === 'apple'   && <AppleIcon />}
                    <span className="cd-cal-option-name">{CAL_INFO[p].name}</span>
                    {connectedCal === p
                      ? <span className="cd-cal-connected">Connected</span>
                      : <span className="cd-cal-tap">Tap to connect</span>
                    }
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══ OVERVIEW ════════════════════════════════════════════ */}
        {activeTab === 'Overview' && (
          <div>
            <div className="adm-biz-toprow">
              <h2 className="portal-heading" style={{ margin: 0 }}>Overview</h2>
              <div className="cd-period-dropdown" ref={periodRef}>
                <button className="cd-period-btn" onClick={() => setPeriodOpen(o => !o)}>
                  {PERIOD_LABEL[metricPeriod]}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {periodOpen && (
                  <div className="cd-period-menu">
                    {(['week', 'month', 'alltime'] as MetricPeriod[]).map(p => (
                      <button
                        key={p}
                        className={`cd-period-option${metricPeriod === p ? ' active' : ''}`}
                        onClick={() => { setMetricPeriod(p); setPeriodOpen(false); }}
                      >
                        {PERIOD_LABEL[p]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Metric cards */}
            <div className="portal-metrics" style={{ margin: '24px 0 28px' }}>
              <div className="portal-metric-card">
                <div className="portal-metric-label">MRR</div>
                <div className="portal-metric-value">${totalMRR.toLocaleString()}</div>
                <div className="adm-metric-period">Current</div>
              </div>
              <div className="portal-metric-card">
                <div className="portal-metric-label">Emails Sent</div>
                <div className="portal-metric-value">{periodStats?.emails_sent ?? '—'}</div>
                <div className="adm-metric-period">{PERIOD_LABEL[metricPeriod]}</div>
              </div>
              <div className="portal-metric-card">
                <div className="portal-metric-label">Total Replies</div>
                <div className="portal-metric-value">{periodStats?.total_replies ?? '—'}</div>
                <div className="adm-metric-period">{PERIOD_LABEL[metricPeriod]}</div>
              </div>
              <div className="portal-metric-card">
                <div className="portal-metric-label">Reply Rate</div>
                <div className="portal-metric-value">{replyRate}</div>
                <div className="adm-metric-period">{PERIOD_LABEL[metricPeriod]}</div>
              </div>
            </div>

            {/* Onboard strip */}
            <div className="adm-onboard-strip">
              <div className="adm-onboard-strip-text">
                <span className="adm-onboard-strip-title">Onboard New Client</span>
                <span className="adm-onboard-strip-sub">Send a payment link to start their setup.</span>
              </div>
              <button className="adm-onboard-btn" onClick={openOnboard}>
                Send Payment Link
              </button>
            </div>

            <div className="adm-biz-grid">

              {/* Clients */}
              <div className="adm-biz-card">
                <div className="adm-biz-card-head">
                  <span className="adm-biz-card-title">Clients</span>
                  <span className="adm-count-chip">{activeClientCount} Total</span>
                </div>
                {clients.length === 0 ? (
                  <p className="adm-empty-text">No clients yet.</p>
                ) : (
                  <div className="adm-client-scroll" style={clients.length <= 4 ? { maxHeight: 'none', overflowY: 'visible' } : {}}>
                    {clients.map((c, i) => (
                      <Fragment key={c.id}>
                        {i > 0 && <div className="adm-divider" />}
                        <div className="adm-client-row">
                          <div className={`adm-client-avatar${c.status !== 'live' ? ' inactive' : ''}`}>
                            {c.headshotUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={c.headshotUrl} alt={c.name} className="adm-client-avatar-img" />
                              : c.name.split(' ').map(w => w[0]).join('')
                            }
                          </div>
                          <div className="adm-client-info">
                            <span className="adm-client-name">{c.name}</span>
                            {c.status === 'pending' ? (
                              <span className="adm-client-firm">{c.email}</span>
                            ) : (
                              <span className="adm-client-firm">{c.firm} · since {c.since}</span>
                            )}
                            {c.status === 'live' && !c.firstMonthPaid && (
                              <span className="adm-billing-pill adm-billing-pill--trial">Trial</span>
                            )}
                          </div>
                          <div className="adm-client-right">
                            {(() => {
                              const cs = c.campaignStatus;
                              if (cs === 'warming' && c.warmupStartedAt) {
                                const day = Math.min(Math.floor((Date.now() - new Date(c.warmupStartedAt).getTime()) / 86400000) + 1, 14);
                                return <span className="adm-client-pill adm-client-pill--warming">● Warming — Day {day} of 14</span>;
                              }
                              if (cs === 'active')    return <span className="adm-client-pill adm-client-pill--live">● Active</span>;
                              if (cs === 'paused')    return <span className="adm-client-pill adm-client-pill--paused">● Paused</span>;
                              if (cs === 'cancelled') return <span className="adm-client-pill adm-client-pill--cancelled">● Cancelled</span>;
                              return <span className="adm-client-pill adm-client-pill--pending">● Pending</span>;
                            })()}
                            {c.status === 'pending' ? (
                              <button
                                className="adm-view-btn"
                                disabled={resendingId === c.id}
                                onClick={() => handleResendOnboarding(c.id)}
                              >
                                {resentId === c.id ? 'Sent ✓' : resendingId === c.id ? 'Sending…' : 'Resend Invite'}
                              </button>
                            ) : (
                              <div className="adm-actions-wrap">
                                <button
                                  className="adm-menu-btn"
                                  onClick={() => setOpenDropdownId(id => id === c.id ? null : c.id)}
                                  aria-label="Client actions"
                                >
                                  •••
                                </button>
                                {openDropdownId === c.id && (
                                  <div className="adm-actions-menu">
                                    <button className="adm-actions-item" onClick={() => { router.push(`/client?view=${c.id}`); setOpenDropdownId(null); }}>
                                      View Dashboard →
                                    </button>
                                    <div className="adm-actions-divider" />
                                    <button
                                      className={`adm-actions-item${!c.logoUrl && !c.headshotUrl ? ' disabled' : ''}`}
                                      disabled={!c.logoUrl && !c.headshotUrl}
                                      onClick={() => { handleDownloadAssets(c); setOpenDropdownId(null); }}
                                    >
                                      Download Assets
                                    </button>
                                    <div className="adm-actions-divider" />
                                    <button className="adm-actions-item" onClick={() => { handleViewIntake(c); setOpenDropdownId(null); }}>
                                      View Intake Form
                                    </button>
                                    <div className="adm-actions-divider" />
                                    {c.campaignStatus !== 'paused' && c.campaignStatus !== 'cancelled' && (
                                      <>
                                        <button className="adm-actions-item adm-actions-item--warn" onClick={() => handlePauseClient(c)}>
                                          Pause Campaign
                                        </button>
                                        <div className="adm-actions-divider" />
                                      </>
                                    )}
                                    {c.campaignStatus === 'paused' && (
                                      <>
                                        <button className="adm-actions-item adm-actions-item--green" onClick={() => handleResumeClient(c)}>
                                          Resume Campaign
                                        </button>
                                        <div className="adm-actions-divider" />
                                      </>
                                    )}
                                    <button className="adm-actions-item adm-actions-item--danger" onClick={() => { setDeleteClient(c); setDeleteConfirm(''); setOpenDropdownId(null); }}>
                                      Remove Client
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div className="adm-biz-right-col">

                {/* Revenue + milestone progress */}
                <div className="adm-biz-card">
                  <div className="adm-biz-card-head">
                    <span className="adm-biz-card-title">Revenue</span>
                  </div>
                  <div className="adm-revenue-rows">
                    <div className="adm-revenue-row">
                      <span className="adm-revenue-label">Monthly Retainers</span>
                      <span className="adm-revenue-val">${totalMRR.toLocaleString()}</span>
                    </div>
                    <div className="adm-divider" />
                    <div className="adm-revenue-row">
                      <span className="adm-revenue-label">Setup Fees (all-time)</span>
                      <span className="adm-revenue-val">${setupFees.toLocaleString()}</span>
                    </div>
                    <div className="adm-divider" />
                    <div className="adm-revenue-row adm-revenue-row--total">
                      <span className="adm-revenue-label adm-revenue-label--total">Total Collected</span>
                      <span className="adm-revenue-val adm-revenue-val--total">${(totalMRR + setupFees).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Milestone progress bar */}
                  <div className="adm-milestone">
                    <div className="adm-milestone-labels">
                      <span className="adm-milestone-tag">Next milestone</span>
                      <span className="adm-milestone-target">${nextMilestone.toLocaleString()} MRR</span>
                    </div>
                    <div className="adm-progress-track">
                      <div className="adm-progress-fill" style={{ width: `${mrrProgress}%` }} />
                    </div>
                    <div className="adm-milestone-sub">
                      ${totalMRR.toLocaleString()} of ${nextMilestone.toLocaleString()} MRR — {mrrProgress}% there
                    </div>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="adm-biz-card">
                  <div className="adm-biz-card-head">
                    <span className="adm-biz-card-title">Recent Activity</span>
                  </div>
                  <div className="adm-activity-list">
                    {activityFeed.length === 0 ? (
                      <p className="adm-empty-text">No activity yet.</p>
                    ) : activityFeed.map((item, i) => (
                      <Fragment key={item.id}>
                        {i > 0 && <div className="adm-divider" />}
                        <div className="adm-activity-row">
                          <span className={`adm-activity-icon adm-activity-icon--${item.type}`}>
                            {item.type === 'onboard'   ? '↑' :
                             item.type === 'churn'     ? '↓' :
                             item.type === 'milestone' ? '★' :
                             item.type === 'meeting'   ? '◎' : '$'}
                          </span>
                          <span className="adm-activity-text">{item.text}</span>
                          <span className="adm-activity-time">{item.time}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

          </>
        )}

      </main>

      {/* Calendar connect modal */}
      {calModal && (
        <AdminCalModal
          provider={calModal}
          isConnected={connectedCal === calModal}
          onConnect={() => setConnectedCal(calModal)}
          onDisconnect={() => setConnectedCal(null)}
          onClose={() => setCalModal(null)}
        />
      )}

      {/* Intake Form Modal */}
      {intakeClient && (
        <div className="modal-overlay" onClick={() => { setIntakeClient(null); setIntakeData(null); }}>
          <div className="modal" style={{ maxWidth: 560, maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setIntakeClient(null); setIntakeData(null); }}>✕</button>
            <div className="modal-scroll">
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>Intake Form</p>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1715' }}>{intakeClient.name}</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>{intakeClient.email}</p>
              </div>

              {intakeLoading ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
              ) : !intakeData ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No intake data found.</div>
              ) : (
                <div className="adm-intake">
                  {/* Screen 1 */}
                  <div className="adm-intake-section">
                    <div className="adm-intake-section-title">About You</div>
                    {([
                      ['Business', intakeData.businessName],
                      ['Location', intakeData.cityState],
                      ['Years in Business', intakeData.yearsInBusiness],
                      ['Website', intakeData.websiteUrl || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="adm-intake-row">
                        <span className="adm-intake-label">{label}</span>
                        <span className="adm-intake-val">{val || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Screen 2 */}
                  <div className="adm-intake-section">
                    <div className="adm-intake-section-title">Ideal Client</div>
                    {([
                      ['Industries', Array.isArray(intakeData.industries) ? (intakeData.industries as string[]).join(', ') + (intakeData.otherIndustry ? ` (Other: ${intakeData.otherIndustry})` : '') : '—'],
                      ['Employee Count', Array.isArray(intakeData.employeeCount) ? (intakeData.employeeCount as string[]).join(', ') : '—'],
                      ['Revenue Range', Array.isArray(intakeData.revenueRange) ? (intakeData.revenueRange as string[]).join(', ') : String(intakeData.revenueRange || '—')],
                      ['Geo Focus', Array.isArray(intakeData.geoFocus) ? (intakeData.geoFocus as string[]).join(', ') + (intakeData.regionalStates ? ` — ${intakeData.regionalStates}` : '') : '—'],
                      ['Client Exclusions', intakeData.exclusions || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="adm-intake-row">
                        <span className="adm-intake-label">{label}</span>
                        <span className="adm-intake-val">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Screen 3 */}
                  <div className="adm-intake-section">
                    <div className="adm-intake-section-title">Voice &amp; Messaging</div>
                    {([
                      ['Differentiator', intakeData.differentiator],
                      ['Pain Point', intakeData.painPoint],
                      ['Transformation', intakeData.transformation],
                      ['Tone', intakeData.tone],
                      ['Avoidances', intakeData.avoidances || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="adm-intake-row">
                        <span className="adm-intake-label">{label}</span>
                        <span className="adm-intake-val">{val || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Screen 4 */}
                  <div className="adm-intake-section">
                    <div className="adm-intake-section-title">Booking</div>
                    <div className="adm-intake-row">
                      <span className="adm-intake-label">Booking Link</span>
                      <span className="adm-intake-val">
                        {intakeData.bookingLink
                          ? <a href={intakeData.bookingLink as string} target="_blank" rel="noreferrer" style={{ color: '#1A1715', wordBreak: 'break-all' }}>{intakeData.bookingLink as string}</a>
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Screen 5 */}
                  <div className="adm-intake-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
                    <div className="adm-intake-section-title">Final Details</div>
                    {([
                      ['Prospect Note', intakeData.prospectNote || '—'],
                      ['Referral Source', intakeData.referralSource || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="adm-intake-row">
                        <span className="adm-intake-label">{label}</span>
                        <span className="adm-intake-val">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Client modal */}
      {onboardOpen && (
        <div className="modal-overlay" onClick={() => setOnboardOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOnboardOpen(false)}>✕</button>
            <div className="modal-scroll">
              <div className="ccm-title" style={{ marginBottom: 6 }}>Onboard New Client</div>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--muted, #888)' }}>
                Enter the client&apos;s details and we&apos;ll send them a payment link to complete their setup.
              </p>

              {onboardStatus === 'success' ? (
                <div style={{
                  padding: '16px 20px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#15803D',
                  fontWeight: 500,
                }}>
                  Payment link sent to {onboardEmail} ✓
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted, #888)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={onboardName}
                      onChange={e => setOnboardName(e.target.value)}
                      placeholder="Jane Smith"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 14,
                        border: '1px solid #E5E5E5',
                        borderRadius: 8,
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#FAFAFA',
                        color: '#1A1715',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted, #888)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={onboardEmail}
                      onChange={e => setOnboardEmail(e.target.value)}
                      placeholder="jane@smithbookkeeping.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 14,
                        border: '1px solid #E5E5E5',
                        borderRadius: 8,
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#FAFAFA',
                        color: '#1A1715',
                      }}
                    />
                  </div>

                  {onboardStatus === 'error' && (
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#DC2626' }}>
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <div className="ccm-actions">
                    <button
                      className="ccm-btn-connect"
                      disabled={onboardStatus === 'sending' || !onboardName.trim() || !onboardEmail.trim()}
                      onClick={handleSendPaymentLink}
                      style={{ opacity: (!onboardName.trim() || !onboardEmail.trim()) ? 0.5 : 1 }}
                    >
                      {onboardStatus === 'sending' ? 'Sending…' : 'Send Payment Link'}
                    </button>
                    <button className="ccm-btn-cancel" onClick={() => setOnboardOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Modal */}
      {deleteClient && (
        <div className="modal-overlay" onClick={() => { setDeleteClient(null); setDeleteConfirm(''); }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setDeleteClient(null); setDeleteConfirm(''); }}>✕</button>
            <div className="modal-scroll">
              <div className="adm-delete-icon">⚠</div>
              <div className="ccm-title" style={{ marginBottom: 6 }}>Remove Client</div>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                This will permanently remove <strong style={{ color: '#1A1715' }}>{deleteClient.name}</strong> and all their data. This cannot be undone.
              </p>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Type <strong style={{ color: '#1A1715' }}>{deleteClient.name}</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={deleteClient.name}
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB',
                  borderRadius: 8, fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 20,
                }}
              />
              <div className="ccm-actions">
                <button
                  className="ccm-btn-cancel"
                  onClick={() => { setDeleteClient(null); setDeleteConfirm(''); }}
                >
                  Cancel
                </button>
                <button
                  className="adm-delete-btn"
                  disabled={deleteConfirm.trim().toLowerCase() !== deleteClient.name.toLowerCase() || deleting}
                  onClick={handleDeleteClient}
                >
                  {deleting ? 'Removing…' : 'Remove Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
