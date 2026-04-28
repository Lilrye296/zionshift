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


/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
      if (warmupStartedAt) {
        const d = Math.floor((Date.now() - new Date(warmupStartedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (d > 14) return { label: 'Active — campaign is live', variant: 'live' };
        return { label: `Warming Up — Day ${Math.max(1, d)} of 14`, variant: 'warming' };
      }
      return { label: 'Warming Up — Day 1 of 14', variant: 'warming' };
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
  const router = useRouter();

  const [activeTab, setActiveTab]               = useState<'overview' | 'billing'>('overview');
  const [showLogoUpload, setShowLogoUpload]     = useState(false);
  const [localLogoUrl, setLocalLogoUrl]         = useState<string | null>(null);
  const [clientLogoUrl, setClientLogoUrl]       = useState<string | null>(null);
  const [logoImgError, setLogoImgError]         = useState(false);
  const [period, setPeriod]                     = useState<'week' | 'month' | 'alltime'>('month');
  const [periodOpen, setPeriodOpen]             = useState(false);
  const [periodStats, setPeriodStats]           = useState<PeriodStats | null>(null);
  const [billingData, setBillingData]           = useState<BillingData | null>(null);
  const [billingRecord, setBillingRecord]       = useState<ClientBillingRecord | null>(null);
  const [showChargeBanner, setShowChargeBanner] = useState(false);
  const [nextChargeDate, setNextChargeDate]     = useState<Date | null>(null);
  const periodRef                               = useRef<HTMLDivElement>(null);
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

        // Merge stats into profile without overwriting name/firm already set from clients table
        if (statsData) {
          setProfile(prev => ({
            firm_name: prev?.firm_name || statsData.firm_name || '',
            logo_url: prev?.logo_url || statsData.logo_url || null,
            client_name: prev?.client_name || statsData.client_name || null,
            emails_sent: statsData.emails_sent ?? prev?.emails_sent ?? 0,
            replies: statsData.replies ?? prev?.replies ?? 0,
            reply_rate: statsData.reply_rate ?? prev?.reply_rate ?? 0,
            meetings_booked: statsData.meetings_booked ?? prev?.meetings_booked ?? 0,
            campaign_status: statsData.campaign_status || prev?.campaign_status || '',
          }));
        }

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

        // Fetch billing + campaign data from clients table
        const { data: billingRow } = await supabase
          .from('clients')
          .select('trial_started_at, trial_ends_at, billing_started_at, billing_status, campaign_status, warmup_started_at')
          .eq('id', targetClientId)
          .single();

        if (billingRow) {
          setBillingRecord(billingRow);

          // ── Auto-activate: if warmup just crossed 14 days and DB still says warming,
          //    fire the activation email + flip DB to active (runs once, never again)
          if (
            !isAdminView &&
            billingRow.campaign_status === 'warming' &&
            billingRow.warmup_started_at
          ) {
            const daysSinceWarmup = Math.floor(
              (Date.now() - new Date(billingRow.warmup_started_at).getTime()) / 86400000
            );
            if (daysSinceWarmup >= 14) {
              fetch('/api/activate-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: targetClientId }),
              }).catch(e => console.error('[activate-campaign] fetch failed:', e));
            }
          }

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
  }, [router, isAdminView]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Filter meetings by selected period, then sort descending
  const now = new Date();
  const todayNum = now.getDate();
  const curMonth = now.getMonth();
  const filteredMeetings = [...calMeetings].filter(m => {
    if (period === 'alltime') return true;
    if (period === 'month')   return m.month === curMonth;
    if (period === 'week')    return m.month === curMonth && m.day >= todayNum - 7;
    return true;
  }).sort(
    (a, b) => b.month - a.month || b.day - a.day || parseTime(b.time) - parseTime(a.time),
  );

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

            {/* ── Meetings Log ── */}
            <div className="cd-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 0', marginBottom: 16, flexShrink: 0 }}>
                <div>
                  <span className="adm-biz-card-title">Meetings Log</span>
                  <div className="cd-metric-period" style={{ marginTop: 2 }}>{PERIOD_LABEL[period]}</div>
                </div>
                <span className="adm-count-chip">{filteredMeetings.length} Total</span>
              </div>
              <div className="cd-meet-log">
                {filteredMeetings.length === 0 ? (
                  <p className="adm-empty-text" style={{ padding: '0 20px 24px' }}>No meetings booked yet.</p>
                ) : filteredMeetings.map((m, i) => {
                  const isPast = isMeetingPast(m.day, m.time, m.month);
                  return (
                    <Fragment key={i}>
                      {i > 0 && <div className="adm-divider" style={{ margin: '0 20px' }} />}
                      <div className="adm-meet-row">
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

                      {/* Header */}
                      <div className="bl-plan-header">
                        <div>
                          <div className="bl-plan-name">ZionShift Pro</div>
                          <div className="bl-plan-desc">AI-powered outreach for bookkeepers</div>
                        </div>
                        {billingRecord?.billing_status === 'active'
                          ? <span className="bl-status-pill">● Active</span>
                          : billingRecord?.billing_status === 'paused'
                          ? <span className="bl-status-pill bl-status-paused">● Paused</span>
                          : <span className="bl-status-pill bl-status-paused">Trial</span>
                        }
                      </div>

                      <div className="bl-divider" />

                      {/* Setup Fee */}
                      <div className="bl-stat-row">
                        <span className="bl-stat-label">Setup Fee</span>
                        <div className="bl-stat-right">
                          <span className="bl-stat-value">$1,000</span>
                          <span className="bl-stat-sub">
                            Paid{billingRecord?.trial_started_at ? ` · ${fmtBillingDate(billingRecord.trial_started_at)}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="bl-divider" />

                      {/* Trial */}
                      {(!billingRecord?.billing_status || billingRecord.billing_status === 'not_started' || billingRecord.billing_status === 'trial') && (<>
                        <div className="bl-stat-row">
                          <span className="bl-stat-label">Free Period</span>
                          <div className="bl-stat-right">
                            <span className="bl-stat-value">45 days</span>
                            {billingRecord?.trial_ends_at && (
                              <span className="bl-stat-sub">Ends {fmtBillingDate(billingRecord.trial_ends_at)}</span>
                            )}
                          </div>
                        </div>
                        <div className="bl-divider" />
                        <div className="bl-stat-row">
                          <span className="bl-stat-label">Next Charge</span>
                          <div className="bl-stat-right">
                            <span className="bl-stat-value">$2,000</span>
                            {billingRecord?.trial_ends_at && (
                              <span className="bl-stat-sub">{fmtBillingDate(billingRecord.trial_ends_at)}</span>
                            )}
                          </div>
                        </div>
                      </>)}

                      {/* Active */}
                      {billingRecord?.billing_status === 'active' && (<>
                        <div className="bl-stat-row">
                          <span className="bl-stat-label">Monthly Retainer</span>
                          <div className="bl-stat-right">
                            <span className="bl-stat-value">$2,000</span>
                            <span className="bl-stat-sub">per month</span>
                          </div>
                        </div>
                        <div className="bl-divider" />
                        <div className="bl-stat-row">
                          <span className="bl-stat-label">Next Charge</span>
                          <div className="bl-stat-right">
                            <span className="bl-stat-value">$2,000</span>
                            {billingRecord.billing_started_at && (
                              <span className="bl-stat-sub">{fmtBillingDate(getNextBillingDate(billingRecord.billing_started_at).toISOString())}</span>
                            )}
                          </div>
                        </div>
                      </>)}

                      {/* Paused */}
                      {billingRecord?.billing_status === 'paused' && (
                        <div className="bl-payment-issue">
                          There was an issue with your last payment. Please contact{' '}
                          <a href="mailto:ryan@zionshift.com">ryan@zionshift.com</a>
                        </div>
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

    </div>
  );
}
