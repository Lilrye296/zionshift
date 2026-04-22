'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/* ── Calendar icons (shared with client dashboard) ─────────────── */

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

interface ReplyLog {
  id: number;
  prospect: string;
  firm: string;
  email: string;
  theirMessage: string;
  aiSent: string;      // what the AI auto-sent — read-only
  sentAt: string;
  flagged: boolean;
}

interface OptOut {
  id: number;
  date: string;
  name: string;
  firm: string;
  email: string;
  triggeredBy: string;
}

interface PipelineLead {
  id: number;
  name: string;
  firm: string;
  whatTheySaid: string;
  reEntryDate: string;
}

interface InboundLead {
  id: number;
  date: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'replied';
}

interface ActiveClient {
  id: number;
  name: string;
  firm: string;
  status: 'live' | 'paused' | 'cancelled';
  mrr: number;           // monthly retainer amount in dollars
  since: string;         // onboarded date label
  firstMonthPaid: boolean; // true only after first $2k monthly charge clears
  setupFeePaid: boolean;   // true as soon as $1k setup payment is confirmed
}

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  type: 'onboard' | 'churn' | 'milestone' | 'meeting' | 'mrr';
}

// Period-scoped metrics — populated from Supabase when wired up.
// TODO (Supabase): fetch from an aggregated view that sums across all active clients
//   for the selected period. Shape mirrors Smartlead campaign stats.
interface AdminPeriodStats {
  emails_sent:     number | null;
  total_replies:   number | null;
  meetings_booked: number | null;
}

/* ── Static placeholder data ────────────────────────────────────── */

const REPLY_LOG: ReplyLog[] = [
  {
    id: 1,
    prospect: 'Marcus Webb',
    firm: 'Webb Capital Partners',
    email: 'marcus@webbcapital.com',
    theirMessage: 'Thanks for reaching out — I\'m open to hearing more. What does your process look like?',
    aiSent: 'Hi Marcus, great to hear back from you. Our process starts with a 20-minute discovery call where we map out your ideal client profile and build a targeted outreach sequence from there. We handle everything end-to-end — copywriting, sending, and reply management — so you can stay focused on closing. Would Thursday or Friday work for a quick call?',
    sentAt: 'Apr 21, 2026 · 10:14 AM',
    flagged: false,
  },
  {
    id: 2,
    prospect: 'Diana Solis',
    firm: 'Solis Wealth Management',
    email: 'diana@soliswealth.com',
    theirMessage: 'I\'ve been burned by outreach agencies before. What makes you different?',
    aiSent: 'Hi Diana, I completely understand that hesitation — it\'s the most common thing we hear. The difference with ZionShift is that we don\'t do blast campaigns. Every sequence is written specifically for your firm, your voice, and your ideal client. We also only work with a small number of advisors at a time so your results don\'t get diluted. Happy to show you some recent examples if that would help.',
    sentAt: 'Apr 21, 2026 · 8:02 AM',
    flagged: false,
  },
];

const OPT_OUTS: OptOut[] = [
  { id: 1, date: 'Apr 18, 2026', name: 'Kevin Marsh',   firm: 'Marsh Financial',     email: 'kmarsh@marshfinancial.com', triggeredBy: 'Email sequence #3' },
  { id: 2, date: 'Apr 14, 2026', name: 'Sandra Liu',    firm: 'Liu Advisory Group',  email: 'sliu@liuadvisory.com',      triggeredBy: 'Email sequence #1' },
  { id: 3, date: 'Apr 09, 2026', name: 'Tom Garrett',   firm: 'Garrett Investments', email: 'tom@garrettinv.com',        triggeredBy: 'Email sequence #2' },
];

const PIPELINE_LEADS: PipelineLead[] = [
  { id: 1, name: 'Patricia Howe', firm: 'Howe Asset Management',  whatTheySaid: 'Not the right time — check back in Q3.',          reEntryDate: 'Jul 7, 2026'  },
  { id: 2, name: 'Derek Yuen',    firm: 'Yuen Capital',           whatTheySaid: 'Heading into busy season, reach out after June.',  reEntryDate: 'Jun 15, 2026' },
  { id: 3, name: 'Angela Price',  firm: 'Price Wealth Partners',  whatTheySaid: 'Interested but budget review is in May.',          reEntryDate: 'May 20, 2026' },
];

const INBOUND_LEADS: InboundLead[] = [
  { id: 1, date: 'Apr 20, 2026', name: 'James Okafor',  email: 'jokafor@ofcgroup.com',      message: 'Came across your site and wanted to learn more about how the outreach works. We\'re a mid-size RIA looking to grow our HNW book.', status: 'new'    },
  { id: 2, date: 'Apr 17, 2026', name: 'Beth Navarro',  email: 'beth@navarrowm.com',        message: 'A colleague recommended ZionShift. Looking for a demo if possible.',                                                               status: 'replied' },
  { id: 3, date: 'Apr 11, 2026', name: 'Carter Flynn',  email: 'carter@flynnfinancial.com', message: 'Interested in a proposal. We manage about $400M AUM and want to expand to UHNW prospects.',                                        status: 'new'    },
];

// TODO (Supabase): replace ALL_CLIENTS with a live fetch from the clients table.
// Fields populated by: Stripe webhook (setupFeePaid, firstMonthPaid), onboarding form (since, status).
// MRR card only counts clients where firstMonthPaid === true.
// Setup fees count clients where setupFeePaid === true.
const ALL_CLIENTS: ActiveClient[] = [
  // firstMonthPaid: false — both clients are within their first 30 days, no monthly charge yet
  { id: 1, name: 'Sarah Mitchell', firm: 'Mitchell Wealth Advisors', status: 'live', mrr: 2000, since: 'Apr 11, 2026', firstMonthPaid: false, setupFeePaid: true  },
  { id: 2, name: 'James Okafor',   firm: 'OFC Group',                status: 'live', mrr: 2000, since: 'Apr 20, 2026', firstMonthPaid: false, setupFeePaid: true  },
  // Example paused/cancelled (uncomment to test UI):
  // { id: 3, name: 'Beth Navarro',  firm: 'Navarro WM',         status: 'paused',    mrr: 2000, since: 'Mar 1, 2026',  firstMonthPaid: true,  setupFeePaid: true  },
  // { id: 4, name: 'Carter Flynn',  firm: 'Flynn Financial',    status: 'cancelled', mrr: 0,    since: 'Feb 1, 2026',  firstMonthPaid: false, setupFeePaid: true  },
];

// TODO (Supabase): replace ACTIVITY_FEED with a live fetch from the business_events table.
// Events written by: onboarding webhook (onboard), Stripe webhook (mrr, churn), Calendly webhook (meeting).
const ACTIVITY_FEED: ActivityItem[] = [
  { id: 1, text: 'James Okafor onboarded — campaign going live',  time: 'Apr 20', type: 'onboard' },
  { id: 2, text: 'Setup fee received — James Okafor ($1,000)',     time: 'Apr 20', type: 'mrr'     },
  { id: 3, text: 'Meeting booked via Calendly — prospect TBD',     time: 'Apr 18', type: 'meeting' },
  { id: 4, text: 'Sarah Mitchell onboarded — campaign going live', time: 'Apr 11', type: 'onboard' },
  { id: 5, text: 'Setup fee received — Sarah Mitchell ($1,000)',   time: 'Apr 11', type: 'mrr'     },
];

// TODO (Calendly): replace with live webhook data from Supabase meetings table.
// Each booking from Calendly fires a webhook → Supabase insert → this list updates.
interface ProspectMeeting {
  id: number;
  prospect: string;
  firm: string;
  date: string;       // e.g. "Apr 24, 2026"
  day: number;        // day of month for calendar dot
  time: string;       // e.g. "10:00 AM"
  zoomUrl: string;
  status: 'upcoming' | 'completed' | 'no-show';
}

const PROSPECT_MEETINGS: ProspectMeeting[] = [
  { id: 1, prospect: 'Carter Flynn',   firm: 'Flynn Financial',        date: 'Apr 24, 2026', day: 24, time: '10:00 AM', zoomUrl: 'https://zoom.us/j/placeholder', status: 'upcoming'  },
  { id: 2, prospect: 'James Okafor',   firm: 'OFC Group',              date: 'Apr 22, 2026', day: 22, time: '2:00 PM',  zoomUrl: 'https://zoom.us/j/placeholder', status: 'upcoming'  },
  { id: 3, prospect: 'Beth Navarro',   firm: 'Navarro Wealth Mgmt',    date: 'Apr 17, 2026', day: 17, time: '11:00 AM', zoomUrl: 'https://zoom.us/j/placeholder', status: 'completed' },
  { id: 4, prospect: 'Marcus Webb',    firm: 'Webb Capital Partners',  date: 'Apr 14, 2026', day: 14, time: '3:00 PM',  zoomUrl: 'https://zoom.us/j/placeholder', status: 'completed' },
  { id: 5, prospect: 'Diana Solis',    firm: 'Solis Wealth Management',date: 'Apr 10, 2026', day: 10, time: '9:00 AM',  zoomUrl: 'https://zoom.us/j/placeholder', status: 'no-show'   },
];

// Milestone ladder — defined outside component so it isn't re-created on every render
// $2k → $6k → $10k → then $10k increments to $100k
const MRR_MILESTONES = [2000, 6000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];

const DOW_LABELS = ['S','M','T','W','T','F','S'];
const MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const TABS = ['Overview', 'Meetings', 'Replies', 'Inbound', 'Pipeline', 'Opt-Outs'] as const;
type Tab = typeof TABS[number];

/* ── Component ──────────────────────────────────────────────────── */

type MetricPeriod = 'week' | 'month' | 'alltime';
const PERIOD_LABEL: Record<MetricPeriod, string> = { week: 'This Week', month: 'This Month', alltime: 'All Time' };

export default function AdminPage() {
  const [activeTab, setActiveTab]         = useState<Tab>('Overview');
  const [replyLog, setReplyLog]           = useState<ReplyLog[]>(REPLY_LOG);
  const [metricPeriod, setMetricPeriod]   = useState<MetricPeriod>('alltime');
  const [periodOpen, setPeriodOpen]       = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ProspectMeeting | null>(null);
  const [connectedCal, setConnectedCal]       = useState<CalProvider | null>(null);
  const [calModal, setCalModal]               = useState<CalProvider | null>(null);
  // TODO (Supabase + Smartlead): replace null with real aggregated stats per period.
  // Query Supabase view that sums Smartlead campaign stats across all active clients.
  const [periodStats, setPeriodStats]     = useState<AdminPeriodStats | null>(null);
  const periodRef                         = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // TODO (Supabase): when wired, fire a period-filtered query here.
  // For now mirrors null (shows —) until Supabase is connected.
  useEffect(() => {
    setPeriodStats(null);
    // Example future query:
    // const { data } = await supabase.from('admin_period_stats').select('*').eq('period', metricPeriod).single();
    // setPeriodStats(data);
  }, [metricPeriod]);

  async function handleSignOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  }

  function toggleFlag(id: number) {
    setReplyLog(log => log.map(r => r.id === id ? { ...r, flagged: !r.flagged } : r));
  }

  // TODO (Supabase): replace ALL_CLIENTS with a live fetch from the clients table.
  // ALL_CLIENTS is placeholder — swap for: supabase.from('clients').select('*')

  // MRR = only clients whose first monthly payment has cleared (not setup fees)
  const totalMRR  = ALL_CLIENTS
    .filter(c => c.firstMonthPaid)
    .reduce((s, c) => s + c.mrr, 0);

  // Setup fees = all clients who paid the $1k setup (regardless of monthly status)
  const setupFees = ALL_CLIENTS.filter(c => c.setupFeePaid).length * 1000;

  // Milestone ladder: $2k → $6k → $10k → $20k → $30k → ... → $100k
  // Milestones track MRR only — setup fees never move this bar
  const nextMilestone  = MRR_MILESTONES.find(m => m > totalMRR) ?? 100000;
  const prevMilestone  = MRR_MILESTONES[MRR_MILESTONES.indexOf(nextMilestone) - 1] ?? 0;
  // Progress is relative between the previous and next milestone (not from zero)
  const mrrProgress    = nextMilestone === prevMilestone ? 100
    : Math.min(Math.round(((totalMRR - prevMilestone) / (nextMilestone - prevMilestone)) * 100), 100);

  // "X Total" pill: live + paused only (cancelled excluded — they're not current clients)
  const activeClientCount = ALL_CLIENTS.filter(c => c.status !== 'cancelled').length;

  // Reply Rate = (total_replies / emails_sent) × 100, shown as a percentage
  // TODO (Supabase + Smartlead): derived from periodStats once wired — shows '—' until then
  const replyRate: string = (
    periodStats?.emails_sent != null &&
    periodStats.emails_sent > 0 &&
    periodStats?.total_replies != null
  )
    ? `${((periodStats.total_replies / periodStats.emails_sent) * 100).toFixed(1)}%`
    : '—';

  const flaggedCount = replyLog.filter(r => r.flagged).length;

  return (
    <div className="portal-page">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="portal-nav">
        <div className="portal-nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <a href="/"><img src="/logo.png" alt="ZionShift" className="portal-logo" /></a>
          <span className="adm-center-label">Admin Portal</span>
          <button className="btn btn-ghost" onClick={handleSignOut} style={{ fontSize: 13, padding: '8px 16px' }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="portal-main">

        {/* ── Tab pills ── */}
        <div className="cd-tabs" style={{ marginBottom: 32 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`cd-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Replies' && flaggedCount > 0 && (
                <span className="adm-badge adm-badge-flag">{flaggedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══ MEETINGS ════════════════════════════════════════════ */}
        {activeTab === 'Meetings' && (() => {
          const now         = new Date();
          const year        = now.getFullYear();
          const month       = now.getMonth();
          const today       = now.getDate();
          const firstDay    = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const meetingDays = new Set(PROSPECT_MEETINGS.map(m => m.day));

          const cells: (number | null)[] = [];
          for (let i = 0; i < firstDay; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          while (cells.length % 7 !== 0) cells.push(null);

          const upcoming  = PROSPECT_MEETINGS.filter(m => m.status === 'upcoming');

          return (
            <div>
              {/* Header */}
              <div className="adm-section-head" style={{ marginBottom: 28 }}>
                <div>
                  <h2 className="portal-heading" style={{ marginBottom: 6 }}>Meetings</h2>
                  <p className="adm-subhead">Discovery calls booked by prospects via Calendly.</p>
                </div>
                <div className="adm-meetings-stats">
                  <div className="adm-meet-stat">
                    <span className="adm-meet-stat-val">{upcoming.length}</span>
                    <span className="adm-meet-stat-label">Upcoming</span>
                  </div>
                  <div className="adm-meet-stat-divider" />
                  <div className="adm-meet-stat">
                    <span className="adm-meet-stat-val">{PROSPECT_MEETINGS.filter(m => m.status === 'completed').length}</span>
                    <span className="adm-meet-stat-label">Completed</span>
                  </div>
                  <div className="adm-meet-stat-divider" />
                  <div className="adm-meet-stat">
                    <span className="adm-meet-stat-val">{PROSPECT_MEETINGS.filter(m => m.status === 'no-show').length}</span>
                    <span className="adm-meet-stat-label">No-show</span>
                  </div>
                </div>
              </div>

              <div className="adm-meet-grid">

                {/* Calendar */}
                <div className="adm-biz-card" style={{ padding: '24px' }}>
                  <div className="adm-biz-card-head">
                    <span className="adm-biz-card-title">{MONTH_NAMES_FULL[month]} {year}</span>
                  </div>
                  <div className="adm-cal-dow">
                    {DOW_LABELS.map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                  <div className="adm-cal-grid">
                    {cells.map((d, i) => (
                      <button
                        key={i}
                        disabled={!d || !meetingDays.has(d)}
                        onClick={() => {
                          if (!d) return;
                          const m = PROSPECT_MEETINGS.find(x => x.day === d);
                          setSelectedMeeting(m ?? null);
                        }}
                        className={[
                          'adm-cal-cell',
                          !d                      ? 'empty'    : '',
                          d === today             ? 'today'    : '',
                          d && meetingDays.has(d) ? 'has-meet' : '',
                          selectedMeeting?.day === d ? 'selected' : '',
                        ].join(' ').trim()}
                      >
                        {d ?? ''}
                        {d && meetingDays.has(d) && <span className="adm-cal-dot" />}
                      </button>
                    ))}
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
                          {selectedMeeting.status === 'upcoming'  ? 'Upcoming'  :
                           selectedMeeting.status === 'completed' ? 'Completed' : 'No-show'}
                        </span>
                      </div>
                      <div className="adm-meet-detail-row">
                        <span className="adm-meet-detail-label">Date &amp; Time</span>
                        <span className="adm-meet-detail-val">{selectedMeeting.date} · {selectedMeeting.time}</span>
                      </div>
                      {selectedMeeting.status === 'upcoming' && (
                        <a
                          href={selectedMeeting.zoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="adm-zoom-btn"
                        >
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
                      <span className="adm-count-chip">{PROSPECT_MEETINGS.length} Total</span>
                    </div>
                  </div>
                  <div className="adm-meet-log">
                    {PROSPECT_MEETINGS.map((m, i) => (
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
                              {m.status === 'upcoming'  ? 'Upcoming'  :
                               m.status === 'completed' ? 'Completed' : 'No-show'}
                            </span>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>

              </div>

              {/* Calendar sync — matches client dashboard */}
              <div className="cd-card cd-cal-sync" style={{ marginTop: 20 }}>
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
          );
        })()}

        {/* ══ REPLIES — read-only auto-send log ═══════════════════ */}
        {activeTab === 'Replies' && (
          <div>
            <div className="adm-section-head">
              <div>
                <h2 className="portal-heading" style={{ marginBottom: 6 }}>Reply Log</h2>
                <p className="adm-subhead">
                  All replies are sent automatically. Flag any exchange that looks off for later review.
                </p>
              </div>
              <div className="adm-log-meta">
                <span className="adm-log-count">{replyLog.length} exchanges today</span>
                {flaggedCount > 0 && (
                  <span className="adm-flag-count">⚑ {flaggedCount} flagged</span>
                )}
              </div>
            </div>

            {replyLog.length === 0 ? (
              <div className="portal-tab-body portal-empty">
                <p>No replies yet today.</p>
                <span>Auto-sent exchanges will appear here.</span>
              </div>
            ) : (
              <div className="adm-reply-list">
                {replyLog.map(r => (
                  <div key={r.id} className={`adm-reply-card${r.flagged ? ' flagged' : ''}`}>

                    {/* Header row */}
                    <div className="adm-reply-header">
                      <div className="adm-reply-avatar">
                        {r.prospect.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div className="adm-reply-who">
                        <div className="adm-reply-name">{r.prospect}</div>
                        <div className="adm-reply-meta">{r.firm} &middot; {r.email}</div>
                      </div>
                      <div className="adm-reply-header-right">
                        <span className="adm-sent-time">{r.sentAt}</span>
                        <button
                          className={`adm-flag-btn${r.flagged ? ' active' : ''}`}
                          onClick={() => toggleFlag(r.id)}
                          title={r.flagged ? 'Remove flag' : 'Flag this exchange'}
                        >
                          ⚑ {r.flagged ? 'Flagged' : 'Flag'}
                        </button>
                      </div>
                    </div>

                    {/* Their message */}
                    <div className="adm-their-block">
                      <span className="adm-block-label">Their reply</span>
                      <p className="adm-their-text">&ldquo;{r.theirMessage}&rdquo;</p>
                    </div>

                    {/* AI auto-sent */}
                    <div className="adm-draft-block">
                      <div className="adm-block-label-row">
                        <span className="adm-block-label">AI auto-sent</span>
                        <span className="adm-auto-chip">Sent automatically</span>
                      </div>
                      <p className="adm-draft-text">{r.aiSent}</p>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ INBOUND ═════════════════════════════════════════════ */}
        {activeTab === 'Inbound' && (
          <div>
            <div className="adm-section-head" style={{ marginBottom: 24 }}>
              <div>
                <h2 className="portal-heading" style={{ marginBottom: 6 }}>Website Inbound</h2>
                <p className="adm-subhead">Form fills submitted from zionshift.com.</p>
              </div>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Message</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {INBOUND_LEADS.map(lead => (
                    <tr key={lead.id}>
                      <td className="adm-td-muted">{lead.date}</td>
                      <td className="adm-td-bold">{lead.name}</td>
                      <td className="adm-td-mono">{lead.email}</td>
                      <td className="adm-td-message">{lead.message}</td>
                      <td>
                        {lead.status === 'new'
                          ? <span className="adm-pill-dark">New</span>
                          : <span className="adm-pill-outline">Replied</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ PIPELINE ════════════════════════════════════════════ */}
        {activeTab === 'Pipeline' && (
          <div>
            <div className="adm-section-head" style={{ marginBottom: 24 }}>
              <div>
                <h2 className="portal-heading" style={{ marginBottom: 6 }}>Future Pipeline</h2>
                <p className="adm-subhead">Not-now leads with scheduled re-entry dates.</p>
              </div>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Firm</th>
                    <th>What They Said</th>
                    <th>Re-Entry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PIPELINE_LEADS.map(p => (
                    <tr key={p.id}>
                      <td className="adm-td-bold">{p.name}</td>
                      <td className="adm-td-muted">{p.firm}</td>
                      <td className="adm-td-italic">&ldquo;{p.whatTheySaid}&rdquo;</td>
                      <td className="adm-td-muted">{p.reEntryDate}</td>
                      <td><span className="adm-pill-amber">Scheduled</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ OVERVIEW ════════════════════════════════════════════ */}
        {activeTab === 'Overview' && (
          <div>
            {/* Heading + period toggle — uses same cd-period-* classes as client dashboard */}
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

            {/* Metric cards — MRR is always current; others are period-scoped */}
            {/* TODO (Supabase): periodStats populated from admin_period_stats view */}
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

            <div className="adm-biz-grid">

              {/* Clients — all statuses, scrollable */}
              {/* TODO (Supabase): replace ALL_CLIENTS with live fetch from clients table */}
              <div className="adm-biz-card">
                <div className="adm-biz-card-head">
                  <span className="adm-biz-card-title">Clients</span>
                  <span className="adm-count-chip">{activeClientCount} Total</span>
                </div>
                {ALL_CLIENTS.length === 0 ? (
                  <p className="adm-empty-text">No clients yet.</p>
                ) : (
                  <div className="adm-client-scroll">
                    {ALL_CLIENTS.map((c, i) => (
                      <Fragment key={c.id}>
                        {i > 0 && <div className="adm-divider" />}
                        <div className="adm-client-row">
                          <div className={`adm-client-avatar${c.status !== 'live' ? ' inactive' : ''}`}>
                            {c.name.split(' ').map(w => w[0]).join('')}
                          </div>
                          <div className="adm-client-info">
                            <span className="adm-client-name">{c.name}</span>
                            <span className="adm-client-firm">{c.firm} · since {c.since}</span>
                            {/* Shown while client is within first billing cycle — clears when firstMonthPaid flips true via Stripe webhook */}
                            {!c.firstMonthPaid && c.status === 'live' && (
                              <span className="adm-billing-pending">Billing pending</span>
                            )}
                          </div>
                          <div className="adm-client-right">
                            <span className={`adm-client-pill adm-client-pill--${c.status}`}>
                              ●&nbsp;{c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                            </span>
                            {/* TODO (Supabase): pass real client UUID as query param.
                                Client page will check for ?view=<id> + admin role,
                                then load that client's data instead of the logged-in user's. */}
                            <button
                              className="adm-view-btn"
                              onClick={() => router.push(`/client?view=${c.id}`)}
                            >
                              View →
                            </button>
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
                    {/* TODO (Supabase + Stripe): totalMRR sums only firstMonthPaid clients; setupFees sums all setupFeePaid clients × $1k.
                        Total Collected = all cleared payments to date. */}
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

                {/* Recent activity — business events only */}
                <div className="adm-biz-card">
                  <div className="adm-biz-card-head">
                    <span className="adm-biz-card-title">Recent Activity</span>
                  </div>
                  <div className="adm-activity-list">
                    {ACTIVITY_FEED.map((item, i) => (
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

        {/* ══ OPT-OUTS ════════════════════════════════════════════ */}
        {activeTab === 'Opt-Outs' && (
          <div>
            <div className="adm-section-head" style={{ marginBottom: 24 }}>
              <div>
                <h2 className="portal-heading" style={{ marginBottom: 6 }}>Opt-Out Log</h2>
                <p className="adm-subhead">Read-only CAN-SPAM compliance record. All opt-outs are permanently suppressed.</p>
              </div>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Firm</th>
                    <th>Email</th>
                    <th>Triggered By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {OPT_OUTS.map(o => (
                    <tr key={o.id}>
                      <td className="adm-td-muted">{o.date}</td>
                      <td className="adm-td-bold">{o.name}</td>
                      <td className="adm-td-muted">{o.firm}</td>
                      <td className="adm-td-mono">{o.email}</td>
                      <td className="adm-td-muted">{o.triggeredBy}</td>
                      <td><span className="adm-pill-green">Suppressed ✓</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Calendar connect modal — shared with Meetings tab sync section */}
      {calModal && (
        <AdminCalModal
          provider={calModal}
          isConnected={connectedCal === calModal}
          onConnect={() => setConnectedCal(calModal)}
          onDisconnect={() => setConnectedCal(null)}
          onClose={() => setCalModal(null)}
        />
      )}

    </div>
  );
}
