'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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

/* ── Helpers ────────────────────────────────────────────────────── */

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Constants ──────────────────────────────────────────────────── */

// $2k → $6k → $10k → then $10k increments to $100k
const MRR_MILESTONES = [2000, 6000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];

/* ── Component ──────────────────────────────────────────────────── */

export default function AdminPage() {
  const [loading, setLoading]               = useState(true);
  const [clients, setClients]               = useState<ActiveClient[]>([]);
  const [resendingId, setResendingId]       = useState<string | null>(null);
  const [resentId, setResentId]             = useState<string | null>(null);
  const [toast, setToast]                   = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [intakeClient, setIntakeClient]     = useState<ActiveClient | null>(null);
  const [intakeData, setIntakeData]         = useState<Record<string, unknown> | null>(null);
  const [intakeLoading, setIntakeLoading]   = useState(false);
  const [onboardOpen, setOnboardOpen]       = useState(false);
  const [onboardName, setOnboardName]       = useState('');
  const [onboardEmail, setOnboardEmail]     = useState('');
  const [onboardStatus, setOnboardStatus]   = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [deleteClient, setDeleteClient]     = useState<ActiveClient | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState('');
  const [deleting, setDeleting]             = useState(false);
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
      } catch {
        // Network or Supabase error — render with empty state.
      }
      setLoading(false);
    }
    load();
  }, [router]);

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

  function showToast(msg: string, ms = 5000) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

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
      setOnboardStatus(!res.ok || json.error ? 'error' : 'success');
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
      const removed = deleteClient;
      setClients(prev => prev.filter(c => c.id !== removed.id));
      setDeleteClient(null);
      setDeleteConfirm('');
      showToast(`${removed.name} has been removed.`);
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
      showToast(`${client.name}'s campaign paused — go pause in Smartlead.`, 6000);
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
      showToast(`${client.name}'s campaign resumed.`);
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
    } catch { /* silently fail */ }
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
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
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
      } catch { /* always redirect */ }
    }
    router.push('/login');
  }

  // ── Derived values ───────────────────────────────────────────────
  const totalMRR    = clients.filter(c => c.firstMonthPaid).reduce((s, c) => s + c.mrr, 0);
  const setupFees   = clients.filter(c => c.setupFeePaid).length * 1000;
  const nextMilestone = MRR_MILESTONES.find(m => m > totalMRR) ?? 100000;
  const prevMilestone = MRR_MILESTONES[MRR_MILESTONES.indexOf(nextMilestone) - 1] ?? 0;
  const mrrProgress   = nextMilestone === prevMilestone ? 100
    : Math.min(Math.round(((totalMRR - prevMilestone) / (nextMilestone - prevMilestone)) * 100), 100);

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div className="portal-page">

      {/* Toast */}
      {toast && (
        <div className="adm-toast">
          <span>{toast}</span>
          <button className="adm-toast-close" onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Nav */}
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

          <div className="adm-layout">

            {/* ── MRR hero + onboard action ── */}
            <div className="adm-hero-row">
              <div className="adm-hero-mrr">
                <span className="adm-hero-label">Monthly Recurring Revenue</span>
                <span className="adm-hero-value">${totalMRR.toLocaleString()}</span>
              </div>
              <button className="adm-onboard-btn" onClick={openOnboard}>
                + Onboard New Client
              </button>
            </div>

            {/* ── Main grid: Clients (left) + Revenue (right) ── */}
            <div className="adm-main-grid">

              {/* Clients */}
              <div className="adm-biz-card adm-clients-card">
                <div className="adm-biz-card-head">
                  <span className="adm-biz-card-title">Clients</span>
                  <span className="adm-count-chip">{clients.length} Total</span>
                </div>

                {clients.length === 0 ? (
                  <p className="adm-empty-text">No clients yet. Send a payment link to get started.</p>
                ) : (
                  <div>
                    {clients.map((c, i) => (
                      <Fragment key={c.id}>
                        {i > 0 && <div className="adm-divider" />}
                        <div className="adm-client-row">

                          {/* Avatar */}
                          <div className={`adm-client-avatar${c.status !== 'live' ? ' inactive' : ''}`}>
                            {c.headshotUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={c.headshotUrl} alt={c.name} className="adm-client-avatar-img" />
                              : c.name.split(' ').map(w => w[0]).join('')
                            }
                          </div>

                          {/* Info */}
                          <div className="adm-client-info">
                            <span className="adm-client-name">{c.name}</span>
                            {c.status === 'pending'
                              ? <span className="adm-client-firm">{c.email}</span>
                              : <>
                                  <span className="adm-client-firm">{c.firm}</span>
                                  <span className="adm-client-since">since {c.since}</span>
                                </>
                            }
                            {c.status === 'live' && !c.firstMonthPaid && (
                              <span className="adm-billing-pill adm-billing-pill--trial">Trial</span>
                            )}
                          </div>

                          {/* Campaign status pill + actions */}
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

              {/* Revenue */}
              <div className="adm-biz-card adm-revenue-card">
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

                {/* Milestone progress */}
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

            </div>
          </div>

        )}
      </main>

      {/* ── Intake Form Modal ── */}
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
                  <div className="adm-intake-section">
                    <div className="adm-intake-section-title">About You</div>
                    {([
                      ['Business',         intakeData.businessName],
                      ['Location',         intakeData.cityState],
                      ['Years in Business',intakeData.yearsInBusiness],
                      ['Website',          intakeData.websiteUrl || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="adm-intake-row">
                        <span className="adm-intake-label">{label}</span>
                        <span className="adm-intake-val">{val || '—'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="adm-intake-section">
                    <div className="adm-intake-section-title">Ideal Client</div>
                    {([
                      ['Industries',       Array.isArray(intakeData.industries) ? (intakeData.industries as string[]).join(', ') + (intakeData.otherIndustry ? ` (Other: ${intakeData.otherIndustry})` : '') : '—'],
                      ['Employee Count',   Array.isArray(intakeData.employeeCount) ? (intakeData.employeeCount as string[]).join(', ') : '—'],
                      ['Revenue Range',    Array.isArray(intakeData.revenueRange) ? (intakeData.revenueRange as string[]).join(', ') : String(intakeData.revenueRange || '—')],
                      ['Geo Focus',        Array.isArray(intakeData.geoFocus) ? (intakeData.geoFocus as string[]).join(', ') + (intakeData.regionalStates ? ` — ${intakeData.regionalStates}` : '') : '—'],
                      ['Client Exclusions',intakeData.exclusions || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="adm-intake-row">
                        <span className="adm-intake-label">{label}</span>
                        <span className="adm-intake-val">{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="adm-intake-section">
                    <div className="adm-intake-section-title">Voice &amp; Messaging</div>
                    {([
                      ['Differentiator', intakeData.differentiator],
                      ['Pain Point',     intakeData.painPoint],
                      ['Transformation', intakeData.transformation],
                      ['Tone',           intakeData.tone],
                      ['Avoidances',     intakeData.avoidances || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="adm-intake-row">
                        <span className="adm-intake-label">{label}</span>
                        <span className="adm-intake-val">{val || '—'}</span>
                      </div>
                    ))}
                  </div>

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

                  <div className="adm-intake-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
                    <div className="adm-intake-section-title">Final Details</div>
                    {([
                      ['Prospect Note',   intakeData.prospectNote || '—'],
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

      {/* ── Onboard New Client Modal ── */}
      {onboardOpen && (
        <div className="modal-overlay" onClick={() => setOnboardOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOnboardOpen(false)}>✕</button>
            <div className="modal-scroll">
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>New Client</p>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1715' }}>Send Payment Link</h2>
              <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Enter the client&apos;s details and we&apos;ll send them a branded payment link to complete their setup.
              </p>

              {onboardStatus === 'success' ? (
                <div style={{ padding: '16px 20px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 14, color: '#15803D', fontWeight: 500 }}>
                  Payment link sent to {onboardEmail} ✓
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={onboardName}
                      onChange={e => setOnboardName(e.target.value)}
                      placeholder="Jane Smith"
                      style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715' }}
                    />
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={onboardEmail}
                      onChange={e => setOnboardEmail(e.target.value)}
                      placeholder="jane@smithbookkeeping.com"
                      style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715' }}
                    />
                  </div>

                  {onboardStatus === 'error' && (
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#DC2626' }}>Something went wrong. Please try again.</p>
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
                    <button className="ccm-btn-cancel" onClick={() => setOnboardOpen(false)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Client Modal ── */}
      {deleteClient && (
        <div className="modal-overlay" onClick={() => { setDeleteClient(null); setDeleteConfirm(''); }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setDeleteClient(null); setDeleteConfirm(''); }}>✕</button>
            <div className="modal-scroll">
              <div className="adm-delete-icon">⚠</div>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1715' }}>Remove Client</h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                This will permanently remove <strong style={{ color: '#1A1715' }}>{deleteClient.name}</strong> and all their data. This cannot be undone.
              </p>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Type <strong style={{ color: '#1A1715' }}>{deleteClient.name}</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={deleteClient.name}
                autoFocus
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 20 }}
              />
              <div className="ccm-actions">
                <button className="ccm-btn-cancel" onClick={() => { setDeleteClient(null); setDeleteConfirm(''); }}>
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
