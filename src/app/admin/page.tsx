'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/* ── Types ─────────────────────────────────────────────────────── */

interface PendingReply {
  id: number;
  prospect: string;
  firm: string;
  email: string;
  theirMessage: string;
  aiDraft: string;
}

interface OptOut {
  id: number;
  date: string;
  name: string;
  firm: string;
  email: string;
  triggeredBy: string;
  status: 'suppressed';
}

interface PipelineLead {
  id: number;
  name: string;
  firm: string;
  whatTheySaid: string;
  reEntryDate: string;
  status: 'scheduled';
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

const PENDING_REPLIES: PendingReply[] = [
  {
    id: 1,
    prospect: 'Marcus Webb',
    firm: 'Webb Capital Partners',
    email: 'marcus@webbcapital.com',
    theirMessage: 'Thanks for reaching out — I\'m open to hearing more. What does your process look like?',
    aiDraft: 'Hi Marcus, great to hear back from you. Our process starts with a 20-minute discovery call where we map out your ideal client profile and build a targeted outreach sequence from there. We handle everything end-to-end — copywriting, sending, and reply management — so you can stay focused on closing. Would Thursday or Friday work for a quick call?',
  },
  {
    id: 2,
    prospect: 'Diana Solis',
    firm: 'Solis Wealth Management',
    email: 'diana@soliswealth.com',
    theirMessage: 'I\'ve been burned by outreach agencies before. What makes you different?',
    aiDraft: 'Hi Diana, I completely understand that hesitation — it\'s the most common thing we hear. The difference with ZionShift is that we don\'t do blast campaigns. Every sequence is written specifically for your firm, your voice, and your ideal client. We also only work with a small number of advisors at a time so your results don\'t get diluted. Happy to show you some recent examples if that would help.',
  },
];

const OPT_OUTS: OptOut[] = [
  { id: 1, date: 'Apr 18, 2026', name: 'Kevin Marsh', firm: 'Marsh Financial', email: 'kmarsh@marshfinancial.com', triggeredBy: 'Email sequence #3', status: 'suppressed' },
  { id: 2, date: 'Apr 14, 2026', name: 'Sandra Liu', firm: 'Liu Advisory Group', email: 'sliu@liuadvisory.com', triggeredBy: 'Email sequence #1', status: 'suppressed' },
  { id: 3, date: 'Apr 09, 2026', name: 'Tom Garrett', firm: 'Garrett Investments', email: 'tom@garrettinv.com', triggeredBy: 'Email sequence #2', status: 'suppressed' },
];

const PIPELINE_LEADS: PipelineLead[] = [
  { id: 1, name: 'Patricia Howe', firm: 'Howe Asset Management', whatTheySaid: 'Not the right time — check back in Q3.', reEntryDate: 'Jul 7, 2026', status: 'scheduled' },
  { id: 2, name: 'Derek Yuen', firm: 'Yuen Capital', whatTheySaid: 'Heading into busy season, reach out after June.', reEntryDate: 'Jun 15, 2026', status: 'scheduled' },
  { id: 3, name: 'Angela Price', firm: 'Price Wealth Partners', whatTheySaid: 'Interested but budget review is in May.', reEntryDate: 'May 20, 2026', status: 'scheduled' },
];

const INBOUND_LEADS: InboundLead[] = [
  { id: 1, date: 'Apr 20, 2026', name: 'James Okafor', email: 'jokafor@ofcgroup.com', message: 'Came across your site and wanted to learn more about how the outreach works. We\'re a mid-size RIA and want to grow our HNW book.', status: 'new' },
  { id: 2, date: 'Apr 17, 2026', name: 'Beth Navarro', email: 'beth@navarrowm.com', message: 'A colleague recommended ZionShift. Looking for a demo if possible.', status: 'replied' },
  { id: 3, date: 'Apr 11, 2026', name: 'Carter Flynn', email: 'carter@flynnfinancial.com', message: 'Interested in a proposal. We manage about $400M AUM and want to expand to UHNW prospects.', status: 'new' },
];

const ACTIVE_CLIENTS: ActiveClient[] = [
  { id: 1, name: 'Sarah Mitchell', firm: 'Mitchell Wealth Advisors', status: 'live', mrr: 2000 },
  { id: 2, name: 'James Okafor', firm: 'OFC Group', status: 'live', mrr: 2000 },
];

const ACTIVITY_FEED: ActivityItem[] = [
  { id: 1, text: 'Marcus Webb replied to sequence #2', time: '2h ago' },
  { id: 2, text: 'Diana Solis replied to sequence #1', time: '4h ago' },
  { id: 3, text: 'Kevin Marsh opted out — suppressed', time: '3d ago' },
  { id: 4, text: 'James Okafor submitted a website form', time: '5d ago' },
  { id: 5, text: 'Sarah Mitchell onboarded — campaign live', time: '10d ago' },
];

/* ── Nav tabs ───────────────────────────────────────────────────── */

const TABS = ['Replies', 'Opt-Outs', 'Pipeline', 'Inbound', 'Business'] as const;
type Tab = typeof TABS[number];

/* ── Component ──────────────────────────────────────────────────── */

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Replies');
  const [replies, setReplies]     = useState<PendingReply[]>(PENDING_REPLIES);
  const [editId, setEditId]       = useState<number | null>(null);
  const [editText, setEditText]   = useState('');
  const router = useRouter();

  async function handleSignOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  }

  /* Reply actions */
  function approveReply(id: number) {
    // TODO: send via Smartlead API
    setReplies(r => r.filter(x => x.id !== id));
  }
  function skipReply(id: number) {
    setReplies(r => r.filter(x => x.id !== id));
  }
  function startEdit(r: PendingReply) {
    setEditId(r.id);
    setEditText(r.aiDraft);
  }
  function saveEdit(id: number) {
    setReplies(r => r.map(x => x.id === id ? { ...x, aiDraft: editText } : x));
    setEditId(null);
  }
  function approveAll() { setReplies([]); }
  function skipAll()    { setReplies([]); }

  const totalMRR    = ACTIVE_CLIENTS.reduce((s, c) => s + c.mrr, 0);
  const setupFees   = 1000; // placeholder
  const nextMilestone = 10000;

  return (
    <div className="ad-page">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <header className="ad-nav">
        <div className="ad-nav-inner">

          {/* Left: logo mark */}
          <div className="ad-brand">
            <div className="ad-brand-mark">A</div>
            <span className="ad-brand-name">ZionShift</span>
          </div>

          {/* Center: tabs */}
          <nav className="ad-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`ad-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === 'Replies' && replies.length > 0 && (
                  <span className="ad-tab-badge">{replies.length}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Right: user + sign out */}
          <div className="ad-nav-right">
            <span className="ad-user-name">Ryan Flores</span>
            <div className="ad-avatar">RF</div>
            <button className="ad-signout" onClick={handleSignOut}>Sign out</button>
          </div>

        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="ad-main">

        {/* ── REPLIES ── */}
        {activeTab === 'Replies' && (
          <div>
            <div className="ad-section-head">
              <div>
                <p className="ad-eyebrow">Operations</p>
                <h2 className="ad-heading">Pending Replies</h2>
                <p className="ad-subhead">Review and approve AI-drafted responses before they send.</p>
              </div>
              {replies.length > 0 && (
                <div className="ad-bulk-actions">
                  <button className="ad-btn-ghost" onClick={skipAll}>Skip all</button>
                  <button className="ad-btn-primary" onClick={approveAll}>Approve all</button>
                </div>
              )}
            </div>

            {replies.length === 0 ? (
              <div className="ad-empty">
                <div className="ad-empty-icon">✓</div>
                <p>All caught up.</p>
                <span>No pending replies right now.</span>
              </div>
            ) : (
              <div className="ad-reply-list">
                {replies.map(r => (
                  <div key={r.id} className="ad-reply-card">
                    {/* Prospect header */}
                    <div className="ad-reply-header">
                      <div className="ad-reply-avatar">
                        {r.prospect.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div className="ad-reply-who">
                        <span className="ad-reply-name">{r.prospect}</span>
                        <span className="ad-reply-firm">{r.firm} · {r.email}</span>
                      </div>
                    </div>

                    {/* Their message */}
                    <div className="ad-reply-their">
                      <span className="ad-reply-label">Their reply</span>
                      <p className="ad-reply-quote">&ldquo;{r.theirMessage}&rdquo;</p>
                    </div>

                    {/* AI draft */}
                    <div className="ad-reply-draft">
                      <div className="ad-reply-label-row">
                        <span className="ad-reply-label">AI draft</span>
                        <span className="ad-ai-badge">AI</span>
                      </div>
                      {editId === r.id ? (
                        <textarea
                          className="ad-reply-textarea"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={5}
                        />
                      ) : (
                        <p className="ad-reply-draft-text">{r.aiDraft}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ad-reply-actions">
                      <button className="ad-btn-ghost-sm" onClick={() => skipReply(r.id)}>Skip</button>
                      {editId === r.id ? (
                        <button className="ad-btn-ghost-sm" onClick={() => saveEdit(r.id)}>Save</button>
                      ) : (
                        <button className="ad-btn-ghost-sm" onClick={() => startEdit(r)}>Edit</button>
                      )}
                      <button className="ad-btn-primary-sm" onClick={() => approveReply(r.id)}>
                        Approve &amp; Send
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OPT-OUTS ── */}
        {activeTab === 'Opt-Outs' && (
          <div>
            <div className="ad-section-head">
              <div>
                <p className="ad-eyebrow">Operations</p>
                <h2 className="ad-heading">Opt-Out Log</h2>
                <p className="ad-subhead">Read-only CAN-SPAM compliance record. All opt-outs are permanently suppressed.</p>
              </div>
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
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
                      <td className="ad-td-muted">{o.date}</td>
                      <td className="ad-td-bold">{o.name}</td>
                      <td className="ad-td-muted">{o.firm}</td>
                      <td className="ad-td-mono">{o.email}</td>
                      <td className="ad-td-muted">{o.triggeredBy}</td>
                      <td><span className="ad-pill-green">Suppressed ✓</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PIPELINE ── */}
        {activeTab === 'Pipeline' && (
          <div>
            <div className="ad-section-head">
              <div>
                <p className="ad-eyebrow">Operations</p>
                <h2 className="ad-heading">Future Pipeline</h2>
                <p className="ad-subhead">Not-now leads with scheduled re-entry dates.</p>
              </div>
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
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
                      <td className="ad-td-bold">{p.name}</td>
                      <td className="ad-td-muted">{p.firm}</td>
                      <td className="ad-td-italic">&ldquo;{p.whatTheySaid}&rdquo;</td>
                      <td className="ad-td-muted">{p.reEntryDate}</td>
                      <td><span className="ad-pill-amber">Scheduled</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── INBOUND ── */}
        {activeTab === 'Inbound' && (
          <div>
            <div className="ad-section-head">
              <div>
                <p className="ad-eyebrow">Operations</p>
                <h2 className="ad-heading">Website Inbound</h2>
                <p className="ad-subhead">Form fills submitted from zionshift.com.</p>
              </div>
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
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
                      <td className="ad-td-muted">{lead.date}</td>
                      <td className="ad-td-bold">{lead.name}</td>
                      <td className="ad-td-mono">{lead.email}</td>
                      <td className="ad-td-message">{lead.message}</td>
                      <td>
                        {lead.status === 'new'
                          ? <span className="ad-pill-dark">New</span>
                          : <span className="ad-pill-outline">Replied</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BUSINESS ── */}
        {activeTab === 'Business' && (
          <div>
            <div className="ad-section-head">
              <div>
                <p className="ad-eyebrow">Business</p>
                <h2 className="ad-heading">Overview</h2>
                <p className="ad-subhead">Your numbers at a glance.</p>
              </div>
            </div>

            {/* Metric cards */}
            <div className="ad-metrics">
              {[
                { label: 'MRR',             value: `$${totalMRR.toLocaleString()}` },
                { label: 'Emails Sent',     value: '—' },
                { label: 'Total Replies',   value: '—' },
                { label: 'Meetings Booked', value: '—' },
              ].map((m, i) => (
                <div key={i} className="ad-metric-card">
                  <div className="ad-metric-label">{m.label}</div>
                  <div className="ad-metric-value">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Bottom two-column layout */}
            <div className="ad-biz-grid">

              {/* Active clients */}
              <div className="ad-biz-card">
                <div className="ad-biz-card-head">
                  <span className="ad-biz-card-title">Active Clients</span>
                  <span className="ad-biz-card-count">{ACTIVE_CLIENTS.length}</span>
                </div>
                <div className="ad-client-list">
                  {ACTIVE_CLIENTS.map(c => (
                    <div key={c.id} className="ad-client-row">
                      <div className="ad-client-avatar">
                        {c.name.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div className="ad-client-info">
                        <span className="ad-client-name">{c.name}</span>
                        <span className="ad-client-firm">{c.firm}</span>
                      </div>
                      <div className="ad-client-right">
                        <span className={`ad-pill-live${c.status === 'paused' ? ' paused' : ''}`}>
                          {c.status === 'live' ? '● Live' : '● Paused'}
                        </span>
                        <button className="ad-view-btn">View →</button>
                      </div>
                    </div>
                  ))}
                  {ACTIVE_CLIENTS.length === 0 && (
                    <p className="ad-biz-empty">No active clients yet.</p>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="ad-biz-right-col">

                {/* Revenue card */}
                <div className="ad-biz-card ad-revenue-card">
                  <div className="ad-biz-card-head">
                    <span className="ad-biz-card-title">Revenue</span>
                  </div>
                  <div className="ad-revenue-rows">
                    <div className="ad-revenue-row">
                      <span className="ad-revenue-label">Monthly Retainers</span>
                      <span className="ad-revenue-val">${totalMRR.toLocaleString()}</span>
                    </div>
                    <div className="ad-divider" />
                    <div className="ad-revenue-row">
                      <span className="ad-revenue-label">Setup Fees (all-time)</span>
                      <span className="ad-revenue-val">${setupFees.toLocaleString()}</span>
                    </div>
                    <div className="ad-divider" />
                    <div className="ad-revenue-row">
                      <span className="ad-revenue-label ad-revenue-milestone">Next milestone</span>
                      <span className="ad-revenue-val ad-revenue-milestone">${nextMilestone.toLocaleString()} MRR</span>
                    </div>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="ad-biz-card">
                  <div className="ad-biz-card-head">
                    <span className="ad-biz-card-title">Recent Activity</span>
                  </div>
                  <div className="ad-activity-list">
                    {ACTIVITY_FEED.map((item, i) => (
                      <Fragment key={item.id}>
                        {i > 0 && <div className="ad-divider" />}
                        <div className="ad-activity-row">
                          <span className="ad-activity-dot" />
                          <span className="ad-activity-text">{item.text}</span>
                          <span className="ad-activity-time">{item.time}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
