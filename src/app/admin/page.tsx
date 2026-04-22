'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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
  const MRR_MILESTONES = [2000, 6000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];
  const nextMilestone  = MRR_MILESTONES.find(m => m > totalMRR) ?? 100000;
  const prevMilestone  = MRR_MILESTONES[MRR_MILESTONES.indexOf(nextMilestone) - 1] ?? 0;
  // Progress is relative between the previous and next milestone (not from zero)
  const mrrProgress    = nextMilestone === prevMilestone ? 100
    : Math.min(Math.round(((totalMRR - prevMilestone) / (nextMilestone - prevMilestone)) * 100), 100);

  // "X Total" pill: live + paused only (cancelled excluded — they're not current clients)
  const activeClientCount = ALL_CLIENTS.filter(c => c.status !== 'cancelled').length;

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
                            <span className="adm-meet-row-date">{m.date} · {m.time}</span>
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

              {/* Calendar sync */}
              <div className="adm-biz-card" style={{ marginTop: 20 }}>
                <div className="adm-biz-card-head">
                  <span className="adm-biz-card-title">Sync to Your Calendar</span>
                  <span className="adm-subhead">New bookings will appear automatically once connected.</span>
                </div>
                <div className="adm-cal-sync-row">
                  {[
                    { name: 'Google Calendar',         key: 'google'  },
                    { name: 'Outlook / Microsoft 365', key: 'outlook' },
                    { name: 'Apple Calendar',          key: 'apple'   },
                  ].map(c => (
                    <div key={c.key} className="adm-cal-sync-tile">
                      <span className="adm-cal-sync-name">{c.name}</span>
                      <span className="adm-cal-sync-cta">Tap to connect</span>
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
              <h2 className="portal-heading" style={{ margin: 0 }}>Business Overview</h2>
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
                <div className="portal-metric-label">Meetings Booked</div>
                <div className="portal-metric-value">{periodStats?.meetings_booked ?? '—'}</div>
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
    </div>
  );
}
