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

function MiniCalendar({ activeDates = [] }: { activeDates?: number[] }) {
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

  return (
    <div className="mini-cal">
      <div className="mini-cal-header">{MONTH_NAMES[month].toUpperCase()} {year}</div>
      <div className="mini-cal-grid">
        {DOW.map((d, i) => <div key={i} className="mini-cal-dow">{d}</div>)}
        {cells.map((day, i) => (
          <div
            key={i}
            className={[
              'mini-cal-day',
              day === today ? 'today' : '',
              day && activeDates.includes(day) ? 'has-dot' : '',
            ].join(' ').trim()}
          >
            <span>{day ?? ''}</span>
            {day && activeDates.includes(day) && <span className="mini-cal-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Placeholder data (replaced by Supabase per-client data later) ── */
const ACTIVITY = [
  { label: 'Meeting booked — Marcus T., Northstar CFO', sub: 'Today, 9:14am', strong: true },
  { label: '6 new replies received this week',           sub: 'This week',     strong: true },
  { label: 'Email 2 delivered to 104 prospects',         sub: 'Apr 18',        strong: false },
  { label: 'Campaign entered Week 3',                    sub: 'Apr 15',        strong: false },
];

const MEETINGS = [
  { date: 'Apr 23', prospect: 'Marcus Thompson', firm: 'Northstar CFO Group',        status: 'Scheduled' },
  { date: 'Apr 17', prospect: 'Sarah Mitchell',  firm: 'Clarity Point Bookkeeping',  status: 'Completed' },
  { date: 'Apr 11', prospect: 'James Rivera',    firm: 'Apex Financial Services',    status: 'Completed' },
];

/* ── Icons ── */
function GoogleIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
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
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#0078D4"/>
      <path fill="#fff" d="M6 6h5.5C13.4 6 15 7.6 15 9.5S13.4 13 11.5 13H9v4H6V6zm3 2v3h2.5c.83 0 1.5-.67 1.5-1.5S12.33 8 11.5 8H9z"/>
    </svg>
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

/* ── Page ── */
export default function ClientPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
        .select('firm_name, logo_url, client_name, emails_sent, replies, reply_rate, meetings_booked, campaign_status')
        .eq('client_id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  }

  const [activeTab, setActiveTab]       = useState<'overview' | 'billing'>('overview');
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [localLogoUrl, setLocalLogoUrl]     = useState<string | null>(null);

  const p = profile;
  const greeting  = getGreeting();
  const firstName = p?.client_name ?? 'there';

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
              <h1 className="cd-greeting">{greeting}, {firstName}.</h1>
              <div className="cd-greeting-right">
                <span className="cd-live-badge">
                  <span className="cd-live-dot" />
                  {p?.campaign_status ?? 'Live — Sending'}
                </span>
                <span className="cd-period">This month</span>
              </div>
            </div>

            {/* ── Metric cards ── */}
            <div className="cd-metrics">
              <div className="cd-metric-card">
                <div className="cd-metric-label">Emails Sent</div>
                <div className="cd-metric-value">{p?.emails_sent ?? '—'}</div>
                <div className="cd-metric-sub">this month</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Replies</div>
                <div className="cd-metric-value">{p?.replies ?? '—'}</div>
                <div className="cd-metric-sub">from prospects</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Reply Rate</div>
                <div className="cd-metric-value">
                  {p?.reply_rate != null ? `${p.reply_rate}%` : '—'}
                </div>
                <div className="cd-metric-sub">avg 2–3% industry</div>
              </div>
              <div className="cd-metric-card">
                <div className="cd-metric-label">Meetings Booked</div>
                <div className="cd-metric-value">{p?.meetings_booked ?? '—'}</div>
                <div className="cd-metric-sub">qualified calls</div>
              </div>
            </div>

            {/* ── Activity + Calendar ── */}
            <div className="cd-mid-row">
              <div className="cd-card">
                <div className="cd-card-label">Recent Activity</div>
                <ul className="cd-activity-list">
                  {ACTIVITY.map((a, i) => (
                    <li key={i} className={`cd-activity-item${a.strong ? ' strong' : ''}`}>
                      <span className="cd-activity-text">{a.label}</span>
                      <span className="cd-activity-sub">{a.sub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="cd-card">
                <MiniCalendar activeDates={[11, 17, 23]} />
              </div>
            </div>

            {/* ── Meeting Log ── */}
            <div className="cd-card" style={{ marginBottom: 20 }}>
              <div className="cd-card-label" style={{ marginBottom: 18 }}>Meeting Log</div>
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
                  {MEETINGS.map((m, i) => (
                    <tr key={i}>
                      <td className="cd-td-date">{m.date}</td>
                      <td className="cd-td-name">{m.prospect}</td>
                      <td className="cd-td-firm">{m.firm}</td>
                      <td>
                        <span className={`cd-pill ${m.status.toLowerCase()}`}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Calendar Sync ── */}
            <div className="cd-card cd-cal-sync">
              <div className="cd-cal-sync-top">
                <div>
                  <div className="cd-cal-sync-title">Sync to your calendar</div>
                  <div className="cd-cal-sync-sub">
                    Your ZionShift meetings will appear automatically on your personal calendar.
                  </div>
                </div>
                <span className="cd-connected-badge">● Google connected</span>
              </div>
              <div className="cd-cal-options">
                <div className="cd-cal-option">
                  <GoogleIcon />
                  <span className="cd-cal-option-name">Google Calendar</span>
                  <span className="cd-cal-connected">Connected</span>
                </div>
                <div className="cd-cal-option">
                  <AppleIcon />
                  <span className="cd-cal-option-name">Apple Calendar</span>
                  <span className="cd-cal-disconnected">Not connected</span>
                </div>
                <div className="cd-cal-option">
                  <OutlookIcon />
                  <span className="cd-cal-option-name">Outlook</span>
                  <span className="cd-cal-disconnected">Not connected</span>
                </div>
              </div>
            </div>

            </>)}

            {/* ── Billing ── */}
            {activeTab === 'billing' && (
              <div className="portal-empty" style={{ minHeight: 400 }}>
                <p>Billing coming soon.</p>
                <span>Your invoices and plan details will appear here.</span>
              </div>
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
    </div>
  );
}
