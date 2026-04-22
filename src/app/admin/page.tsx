'use client';

import { Fragment, useState } from 'react';
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
  status: 'live' | 'paused';
  mrr: number;
}

interface ActivityItem {
  id: number;
  text: string;
  time: string;
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

const ACTIVE_CLIENTS: ActiveClient[] = [
  { id: 1, name: 'Sarah Mitchell', firm: 'Mitchell Wealth Advisors', status: 'live', mrr: 2000 },
  { id: 2, name: 'James Okafor',   firm: 'OFC Group',                status: 'live', mrr: 2000 },
];

const ACTIVITY_FEED: ActivityItem[] = [
  { id: 1, text: 'AI replied to Marcus Webb (Webb Capital)',       time: '2h ago'  },
  { id: 2, text: 'AI replied to Diana Solis (Solis Wealth)',       time: '4h ago'  },
  { id: 3, text: 'Kevin Marsh opted out — suppressed',             time: '3d ago'  },
  { id: 4, text: 'James Okafor submitted a website form',          time: '5d ago'  },
  { id: 5, text: 'Sarah Mitchell onboarded — campaign live',       time: '10d ago' },
];

const TABS = ['Business', 'Replies', 'Inbound', 'Pipeline', 'Opt-Outs'] as const;
type Tab = typeof TABS[number];

/* ── Component ──────────────────────────────────────────────────── */

export default function AdminPage() {
  const [activeTab, setActiveTab]   = useState<Tab>('Business');
  const [replyLog, setReplyLog]     = useState<ReplyLog[]>(REPLY_LOG);
  const router = useRouter();

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

  const flaggedCount = replyLog.filter(r => r.flagged).length;

  const totalMRR      = ACTIVE_CLIENTS.reduce((s, c) => s + c.mrr, 0);
  const setupFees     = 1000;
  const nextMilestone = 10000;

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

        {/* ══ BUSINESS ════════════════════════════════════════════ */}
        {activeTab === 'Business' && (
          <div>
            <h2 className="portal-heading" style={{ marginBottom: 28 }}>Business Overview</h2>

            <div className="portal-metrics" style={{ marginBottom: 28 }}>
              {[
                { label: 'MRR',             value: `$${totalMRR.toLocaleString()}` },
                { label: 'Emails Sent',     value: '—' },
                { label: 'Total Replies',   value: '—' },
                { label: 'Meetings Booked', value: '—' },
              ].map((m, i) => (
                <div key={i} className="portal-metric-card">
                  <div className="portal-metric-label">{m.label}</div>
                  <div className="portal-metric-value">{m.value}</div>
                </div>
              ))}
            </div>

            <div className="adm-biz-grid">
              <div className="adm-biz-card">
                <div className="adm-biz-card-head">
                  <span className="adm-biz-card-title">Active Clients</span>
                  <span className="adm-count-chip">{ACTIVE_CLIENTS.length}</span>
                </div>
                {ACTIVE_CLIENTS.length === 0 ? (
                  <p className="adm-empty-text">No active clients yet.</p>
                ) : (
                  <div className="adm-client-list">
                    {ACTIVE_CLIENTS.map((c, i) => (
                      <Fragment key={c.id}>
                        {i > 0 && <div className="adm-divider" />}
                        <div className="adm-client-row">
                          <div className="adm-client-avatar">
                            {c.name.split(' ').map(w => w[0]).join('')}
                          </div>
                          <div className="adm-client-info">
                            <span className="adm-client-name">{c.name}</span>
                            <span className="adm-client-firm">{c.firm}</span>
                          </div>
                          <div className="adm-client-right">
                            <span className={`adm-pill-live${c.status === 'paused' ? ' paused' : ''}`}>
                              {c.status === 'live' ? '● Live' : '● Paused'}
                            </span>
                            <button className="adm-view-btn">View →</button>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div className="adm-biz-right-col">
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
                    <div className="adm-revenue-row">
                      <span className="adm-revenue-label" style={{ color: 'var(--zs-ink-5)', fontStyle: 'italic' }}>Next milestone</span>
                      <span className="adm-revenue-val" style={{ color: 'var(--zs-ink-5)' }}>${nextMilestone.toLocaleString()} MRR</span>
                    </div>
                  </div>
                </div>

                <div className="adm-biz-card">
                  <div className="adm-biz-card-head">
                    <span className="adm-biz-card-title">Recent Activity</span>
                  </div>
                  <div className="adm-activity-list">
                    {ACTIVITY_FEED.map((item, i) => (
                      <Fragment key={item.id}>
                        {i > 0 && <div className="adm-divider" />}
                        <div className="adm-activity-row">
                          <span className="adm-activity-dot" />
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
