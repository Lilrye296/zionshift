'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface ClientProfile {
  firm_name: string;
  logo_url: string | null;
  client_name: string | null;
  emails_sent: number;
  replies: number;
  reply_rate: number;
  meetings_booked: number;
  campaign_status: string;
}

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DOW = ['S','M','T','W','T','F','S'];

function MiniCalendar({
  meetings = [],
  onDayClick,
}: {
  meetings?: CalMeeting[];
  onDayClick?: (day: number) => void;
}) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const meetingDays = meetings.map(m => m.day);

  return (
    <div className="mini-cal">
      <div className="mini-cal-header">{MONTH_NAMES[month].toUpperCase()} {year}</div>
      <div className="mini-cal-grid">
        {DOW.map((d, i) => <div key={i} className="mini-cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          const hasMeeting = day !== null && meetingDays.includes(day);
          return (
            <div
              key={i}
              className={[
                'mini-cal-day',
                day === today  ? 'today'   : '',
                hasMeeting     ? 'has-dot' : '',
                hasMeeting     ? 'clickable' : '',
              ].join(' ').trim()}
              onClick={() => hasMeeting && day && onDayClick?.(day)}
            >
              <span>{day ?? ''}</span>
              {hasMeeting && <span className="mini-cal-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Meeting Detail Modal ── */
function MeetingDetailModal({ meetings, onClose }: { meetings: CalMeeting[]; onClose: () => void }) {
  const first = meetings[0];
  const monthName = MONTH_NAMES[first.month];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-scroll">
          <div className="mdm-eyebrow">
            {meetings.length > 1
              ? `${meetings.length} ${isMeetingPast(first.day, first.time, first.month) ? 'Completed' : 'Scheduled'} Meetings`
              : isMeetingPast(first.day, first.time, first.month) ? 'Completed Meeting'
              : 'Scheduled Meeting'
            } · {monthName} {first.day}
          </div>
          {meetings.map((meeting, i) => (
            <div key={i}>
              {i > 0 && <div className="mdm-divider" />}
              <h2 className="mdm-name">{meeting.prospect}</h2>
              <div className="mdm-firm">{meeting.firm}</div>
              <div className="mdm-row" style={{ marginTop: 14 }}>
                <span className="mdm-icon">🕐</span>
                <span>{meeting.time}</span>
              </div>
              {!isMeetingPast(meeting.day, meeting.time, meeting.month) && (
                <div className="mdm-row">
                  <span className="mdm-icon">📹</span>
                  {meeting.zoomUrl ? (
                    <a href={meeting.zoomUrl} target="_blank" rel="noopener noreferrer" className="mdm-zoom-link">
                      Join Zoom Call →
                    </a>
                  ) : (
                    <span className="mdm-zoom-pending">Zoom link will appear here</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Placeholder data (replaced by Supabase per-client data later) ── */

interface CalMeeting {
  day: number;
  month: number; // 0-indexed (0 = Jan, 3 = Apr) — used for accurate date display
  prospect: string;
  firm: string;
  time: string;
  status: string;
  zoomUrl?: string;
}

const CAL_MEETINGS: CalMeeting[] = [
  { day: 11, month: 3, prospect: 'James Rivera',    firm: 'Apex Financial Services',   time: '10:00 AM EST', status: 'Completed' },
  { day: 17, month: 3, prospect: 'Sarah Mitchell',  firm: 'Clarity Point Bookkeeping', time: '2:00 PM EST',  status: 'Completed' },
  { day: 23, month: 3, prospect: 'Marcus Thompson', firm: 'Northstar CFO Group',        time: '9:00 AM EST',  status: 'Scheduled', zoomUrl: 'https://zoom.us/j/placeholder' },
  { day: 23, month: 3, prospect: 'Linda Park',      firm: 'Summit Tax Advisors',        time: '2:00 PM EST',  status: 'Scheduled', zoomUrl: 'https://zoom.us/j/placeholder2' },
];

// Activity items tagged with day number for period filtering
const ACTIVITY = [
  { label: 'Meeting booked — Marcus T., Northstar CFO', sub: 'Today, 9:14am', day: 21 },
  { label: '6 new replies received this week',           sub: 'This week',     day: 18 },
  { label: 'Email 2 delivered to 104 prospects',         sub: 'Apr 18',        day: 18 },
  { label: 'Campaign entered Week 3',                    sub: 'Apr 15',        day: 15 },
  { label: 'Initial outreach sent to 98 prospects',      sub: 'Apr 8',         day: 8  },
];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Returns true if the meeting month/day/time has already passed
function isMeetingPast(day: number, time: string, month?: number): boolean {
  const now = new Date();
  const [timePart, period] = time.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  let hour = h;
  if (period === 'PM' && h !== 12) hour += 12;
  if (period === 'AM' && h === 12) hour = 0;
  // Use the meeting's actual month if provided, otherwise fall back to current month
  const meetingMonth = month ?? now.getMonth();
  const meetingDate = new Date(now.getFullYear(), meetingMonth, day, hour, m);
  return now > meetingDate;
}

/* ── Icons ── */
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
      width="30"
      height="30"
      alt="Outlook"
    />
  );
}

/* ── Calendar Connect Modal ── */
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

function CalendarConnectModal({
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

/* ── Logo Upload Modal ── */
function LogoUploadModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (url: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);
  const [error, setError]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ['image/png', 'image/svg+xml', 'image/jpeg'];
  const MAX_MB   = 2;

  function handleFile(file: File) {
    setError('');
    if (!ACCEPTED.includes(file.type)) {
      setError('Please upload a PNG, SVG, or JPG file.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB.`);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSave() {
    if (preview) { onSave(preview); onClose(); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-scroll">
          <h2 className="lu-heading">Upload your logo</h2>
          <p className="lu-sub">This appears in the top center of your dashboard.</p>

          {/* Drop zone */}
          <div
            className={`lu-dropzone${dragging ? ' dragging' : ''}${preview ? ' has-preview' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="lu-preview" />
            ) : (
              <>
                <div className="lu-upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="lu-drop-label">Drop your file here</div>
                <div className="lu-drop-sub">or <span className="lu-browse">click to browse</span></div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".png,.svg,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {preview && (
            <button className="lu-reselect" onClick={() => inputRef.current?.click()}>
              Choose a different file
            </button>
          )}

          {error && <p className="lu-error">{error}</p>}

          {/* Requirements */}
          <div className="lu-reqs">
            <div className="lu-req-row">
              <span className="lu-req-key">Formats</span>
              <span className="lu-req-val">PNG, SVG, JPG</span>
            </div>
            <div className="lu-req-row">
              <span className="lu-req-key">Recommended size</span>
              <span className="lu-req-val">400 × 120 px or wider</span>
            </div>
            <div className="lu-req-row">
              <span className="lu-req-key">Max file size</span>
              <span className="lu-req-val">2 MB</span>
            </div>
            <div className="lu-req-row">
              <span className="lu-req-key">Background</span>
              <span className="lu-req-val">Transparent preferred (PNG or SVG)</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 20, padding: '14px' }}
            disabled={!preview}
            onClick={handleSave}
          >
            Save logo →
          </button>
        </div>
      </div>
    </div>
  );
}

// Period-scoped metric shape — populated from Supabase when wired up
interface PeriodStats {
  emails_sent: number | null;
  replies: number | null;
  reply_rate: number | null;
  meetings_booked: number | null;
}

// Billing data — populated from Stripe + Supabase when wired up
// TODO (Stripe): fetch via Stripe Customer object + subscription + invoice list
// TODO (Supabase): plan name and billing_started stored in client_stats table
interface BillingData {
  plan_name: string;          // e.g. "ZionShift", "ZionShift Growth"
  status: 'active' | 'paused' | 'cancelled';
  monthly_amount: number;     // in dollars, e.g. 2000
  billing_started: string;    // formatted date string, e.g. "Apr 11, 2026"
  next_invoice: string;       // formatted date string, e.g. "May 11, 2026"
  card_brand: string;         // e.g. "Visa"
  card_last4: string;         // e.g. "4821"
  card_expires: string;       // e.g. "09 / 28"
  stripe_portal_url: string;  // Stripe Customer Portal link for card updates only
  invoices: {
    date: string;
    description: string;
    amount: number;
    paid: boolean;
  }[];
}

/* ── Page ── */
export default function ClientPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ── All state declarations up front so effects can reference them ──────
  const [activeTab, setActiveTab]               = useState<'overview' | 'billing'>('overview');
  const [showLogoUpload, setShowLogoUpload]     = useState(false);
  const [localLogoUrl, setLocalLogoUrl]         = useState<string | null>(null);
  const [selectedDayMeetings, setSelectedDayMeetings] = useState<CalMeeting[] | null>(null);
  const [period, setPeriod]                     = useState<'week' | 'month' | 'alltime'>('month');
  const [periodOpen, setPeriodOpen]             = useState(false);
  // Holds metric totals filtered to the selected period.
  // Defaults to null (shows —) until Supabase query returns data.
  const [periodStats, setPeriodStats]           = useState<PeriodStats | null>(null);
  // Billing data — null until Stripe + Supabase are wired up (shows — placeholders).
  // TODO (Stripe/Supabase): replace BILLING_PLACEHOLDER below with a real fetch.
  const [billingData, setBillingData]           = useState<BillingData | null>(null);
  const periodRef                           = useRef<HTMLDivElement>(null);
  const [connectedCal, setConnectedCal]     = useState<CalProvider>('google');
  const [calModal, setCalModal]             = useState<CalProvider | null>(null);

  // ── Load profile from Supabase on mount ───────────────────────────────
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
        .select('firm_name, logo_url, client_name, emails_sent, replies, reply_rate, meetings_booked, campaign_status')
        .eq('client_id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  // ── Period-scoped metrics ──────────────────────────────────────────────
  // Fires whenever the user changes the period dropdown or profile loads.
  // TODO (Supabase): replace setPeriodStats below with a period-filtered query, e.g.:
  //   const { data } = await supabase
  //     .from('client_stats_by_period')
  //     .select('emails_sent, replies, reply_rate, meetings_booked')
  //     .eq('client_id', user.id)
  //     .eq('period', period)
  //     .single();
  //   setPeriodStats(data);
  // The metric cards are already wired to periodStats — no further changes needed.
  useEffect(() => {
    if (!profile) return;
    // Temporary: all periods show lifetime totals until Supabase is wired.
    setPeriodStats({
      emails_sent:     profile.emails_sent,
      replies:         profile.replies,
      reply_rate:      profile.reply_rate,
      meetings_booked: profile.meetings_booked,
    });
  }, [period, profile]);
  // ───────────────────────────────────────────────────────────────────────

  // ── Billing data ──────────────────────────────────────────────────────
  // TODO (Stripe + Supabase): replace this placeholder block with real fetches:
  //   1. GET /api/billing?clientId=user.id  (server route that calls Stripe API)
  //      → returns subscription, latest invoices, and card details
  //   2. Supabase: pull plan_name and billing_started from client_stats
  // All JSX fields below already read from billingData — swap in real data
  // and the page updates automatically with no further changes needed.
  useEffect(() => {
    // Placeholder — remove this block and replace with real Stripe fetch
    setBillingData({
      plan_name:        'ZionShift',
      status:           'active',
      monthly_amount:   2000,
      billing_started:  'Apr 11, 2026',
      next_invoice:     'May 11, 2026',
      card_brand:       'Visa',
      card_last4:       '4821',
      card_expires:     '09 / 28',
      stripe_portal_url: 'https://billing.stripe.com',
      invoices: [
        { date: 'Apr 11, 2026', description: 'Monthly retainer', amount: 2000, paid: true },
        { date: 'Mar 29, 2026', description: 'Setup fee',         amount: 1000, paid: true },
      ],
    });
  }, []);
  // ───────────────────────────────────────────────────────────────────────

  async function handleSignOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  }

  // ── Close period dropdown on outside click ────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const PERIOD_LABEL = { week: 'This Week', month: 'This Month', alltime: 'All Time' };

  const p = profile;
  const greeting  = getGreeting();
  const firstName = p?.client_name ?? null;

  function getStatusProps(status: string | null) {
    switch (status) {
      case 'warming': return { label: 'Warming Up — Day 3 of 14', variant: 'warming' };
      case 'idle':    return { label: 'Idle',                      variant: 'idle'    };
      case 'paused':  return { label: 'Paused',                    variant: 'paused'  };
      case 'error':   return { label: 'Error',                     variant: 'error'   };
      default:        return { label: 'Live — Sending',             variant: 'live'    };
    }
  }
  const statusProps = getStatusProps(p?.campaign_status ?? null);

  return (
    <div className="portal-page">

      {/* ── Nav ── */}
      <header className="portal-nav">
        <div className="portal-nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZionShift" className="portal-logo" />

          <div className="client-logo-slot">
            <div className="client-logo-clickable" onClick={() => setShowLogoUpload(true)} title="Upload your logo">
              {localLogoUrl || p?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={localLogoUrl ?? p!.logo_url!} alt={p?.firm_name ?? 'Client'} className="client-logo-img" />
              ) : p?.firm_name ? (
                <span className="client-logo-text">{p.firm_name}</span>
              ) : (
                <div className="client-logo-placeholder">Client Logo</div>
              )}
              <div className="client-logo-edit-badge" aria-hidden>✎</div>
            </div>
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

            {/* ── Tab pills ── */}
            <div className="cd-tabs">
              <button
                className={`cd-tab${activeTab === 'overview' ? ' active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`cd-tab${activeTab === 'billing' ? ' active' : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                Billing
              </button>
            </div>

            {/* ── Overview ── */}
            {activeTab === 'overview' && (<>

            {/* ── Greeting row ── */}
            <div className="cd-greeting-row">
              <h1 className="cd-greeting">{greeting}{firstName ? `, ${firstName}` : ''}.</h1>
              <div className="cd-greeting-right">
                <span className={`cd-status-badge ${statusProps.variant}`}>
                  <span className="cd-status-dot" />
                  {statusProps.label}
                </span>
                <div className="cd-period-dropdown" ref={periodRef}>
                  <button className="cd-period-btn" onClick={() => setPeriodOpen(o => !o)}>
                    {PERIOD_LABEL[period]}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {periodOpen && (
                    <div className="cd-period-menu">
                      {(['week','month','alltime'] as const).map(p => (
                        <button
                          key={p}
                          className={`cd-period-option${period === p ? ' active' : ''}`}
                          onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                        >
                          {PERIOD_LABEL[p]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Metric cards ── */}
            {/* Values come from periodStats, which updates with the period dropdown. */}
            {/* When Supabase is wired, periodStats will reflect the selected time range. */}
            <div className="cd-metrics">
              <div className="cd-metric-card">
                <div className="cd-metric-label">Emails Sent</div>
                <div className="cd-metric-value">{periodStats?.emails_sent ?? '—'}</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Replies</div>
                <div className="cd-metric-value">{periodStats?.replies ?? '—'}</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Reply Rate</div>
                <div className="cd-metric-value">
                  {periodStats?.reply_rate != null ? `${periodStats.reply_rate}%` : '—'}
                </div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Meetings Booked</div>
                <div className="cd-metric-value">{periodStats?.meetings_booked ?? '—'}</div>
              </div>
            </div>

            {/* ── Activity + Calendar ── */}
            {/* ── Activity + Calendar ── */}
            {(() => {
              const today = new Date().getDate();
              const filteredActivity = ACTIVITY.filter(a => {
                if (period === 'alltime') return true;
                if (period === 'week')  return a.day >= today - 7;
                return true; // month — all in same month
              });
              const parseTime = (t: string) => {
                const [time, pd] = t.split(' ');
                const [h, m] = time.split(':').map(Number);
                const hour = pd === 'PM' && h !== 12 ? h + 12 : pd === 'AM' && h === 12 ? 0 : h;
                return hour * 60 + m;
              };
              const sortedMeetings = [...CAL_MEETINGS].sort((a, b) => b.day - a.day || parseTime(b.time) - parseTime(a.time));
              const filteredMeetings = sortedMeetings.filter(m => {
                if (period === 'alltime') return true;
                if (period === 'week')  return m.day >= today - 7;
                return true;
              });
              return (
                <>
                  <div className="cd-mid-row">
                    <div className="cd-card">
                      <div className="cd-card-label">Recent Activity</div>
                      <div className="cd-activity-scroll">
                        <ul className="cd-activity-list">
                          {filteredActivity.length === 0 ? (
                            <li className="cd-empty-state">No activity this period.</li>
                          ) : filteredActivity.map((a, i) => (
                            <li key={i} className="cd-activity-item">
                              <span className="cd-activity-text">{a.label}</span>
                              <span className="cd-activity-sub">{a.sub}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="cd-card">
                      <MiniCalendar
                        meetings={CAL_MEETINGS}
                        onDayClick={(day) => {
                          const dayMeetings = CAL_MEETINGS
                            .filter(m => m.day === day)
                            .sort((a, b) => parseTime(a.time) - parseTime(b.time));
                          setSelectedDayMeetings(dayMeetings);
                        }}
                      />
                    </div>
                  </div>

                  {/* ── Meeting Log ── */}
                  <div className="cd-card" style={{ marginBottom: 20 }}>
                    <div className="cd-card-label" style={{ marginBottom: 18 }}>Meeting Log</div>
                    <div className="cd-table-scroll">
                      <table className="cd-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Prospect</th>
                            <th>Firm</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMeetings.length === 0 ? (
                            <tr><td colSpan={4} className="cd-empty-state" style={{ textAlign: 'center', padding: '24px 0' }}>No meetings this period.</td></tr>
                          ) : filteredMeetings.map((m, i) => (
                            <tr
                              key={i}
                              className="cd-table-row-clickable"
                              onClick={() => setSelectedDayMeetings([m])}
                            >
                              <td className="cd-td-date">{MONTH_SHORT[m.month]} {m.day}</td>
                              <td className="cd-td-name">{m.prospect}</td>
                              <td className="cd-td-firm">{m.firm}</td>
                              <td>
                                <span className={`cd-pill ${isMeetingPast(m.day, m.time, m.month) ? 'completed' : 'scheduled'}`}>
                                  {isMeetingPast(m.day, m.time, m.month) ? 'Completed' : 'Scheduled'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ── Calendar Sync ── */}
            <div className="cd-card cd-cal-sync">
              <div className="cd-cal-sync-top">
                <div>
                  <div className="cd-cal-sync-title">Sync to your calendar</div>
                  <div className="cd-cal-sync-sub">
                    Your ZionShift meetings will appear automatically on your calendar.
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

            <div className="cd-support-footer">
              Questions? Reach out anytime at <a href="mailto:ryan@zionshift.com">ryan@zionshift.com</a>
            </div>

            </>)}

            {/* ── Billing ── */}
            {activeTab === 'billing' && (
              <>
                <div className="bl-heading-row">
                  <h2 className="bl-heading">Billing</h2>
                  <p className="bl-sub">Your plan details and payment information.</p>
                </div>

                <div className="bl-grid">

                  {/* ── Left column ── */}
                  <div className="bl-col">

                    {/* Plan Details */}
                    <div className="cd-card bl-card">
                      <div className="bl-section-label">Plan Details</div>
                      <div className="bl-row">
                        <span className="bl-row-key">Plan</span>
                        <span className="bl-row-val">{billingData?.plan_name ?? '—'}</span>
                      </div>
                      <div className="bl-divider" />
                      <div className="bl-row">
                        <span className="bl-row-key">Status</span>
                        {billingData
                          ? <span className={`bl-status-pill${billingData.status !== 'active' ? ' bl-status-paused' : ''}`}>
                              ● {billingData.status.charAt(0).toUpperCase() + billingData.status.slice(1)}
                            </span>
                          : <span className="bl-row-val">—</span>
                        }
                      </div>
                      <div className="bl-divider" />
                      <div className="bl-row">
                        <span className="bl-row-key">Monthly retainer</span>
                        <span className="bl-row-val">
                          {billingData ? `$${billingData.monthly_amount.toLocaleString()} / mo` : '—'}
                        </span>
                      </div>
                      <div className="bl-divider" />
                      <div className="bl-row">
                        <span className="bl-row-key">Billing started</span>
                        <span className="bl-row-mono">{billingData?.billing_started ?? '—'}</span>
                      </div>
                      <div className="bl-divider" />
                      <div className="bl-row">
                        <span className="bl-row-key">Next invoice</span>
                        <span className="bl-row-mono">{billingData?.next_invoice ?? '—'}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="cd-card bl-card" style={{ marginTop: 16 }}>
                      <div className="bl-section-label">Payment Method</div>
                      <div className="bl-row">
                        <span className="bl-row-key">Card on file</span>
                        <span className="bl-row-val">
                          {billingData ? `${billingData.card_brand} •••• ${billingData.card_last4}` : '—'}
                        </span>
                      </div>
                      <div className="bl-divider" />
                      <div className="bl-row">
                        <span className="bl-row-key">Expires</span>
                        <span className="bl-row-mono">{billingData?.card_expires ?? '—'}</span>
                      </div>
                      <div className="bl-divider" />
                      <a
                        href={billingData?.stripe_portal_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bl-stripe-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <rect x="1" y="4" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                          <path d="M1 9h22" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                        Update payment method
                        <span className="bl-stripe-via">via Stripe →</span>
                      </a>
                    </div>

                  </div>

                  {/* ── Right column ── */}
                  <div className="bl-col">

                    {/* Invoice History */}
                    <div className="cd-card bl-card">
                      <div className="bl-section-label">Invoice History</div>
                      {(billingData?.invoices ?? []).map((inv, i) => (
                        <>
                          {i > 0 && <div key={`d-${i}`} className="bl-divider" />}
                          <div key={i} className="bl-invoice-row">
                            <span className="bl-inv-date">{inv.date}</span>
                            <span className="bl-inv-desc">{inv.description}</span>
                            <span className="bl-inv-amount">${inv.amount.toLocaleString()}</span>
                            {inv.paid && <span className="bl-inv-paid">Paid</span>}
                          </div>
                        </>
                      ))}
                    </div>

                    {/* Need to make changes */}
                    <div className="cd-card bl-card bl-changes-card" style={{ marginTop: 16 }}>
                      <div className="bl-changes-title">Need to make changes?</div>
                      <p className="bl-changes-body">
                        To update your plan or cancel your subscription, reach out directly at{' '}
                        <a href="mailto:ryan@zionshift.com" className="bl-changes-link">ryan@zionshift.com</a>.
                        {' '}We&apos;ll take care of it within one business day.
                      </p>
                      <p className="bl-changes-note">
                        No contracts. Your retainer only continues as long as you&apos;re seeing results.
                      </p>
                    </div>

                  </div>
                </div>

                <div className="cd-support-footer">
                  Questions? Reach out anytime at <a href="mailto:ryan@zionshift.com">ryan@zionshift.com</a>
                </div>
              </>
            )}

          </>
        )}
      </main>

      {showLogoUpload && (
        <LogoUploadModal
          onClose={() => setShowLogoUpload(false)}
          onSave={(url) => setLocalLogoUrl(url)}
        />
      )}

      {selectedDayMeetings && (
        <MeetingDetailModal
          meetings={selectedDayMeetings}
          onClose={() => setSelectedDayMeetings(null)}
        />
      )}

      {calModal && (
        <CalendarConnectModal
          provider={calModal}
          isConnected={connectedCal === calModal}
          onConnect={() => setConnectedCal(calModal)}
          onDisconnect={() => setConnectedCal('google')}
          onClose={() => setCalModal(null)}
        />
      )}
    </div>
  );
}
