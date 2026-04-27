'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
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

interface CalMeeting {
  day: number;
  month: number; // 0-indexed (0 = Jan, 3 = Apr)
  prospect: string;
  firm: string;
  time: string;
  zoomUrl?: string;
}

interface ActivityRow {
  label: string;
  sub: string;
  day: number;
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
  onMonthChange,
  selectedDay = null,
  selectedMonth = null,
}: {
  meetings?: CalMeeting[];
  onDayClick?: (day: number, month: number) => void;
  onMonthChange?: () => void;
  selectedDay?: number | null;
  selectedMonth?: number | null;
}) {
  const now = new Date();
  const [displayYear,  setDisplayYear]  = useState(now.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(now.getMonth());

  const curYear  = now.getFullYear();
  const curMonth = now.getMonth();
  const today    = now.getDate();
  const isCurrentMonth = displayYear === curYear && displayMonth === curMonth;

  const firstDay    = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const meetingDays = meetings.filter(m => m.month === displayMonth).map(m => m.day);

  function prevMonth() {
    onMonthChange?.();
    if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(y => y - 1); }
    else setDisplayMonth(m => m - 1);
  }
  function nextMonth() {
    onMonthChange?.();
    if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(y => y + 1); }
    else setDisplayMonth(m => m + 1);
  }

  return (
    <div>
      <div className="mini-cal-nav">
        <button className="mini-cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="mini-cal-header" style={{ margin: 0 }}>{MONTH_NAMES[displayMonth].toUpperCase()} {displayYear}</div>
        <button className="mini-cal-nav-btn" onClick={nextMonth} aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="mini-cal-grid">
        {DOW.map((d, i) => <div key={i} className="mini-cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="mini-cal-day empty" />;
          const hasMeeting  = meetingDays.includes(day);
          const isSelected  = day === selectedDay && displayMonth === selectedMonth;
          return (
            <div
              key={i}
              className={[
                'mini-cal-day',
                isCurrentMonth && day === today ? 'today'    : '',
                hasMeeting                      ? 'has-dot'  : '',
                hasMeeting                      ? 'clickable': '',
                isSelected                      ? 'selected' : '',
              ].join(' ').trim()}
              onClick={() => hasMeeting && onDayClick?.(day, displayMonth)}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtBillingDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getNextBillingDate(billingStartedAt: string): Date {
  const start = new Date(billingStartedAt);
  const msSince = Date.now() - start.getTime();
  const daysSince = msSince / (1000 * 60 * 60 * 24);
  const periods = Math.floor(daysSince / 30);
  return new Date(start.getTime() + (periods + 1) * 30 * 24 * 60 * 60 * 1000);
}

// Converts a time string like "2:00 PM EST" to total minutes
function parseTime(t: string): number {
  const [timePart, pd] = t.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  const hour = pd === 'PM' && h !== 12 ? h + 12 : pd === 'AM' && h === 12 ? 0 : h;
  return hour * 60 + m;
}

// Returns true if the meeting month/day/time has already passed
function isMeetingPast(day: number, time: string, month?: number): boolean {
  const now = new Date();
  const totalMinutes = parseTime(time);
  const meetingDate = new Date(
    now.getFullYear(),
    month ?? now.getMonth(),
    day,
    Math.floor(totalMinutes / 60),
    totalMinutes % 60,
  );
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
const LOGO_ACCEPTED_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg'];
const LOGO_MAX_MB         = 2;

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
  const inputRef  = useRef<HTMLInputElement>(null);
  const savedRef  = useRef(false);

  useEffect(() => {
    return () => { if (preview && !savedRef.current) URL.revokeObjectURL(preview); };
  }, [preview]);

  function handleFile(file: File) {
    setError('');
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a PNG, SVG, or JPG file.');
      return;
    }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) {
      setError(`File must be under ${LOGO_MAX_MB}MB.`);
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
    if (preview) { savedRef.current = true; onSave(preview); onClose(); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-scroll">
          <h2 className="lu-heading">Upload your logo</h2>
          <p className="lu-sub">This appears in the top center of your dashboard.</p>

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

/* ── Period stats interface ── */
interface PeriodStats {
  emails_sent: number | null;
  replies: number | null;
  reply_rate: number | null;
  meetings_booked: number | null;
}

interface ClientBillingRecord {
  trial_started_at:  string | null;
  trial_ends_at:     string | null;
  billing_started_at: string | null;
  billing_status:    string;
  campaign_status:   string;
  warmup_started_at: string | null;
}

interface BillingData {
  plan_name: string;
  status: 'active' | 'paused' | 'cancelled';
  monthly_amount: number;
  billing_started: string;
  next_invoice: string;
  card_brand: string;
  card_last4: string;
  card_expires: string;
  stripe_portal_url: string;
  invoices: {
    date: string;
    description: string;
    amount: number;
    status: 'paid' | 'open' | 'failed';
  }[];
}

const PERIOD_LABEL = { week: 'This Week', month: 'This Month', alltime: 'All Time' };

function getStatusProps(status: string | null, warmupStartedAt?: string | null) {
  switch (status) {
    case 'pending':
      return { label: 'Setting Up — your campaign is being configured', variant: 'idle' };
    case 'warming': {
      let day = 1;
      if (warmupStartedAt) {
        const d = Math.floor((Date.now() - new Date(warmupStartedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        day = Math.max(1, Math.min(d, 14));
      }
      return { label: `Warming Up — Day ${day} of 14`, variant: 'warming' };
    }
    case 'active':  return { label: 'Active — campaign is live', variant: 'live'    };
    case 'paused':  return { label: 'Paused',                    variant: 'paused'  };
    case 'error':   return { label: 'Error',                     variant: 'error'   };
    default:        return { label: 'Live',                      variant: 'live'    };
  }
}

/* ── Page ── */
export default function ClientPage() {
  const [profile, setProfile]           = useState<ClientProfile | null>(null);
  const [loading, setLoading]           = useState(true);
  const [isAdminView, setIsAdminView]   = useState(false);
  const [calMeetings, setCalMeetings]   = useState<CalMeeting[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityRow[]>([]);
  const router = useRouter();

  const [activeTab, setActiveTab]               = useState<'overview' | 'billing'>('overview');
  const [showLogoUpload, setShowLogoUpload]     = useState(false);
  const [localLogoUrl, setLocalLogoUrl]         = useState<string | null>(null);
  const [clientLogoUrl, setClientLogoUrl]       = useState<string | null>(null);
  const [logoImgError, setLogoImgError]         = useState(false);
  const [selectedMeeting, setSelectedMeeting]   = useState<CalMeeting | null>(null);
  const [period, setPeriod]                     = useState<'week' | 'month' | 'alltime'>('month');
  const [periodOpen, setPeriodOpen]             = useState(false);
  const [periodStats, setPeriodStats]           = useState<PeriodStats | null>(null);
  const [billingData, setBillingData]           = useState<BillingData | null>(null);
  const [billingRecord, setBillingRecord]       = useState<ClientBillingRecord | null>(null);
  const [showChargeBanner, setShowChargeBanner] = useState(false);
  const [nextChargeDate, setNextChargeDate]     = useState<Date | null>(null);
  const periodRef                               = useRef<HTMLDivElement>(null);
  const [connectedCal, setConnectedCal]         = useState<CalProvider | null>(null);
  const [calModal, setCalModal]                 = useState<CalProvider | null>(null);

  // Load profile + meetings + activity from Supabase
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

        // Get profile row — includes client_id link to the clients table
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('role, client_id')
          .eq('id', user.id)
          .single();

        const viewId = new URLSearchParams(window.location.search).get('view');
        let targetClientId: string | null = null;

        if (viewId && profileRow?.role === 'admin') {
          targetClientId = viewId;
          setIsAdminView(true);
        } else {
          targetClientId = profileRow?.client_id ?? null;
        }

        if (!targetClientId) {
          // Client account exists but hasn't been linked to a clients record yet
          setLoading(false);
          return;
        }

        // Fetch core fields directly from clients table (source of truth from onboarding)
        const { data: clientRow } = await supabase
          .from('clients')
          .select('logo_url, name, firm')
          .eq('id', targetClientId)
          .single();
        if (clientRow?.logo_url) setClientLogoUrl(clientRow.logo_url);
        if (clientRow) {
          setProfile(prev => ({
            firm_name: clientRow.firm ?? prev?.firm_name ?? '',
            logo_url: clientRow.logo_url ?? prev?.logo_url ?? null,
            client_name: clientRow.name ?? prev?.client_name ?? null,
            emails_sent: prev?.emails_sent ?? 0,
            replies: prev?.replies ?? 0,
            reply_rate: prev?.reply_rate ?? 0,
            meetings_booked: prev?.meetings_booked ?? 0,
            campaign_status: prev?.campaign_status ?? '',
          }));
        }

        // Fetch campaign stats
        const { data: statsData } = await supabase
          .from('client_stats')
          .select('firm_name, logo_url, client_name, emails_sent, replies, reply_rate, meetings_booked, campaign_status')
          .eq('client_id', targetClientId)
          .single();

        setProfile(statsData);

        // Fetch meetings for this client
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('prospect, firm, day, month, meeting_time, zoom_url')
          .eq('client_id', targetClientId)
          .order('year',  { ascending: false })
          .order('month', { ascending: false })
          .order('day',   { ascending: false });

        if (meetingsData) {
          setCalMeetings(meetingsData.map(m => ({
            day:     m.day,
            month:   m.month,
            prospect: m.prospect ?? '',
            firm:    m.firm ?? '',
            time:    m.meeting_time ?? '',
            zoomUrl: m.zoom_url ?? undefined,
          })));
        }

        // Fetch activity for this client
        const { data: activityData } = await supabase
          .from('activity')
          .select('label, sub, day')
          .eq('client_id', targetClientId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (activityData) {
          setActivityItems(activityData.map(a => ({
            label: a.label ?? '',
            sub:   a.sub   ?? '',
            day:   a.day   ?? 0,
          })));
        }

        // Fetch billing + campaign data from clients table
        const { data: billingRow } = await supabase
          .from('clients')
          .select('trial_started_at, trial_ends_at, billing_started_at, billing_status, campaign_status, warmup_started_at')
          .eq('id', targetClientId)
          .single();

        if (billingRow) {
          setBillingRecord(billingRow);

          // Calculate next charge date and whether to show the 3-day banner
          let chargeDate: Date | null = null;
          const bs = billingRow.billing_status;
          if ((bs === 'trial' || bs === 'not_started') && billingRow.trial_ends_at) {
            chargeDate = new Date(billingRow.trial_ends_at);
          } else if (bs === 'active' && billingRow.billing_started_at) {
            chargeDate = getNextBillingDate(billingRow.billing_started_at);
          }
          if (chargeDate) {
            setNextChargeDate(chargeDate);
            const diffDays = (chargeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            if (diffDays >= 0 && diffDays <= 3) setShowChargeBanner(true);
          }
        }

      } catch {
        // Network or Supabase error — render gracefully with empty states.
      }
      setLoading(false);
    }
    load();
  }, [router]);

  // Period-scoped metrics — update whenever period or profile changes
  useEffect(() => {
    if (!profile) return;
    // All periods show lifetime totals until period-scoped view is wired to Smartlead
    setPeriodStats({
      emails_sent:     profile.emails_sent,
      replies:         profile.replies,
      reply_rate:      profile.reply_rate,
      meetings_booked: profile.meetings_booked,
    });
  }, [period, profile]);

  // Billing placeholder — replaced when Stripe is wired
  useEffect(() => {
    setBillingData(null);
  }, []);

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

  const p = profile;
  const greeting  = getGreeting();
  const firstName = p?.client_name?.split(' ')[0] ?? null;
  const statusProps = getStatusProps(
    billingRecord?.campaign_status ?? p?.campaign_status ?? null,
    billingRecord?.warmup_started_at,
  );

  // Sorted meetings — descending by month, day, then time
  const sortedMeetings = [...calMeetings].sort(
    (a, b) => b.month - a.month || b.day - a.day || parseTime(b.time) - parseTime(a.time),
  );

  // Activity filtered by selected period
  const today = new Date().getDate();
  const filteredActivity = activityItems.filter(a => {
    if (period === 'alltime') return true;
    if (period === 'week')    return a.day >= today - 7;
    return true;
  });

  return (
    <div className="portal-page">

      {/* ── Nav ── */}
      <header className="portal-nav">
        <div className="portal-nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZionShift" className="portal-logo" />

          <div className="client-logo-slot">
            {/* Logo is clickable/editable only for the actual client, not admin view */}
            <div
              className="client-logo-clickable"
              onClick={() => !isAdminView && setShowLogoUpload(true)}
              title={isAdminView ? undefined : 'Upload your logo'}
              style={isAdminView ? { cursor: 'default' } : undefined}
            >
              {(localLogoUrl || clientLogoUrl || p?.logo_url) && !logoImgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={localLogoUrl ?? clientLogoUrl ?? p!.logo_url!}
                  alt={p?.firm_name ?? 'Client'}
                  className="client-logo-img"
                  onError={() => setLogoImgError(true)}
                />
              ) : p?.firm_name ? (
                <span className="client-logo-text">{p.firm_name}</span>
              ) : (
                <div className="client-logo-placeholder">Client Logo</div>
              )}
              {!isAdminView && <div className="client-logo-edit-badge" aria-hidden>✎</div>}
            </div>
          </div>

          {!isAdminView && (
            <button className="btn btn-ghost" onClick={handleSignOut} style={{ fontSize: 13, padding: '8px 16px' }}>
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="portal-main">
        {loading ? (
          <div className="portal-empty"><p>Loading your dashboard…</p></div>
        ) : (
          <>

            {/* ── Admin view banner ── */}
            {isAdminView && (
              <div className="adm-view-banner">
                <span className="adm-view-banner-text">
                  Admin view — {p?.firm_name ?? 'Client'}{p?.client_name ? ` · ${p.client_name}` : ''}
                </span>
                <a href="/admin" className="adm-view-banner-back">← Back to Admin</a>
              </div>
            )}

            {/* ── 3-day charge warning banner ── */}
            {showChargeBanner && nextChargeDate && (
              <div className="cd-charge-banner">
                <span className="cd-charge-banner-text">
                  Your card will be charged $2,000 on {fmtBillingDate(nextChargeDate.toISOString())}. No action needed — your card on file will be used.
                </span>
                <button
                  className="cd-charge-banner-close"
                  onClick={() => setShowChargeBanner(false)}
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}

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
                      {(['week','month','alltime'] as const).map(opt => (
                        <button
                          key={opt}
                          className={`cd-period-option${period === opt ? ' active' : ''}`}
                          onClick={() => { setPeriod(opt); setPeriodOpen(false); }}
                        >
                          {PERIOD_LABEL[opt]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Metric cards ── */}
            <div className="cd-metrics">
              <div className="cd-metric-card">
                <div className="cd-metric-label">Emails Sent</div>
                <div className="cd-metric-value">{periodStats?.emails_sent ?? '—'}</div>
                <div className="cd-metric-period">{PERIOD_LABEL[period]}</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Replies</div>
                <div className="cd-metric-value">{periodStats?.replies ?? '—'}</div>
                <div className="cd-metric-period">{PERIOD_LABEL[period]}</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Reply Rate</div>
                <div className="cd-metric-value">
                  {periodStats?.reply_rate != null ? `${Number(periodStats.reply_rate).toFixed(1)}%` : '—'}
                </div>
                <div className="cd-metric-period">{PERIOD_LABEL[period]}</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Meetings Booked</div>
                <div className="cd-metric-value">{periodStats?.meetings_booked ?? '—'}</div>
                <div className="cd-metric-period">{PERIOD_LABEL[period]}</div>
              </div>
            </div>

            {/* ── Calendar + All Meetings + Recent Activity ── */}
            <div className="cd-meet-grid">

              {/* Calendar */}
              <div className="cd-card">
                <MiniCalendar
                  meetings={calMeetings}
                  selectedDay={selectedMeeting?.day ?? null}
                  selectedMonth={selectedMeeting?.month ?? null}
                  onMonthChange={() => setSelectedMeeting(null)}
                  onDayClick={(day, month) => {
                    const hit = [...calMeetings]
                      .filter(m => m.month === month)
                      .sort((a, b) => parseTime(a.time) - parseTime(b.time))
                      .find(m => m.day === day);
                    setSelectedMeeting(prev =>
                      prev?.day === day && prev?.month === month ? null : (hit ?? null)
                    );
                  }}
                />

                {/* Inline detail */}
                {selectedMeeting ? (() => {
                  const isPast = isMeetingPast(selectedMeeting.day, selectedMeeting.time, selectedMeeting.month);
                  return (
                    <div className="adm-meet-detail">
                      <div className="adm-meet-detail-head">
                        <div>
                          <div className="adm-meet-detail-name">{selectedMeeting.prospect}</div>
                          <div className="adm-meet-detail-firm">{selectedMeeting.firm}</div>
                        </div>
                        <span className={`adm-meet-pill adm-meet-pill--${isPast ? 'completed' : 'upcoming'}`}>
                          {isPast ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
                      <div className="adm-meet-detail-row">
                        <span className="adm-meet-detail-label">Date &amp; Time</span>
                        <span className="adm-meet-detail-val">{MONTH_SHORT[selectedMeeting.month]} {selectedMeeting.day} · {selectedMeeting.time}</span>
                      </div>
                      {!isPast && selectedMeeting.zoomUrl && (
                        <a href={selectedMeeting.zoomUrl} target="_blank" rel="noopener noreferrer" className="adm-zoom-btn">
                          Join Zoom →
                        </a>
                      )}
                    </div>
                  );
                })() : (
                  <p className="adm-cal-hint">Tap a highlighted date to see meeting details.</p>
                )}
              </div>

              {/* All Meetings log */}
              <div className="cd-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 0', marginBottom: 16, flexShrink: 0 }}>
                  <span className="adm-biz-card-title">All Meetings</span>
                  <span className="adm-count-chip">{calMeetings.length} Total</span>
                </div>
                <div className="cd-meet-log">
                  {sortedMeetings.length === 0 ? (
                    <p className="adm-empty-text" style={{ padding: '0 20px 24px' }}>No meetings booked yet.</p>
                  ) : sortedMeetings.map((m, i) => {
                    const isPast = isMeetingPast(m.day, m.time, m.month);
                    return (
                      <Fragment key={i}>
                        {i > 0 && <div className="adm-divider" style={{ margin: '0 20px' }} />}
                        <div
                          className={`adm-meet-row${selectedMeeting?.prospect === m.prospect && selectedMeeting?.day === m.day && selectedMeeting?.month === m.month ? ' selected' : ''}`}
                          onClick={() => setSelectedMeeting(prev => prev?.prospect === m.prospect && prev?.day === m.day && prev?.month === m.month ? null : m)}
                        >
                          <div className="adm-meet-row-avatar">
                            {m.prospect.split(' ').map(w => w[0]).join('')}
                          </div>
                          <div className="adm-meet-row-info">
                            <span className="adm-meet-row-name">{m.prospect}</span>
                            <span className="adm-meet-row-firm">{m.firm}</span>
                          </div>
                          <div className="adm-meet-row-right">
                            <span className="adm-meet-row-date">{MONTH_SHORT[m.month]} {m.day}</span>
                            <span className="adm-meet-row-time">{m.time}</span>
                            <span className={`adm-meet-pill adm-meet-pill--${isPast ? 'completed' : 'upcoming'}`}>
                              {isPast ? 'Completed' : 'Upcoming'}
                            </span>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Recent Activity */}
            <div className="cd-card" style={{ marginBottom: 20 }}>
              <div className="cd-card-label">Recent Activity</div>
              <div className="cd-activity-scroll">
                <ul className="cd-activity-list">
                  {filteredActivity.length === 0 ? (
                    <li className="cd-empty-state">No activity yet.</li>
                  ) : filteredActivity.map((a, i) => (
                    <li key={i} className="cd-activity-item">
                      <span className="cd-activity-text">{a.label}</span>
                      <span className="cd-activity-sub">{a.sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Calendar Sync ── */}
            <div className="cd-card">
              <div className="cd-cal-sync-top">
                <div>
                  <div className="cd-cal-sync-title">Sync to your calendar</div>
                  <div className="cd-cal-sync-sub">
                    Your ZionShift meetings will appear automatically on your calendar.
                  </div>
                </div>
              </div>
              <div className="cd-cal-options">
                {(['google', 'outlook', 'apple'] as CalProvider[]).map(prov => (
                  <div
                    key={prov}
                    className={`cd-cal-option cd-cal-option-btn${connectedCal === prov ? ' cd-cal-option-active' : ''}`}
                    onClick={() => setCalModal(prov)}
                  >
                    {prov === 'google'  && <GoogleIcon />}
                    {prov === 'outlook' && <OutlookIcon />}
                    {prov === 'apple'   && <AppleIcon />}
                    <span className="cd-cal-option-name">{CAL_INFO[prov].name}</span>
                    {connectedCal === prov
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
                      <div className="bl-section-label">Plan &amp; Billing</div>

                      {/* Setup Fee — always shown */}
                      <div className="bl-row">
                        <span className="bl-row-key">Setup Fee</span>
                        <span className="bl-row-val">
                          $1,000 ✅{billingRecord?.trial_started_at
                            ? ` Paid ${fmtBillingDate(billingRecord.trial_started_at)}`
                            : ' Paid'}
                        </span>
                      </div>

                      {/* Trial / not_started */}
                      {(!billingRecord?.billing_status || billingRecord.billing_status === 'not_started' || billingRecord.billing_status === 'trial') && (
                        <>
                          <div className="bl-divider" />
                          <div className="bl-row">
                            <span className="bl-row-key">Free Period</span>
                            <span className="bl-row-val">
                              45 days{billingRecord?.trial_ends_at
                                ? ` — ends ${fmtBillingDate(billingRecord.trial_ends_at)}`
                                : ''}
                            </span>
                          </div>
                          <div className="bl-divider" />
                          <div className="bl-row">
                            <span className="bl-row-key">Next Charge</span>
                            <span className="bl-row-mono">
                              {billingRecord?.trial_ends_at
                                ? `$2,000 on ${fmtBillingDate(billingRecord.trial_ends_at)}`
                                : '—'}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Active */}
                      {billingRecord?.billing_status === 'active' && (
                        <>
                          <div className="bl-divider" />
                          <div className="bl-row">
                            <span className="bl-row-key">Retainer</span>
                            <span className="bl-row-val">
                              $2,000/mo <span className="bl-status-pill">● Active</span>
                            </span>
                          </div>
                          <div className="bl-divider" />
                          <div className="bl-row">
                            <span className="bl-row-key">Next Charge</span>
                            <span className="bl-row-mono">
                              {billingRecord.billing_started_at
                                ? `$2,000 on ${fmtBillingDate(getNextBillingDate(billingRecord.billing_started_at).toISOString())}`
                                : '—'}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Paused */}
                      {billingRecord?.billing_status === 'paused' && (
                        <>
                          <div className="bl-divider" />
                          <div className="bl-payment-issue">
                            There was an issue with your last payment. Please contact{' '}
                            <a href="mailto:ryan@zionshift.com">ryan@zionshift.com</a>
                          </div>
                        </>
                      )}
                    </div>

                  </div>

                  {/* ── Right column ── */}
                  <div className="bl-col">

                    {/* Invoice History */}
                    <div className="cd-card bl-card">
                      <div className="bl-section-label">Invoice History</div>
                      {!billingData || billingData.invoices.length === 0 ? (
                        <p className="bl-inv-empty">No invoices on record yet.</p>
                      ) : billingData.invoices.map((inv, i) => (
                        <Fragment key={i}>
                          {i > 0 && <div className="bl-divider" />}
                          <div className="bl-invoice-row">
                            <span className="bl-inv-date">{inv.date}</span>
                            <span className="bl-inv-desc">{inv.description}</span>
                            <span className="bl-inv-amount">${inv.amount.toLocaleString('en-US')}</span>
                            <span className={`bl-inv-status bl-inv-${inv.status}`}>
                              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>

                    {/* Need to make changes */}
                    <div className="cd-card bl-card" style={{ marginTop: 16 }}>
                      <div className="bl-changes-title">Need to pause or cancel?</div>
                      <p className="bl-changes-body">
                        Just reach out directly at{' '}
                        <a href="mailto:ryan@zionshift.com" className="bl-changes-link">ryan@zionshift.com</a>
                        {' '}and we&apos;ll handle it within one business day — whether you need a short break or want to cancel entirely.
                      </p>
                      <p className="bl-changes-note">
                        No contracts. No penalties. Your campaign continues only as long as you want it to.
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
          onSave={(url) => { setLocalLogoUrl(url); setLogoImgError(false); }}
        />
      )}

      {calModal && (
        <CalendarConnectModal
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
