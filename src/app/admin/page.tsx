'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
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
  billingStatus: string | null;
  failedPaymentAt: string | null;
  smartleadCampaignId: string | null;
  bookingLink: string | null;
  aiReplyPrompt: string | null;
}

/* ── Helpers ────────────────────────────────────────────────────── */

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ConversationMessage {
  id: number;
  type: 'outbound' | 'inbound';
  sender: string;
  body: string;
  time?: string;
  subject?: string;
}

interface HotLead {
  id: string;
  lead_name: string | null;
  lead_company: string | null;
  lead_email: string;
  status: string;
  booking_link: string | null;
  created_at: string;
}

interface MyMetrics {
  emails_sent: number | null;
  replies:     number | null;
  hot_leads:   number | null;
}

/* ── Constants ──────────────────────────────────────────────────── */

const PERIOD_LABEL = { week: 'This Week', month: 'This Month', alltime: 'All Time' };

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
  const [deleteClient, setDeleteClient]         = useState<ActiveClient | null>(null);
  const [deleteConfirm, setDeleteConfirm]       = useState('');
  const [deleting, setDeleting]                 = useState(false);
  const [campaignIdClient, setCampaignIdClient] = useState<ActiveClient | null>(null);
  const [campaignIdInput, setCampaignIdInput]   = useState('');
  const [campaignIdSaving, setCampaignIdSaving] = useState(false);
  const [bookingLinkClient, setBookingLinkClient]   = useState<ActiveClient | null>(null);
  const [bookingLinkInput, setBookingLinkInput]     = useState('');
  const [bookingLinkSaving, setBookingLinkSaving]   = useState(false);
  const [promptClient, setPromptClient]   = useState<ActiveClient | null>(null);
  const [promptInput, setPromptInput]     = useState('');
  const [promptSaving, setPromptSaving]   = useState(false);
  const [settingsOpen, setSettingsOpen]       = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [myClientId, setMyClientId]           = useState<string | null>(null);
  const [myCampaignId, setMyCampaignId]       = useState('');
  const [myBookingLink, setMyBookingLink]     = useState('');
  const [myPrompt, setMyPrompt]               = useState('');
  const [settingsSaving, setSettingsSaving]   = useState<'campaignId' | 'bookingLink' | 'prompt' | null>(null);
  const [myMetrics, setMyMetrics]             = useState<MyMetrics | null>(null);
  const [myPeriod, setMyPeriod]               = useState<'week' | 'month' | 'alltime'>('month');
  const [myPeriodOpen, setMyPeriodOpen]       = useState(false);
  const [myHotLeads, setMyHotLeads]           = useState<HotLead[]>([]);
  const [myHlSearch, setMyHlSearch]           = useState('');
  const [myHlMenuId, setMyHlMenuId]           = useState<string | null>(null);
  const [myHlOpenLead, setMyHlOpenLead]       = useState<HotLead | null>(null);
  const [myHlConversation, setMyHlConversation] = useState<ConversationMessage[] | null>(null);
  const [myHlConvLoading, setMyHlConvLoading]   = useState(false);
  const [myHlConvPartial, setMyHlConvPartial]   = useState(false);
  const myHlMenuRef  = useRef<HTMLDivElement>(null);
  const myPeriodRef  = useRef<HTMLDivElement>(null);
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

        // Load admin's own client row for My Campaign section
        const { data: adminClientRow } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        if (adminClientRow?.id) setMyClientId(adminClientRow.id);

        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, name, email, firm, status, mrr, since, first_month_paid, setup_fee_paid, headshot_url, logo_url, campaign_status, warmup_started_at, billing_status, failed_payment_at, smartlead_campaign_id, booking_link, ai_reply_prompt')
          .order('created_at', { ascending: false });

        if (clientsData) {
          const mapped = clientsData.filter((c: { email: string }) => c.email !== user.email).map((c: {
            id: string; name: string; email: string; firm: string;
            status: string; mrr: number; since: string;
            first_month_paid: boolean; setup_fee_paid: boolean;
            headshot_url: string | null; logo_url: string | null;
            campaign_status: string | null; warmup_started_at: string | null;
            billing_status: string | null; failed_payment_at: string | null;
            smartlead_campaign_id: string | null; booking_link: string | null; ai_reply_prompt: string | null;
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
              billingStatus: c.billing_status ?? null,
              failedPaymentAt: c.failed_payment_at ?? null,
              smartleadCampaignId: c.smartlead_campaign_id ?? null,
              bookingLink: c.booking_link ?? null,
              aiReplyPrompt: c.ai_reply_prompt ?? null,
            };
          });

          // Persist any warming→active flips to DB + send activation email
          mapped.forEach(async (client) => {
            const raw = clientsData.find((c: { id: string; campaign_status: string | null }) => c.id === client.id);
            if (raw && raw.campaign_status === 'warming' && client.campaignStatus === 'active') {
              await fetch('/api/activate-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: client.id }),
              });
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

  // My Campaign — fetch metrics when client ID or period changes
  useEffect(() => {
    if (!myClientId) return;
    setMyMetrics(null);
    fetch(`/api/get-metrics?clientId=${myClientId}&period=${myPeriod}`)
      .then(r => r.json())
      .then(data => {
        if (data.metrics) {
          setMyMetrics({
            emails_sent: data.metrics.emails_sent,
            replies:     data.metrics.replies,
            hot_leads:   data.metrics.hot_leads ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [myClientId, myPeriod]);

  // My Campaign — fetch hot leads
  useEffect(() => {
    if (!myClientId) return;
    fetch(`/api/get-hot-leads?clientId=${myClientId}`)
      .then(r => r.json())
      .then(data => setMyHotLeads(data.hotLeads ?? []))
      .catch(() => setMyHotLeads([]));
  }, [myClientId]);

  // My Campaign — close ••• menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (myHlMenuRef.current && !myHlMenuRef.current.contains(e.target as Node)) {
        setMyHlMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // My Campaign — close period dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (myPeriodRef.current && !myPeriodRef.current.contains(e.target as Node)) {
        setMyPeriodOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
      const res = await fetch('/api/delete-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: deleteClient.id, clientEmail: deleteClient.email }),
      });
      if (!res.ok) throw new Error('Delete failed');
      const removed = deleteClient;
      setClients(prev => prev.filter(c => c.id !== removed.id));
      setDeleteClient(null);
      setDeleteConfirm('');
      showToast(`${removed.name} has been removed.`);
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleStartWarmup(client: ActiveClient) {
    try {
      const supabase = createClient();
      const now = new Date().toISOString();
      await supabase
        .from('clients')
        .update({ campaign_status: 'warming', warmup_started_at: now })
        .eq('id', client.id);
      setClients(prev => prev.map(c =>
        c.id === client.id
          ? { ...c, campaignStatus: 'warming', warmupStartedAt: now }
          : c
      ));
      showToast(`Warmup started for ${client.name} — Day 1 of 14 begins now.`);
    } catch { /* silently fail */ }
  }

  async function handleUpdatePayment(client: ActiveClient) {
    setOpenDropdownId(null);
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });
      const json = await res.json();
      if (json.url) {
        window.open(json.url, '_blank', 'noopener,noreferrer');
      } else {
        showToast('Could not open billing portal. Try again.');
      }
    } catch {
      showToast('Could not open billing portal. Try again.');
    }
  }

  async function handleSaveCampaignId() {
    if (!campaignIdClient || !campaignIdInput.trim()) return;
    setCampaignIdSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('clients')
        .update({ smartlead_campaign_id: campaignIdInput.trim() })
        .eq('id', campaignIdClient.id);
      setClients(prev => prev.map(c =>
        c.id === campaignIdClient.id
          ? { ...c, smartleadCampaignId: campaignIdInput.trim() }
          : c
      ));
      showToast(`Campaign ID saved for ${campaignIdClient.name}.`);
      setCampaignIdClient(null);
      setCampaignIdInput('');
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setCampaignIdSaving(false);
    }
  }

  async function handleClearField(clientId: string, field: 'smartlead_campaign_id' | 'booking_link' | 'ai_reply_prompt') {
    try {
      const supabase = createClient();
      await supabase.from('clients').update({ [field]: null }).eq('id', clientId);
      setClients(prev => prev.map(c => {
        if (c.id !== clientId) return c;
        if (field === 'smartlead_campaign_id') return { ...c, smartleadCampaignId: null };
        if (field === 'booking_link')          return { ...c, bookingLink: null };
        if (field === 'ai_reply_prompt')       return { ...c, aiReplyPrompt: null };
        return c;
      }));
      const label = field === 'smartlead_campaign_id' ? 'Campaign ID' : field === 'booking_link' ? 'Booking link' : 'AI reply prompt';
      showToast(`${label} cleared.`);
      setCampaignIdClient(null);
      setBookingLinkClient(null);
      setPromptClient(null);
    } catch {
      showToast('Something went wrong. Please try again.');
    }
  }

  async function handleSaveBookingLink() {
    if (!bookingLinkClient || !bookingLinkInput.trim()) return;
    setBookingLinkSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('clients')
        .update({ booking_link: bookingLinkInput.trim() })
        .eq('id', bookingLinkClient.id);
      setClients(prev => prev.map(c =>
        c.id === bookingLinkClient.id
          ? { ...c, bookingLink: bookingLinkInput.trim() }
          : c
      ));
      showToast(`Booking link saved for ${bookingLinkClient.name}.`);
      setBookingLinkClient(null);
      setBookingLinkInput('');
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setBookingLinkSaving(false);
    }
  }

  async function handleSavePrompt() {
    if (!promptClient || !promptInput.trim()) return;
    setPromptSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('clients')
        .update({ ai_reply_prompt: promptInput.trim() })
        .eq('id', promptClient.id);
      setClients(prev => prev.map(c =>
        c.id === promptClient.id
          ? { ...c, aiReplyPrompt: promptInput.trim() }
          : c
      ));
      showToast(`AI reply prompt saved for ${promptClient.name}.`);
      setPromptClient(null);
      setPromptInput('');
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setPromptSaving(false);
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

  async function handleMyHlFollowedUp(id: string) {
    await fetch('/api/update-hot-lead', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'followed_up' }),
    });
    setMyHotLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'followed_up' } : l));
    setMyHlMenuId(null);
  }

  async function handleMyHlRemove(id: string) {
    await fetch('/api/update-hot-lead', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'delete' }),
    });
    setMyHotLeads(prev => prev.filter(l => l.id !== id));
    if (myHlOpenLead?.id === id) setMyHlOpenLead(null);
    setMyHlMenuId(null);
  }

  async function handleMyHlOpen(lead: HotLead) {
    setMyHlOpenLead(lead);
    setMyHlConvLoading(true);
    setMyHlConversation(null);
    setMyHlConvPartial(false);
    try {
      const res  = await fetch(`/api/get-lead-conversation?hotLeadId=${lead.id}`);
      const data = await res.json();
      setMyHlConversation(data.messages ?? null);
      setMyHlConvPartial(data.partial === true);
    } catch {
      setMyHlConversation(null);
    }
    setMyHlConvLoading(false);
  }

  async function handleOpenSettings() {
    setSettingsOpen(true);
    setSettingsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { setSettingsLoading(false); return; }
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id, smartlead_campaign_id, booking_link, ai_reply_prompt')
        .eq('email', user.email)
        .single();
      if (clientRow) {
        setMyClientId(clientRow.id);
        setMyCampaignId(clientRow.smartlead_campaign_id ?? '');
        setMyBookingLink(clientRow.booking_link ?? '');
        setMyPrompt(clientRow.ai_reply_prompt ?? '');
      }
    } catch { /* silently fail */ }
    setSettingsLoading(false);
  }

  async function handleSaveMySetting(
    field: 'smartlead_campaign_id' | 'booking_link' | 'ai_reply_prompt',
    value: string,
    savingKey: 'campaignId' | 'bookingLink' | 'prompt',
  ) {
    if (!myClientId) return;
    setSettingsSaving(savingKey);
    try {
      const supabase = createClient();
      await supabase.from('clients').update({ [field]: value.trim() || null }).eq('id', myClientId);
      const label = field === 'smartlead_campaign_id' ? 'Campaign ID' : field === 'booking_link' ? 'Booking link' : 'AI reply prompt';
      showToast(`Your ${label} saved.`);
    } catch {
      showToast('Something went wrong. Please try again.');
    }
    setSettingsSaving(null);
  }

  async function handleClearMySetting(field: 'smartlead_campaign_id' | 'booking_link' | 'ai_reply_prompt') {
    if (!myClientId) return;
    try {
      const supabase = createClient();
      await supabase.from('clients').update({ [field]: null }).eq('id', myClientId);
      if (field === 'smartlead_campaign_id') setMyCampaignId('');
      if (field === 'booking_link') setMyBookingLink('');
      if (field === 'ai_reply_prompt') setMyPrompt('');
      const label = field === 'smartlead_campaign_id' ? 'Campaign ID' : field === 'booking_link' ? 'Booking link' : 'AI reply prompt';
      showToast(`Your ${label} cleared.`);
    } catch {
      showToast('Something went wrong. Please try again.');
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="adm-settings-btn" onClick={handleOpenSettings} aria-label="My Settings" title="My Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button className="btn btn-ghost" onClick={handleSignOut} style={{ fontSize: 13, padding: '8px 16px' }}>
              Sign out
            </button>
          </div>
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
                  <div className="adm-clients-list">
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
                            {/* Desktop-only billing pills (hidden on mobile via direct-child CSS) */}
                            {c.status === 'live' && !c.firstMonthPaid && (c.billingStatus === 'trial' || !c.billingStatus) && (
                              <span className="adm-billing-pill adm-billing-pill--trial">Trial</span>
                            )}
                            {(c.billingStatus === 'past_due' || c.billingStatus === 'paused') && (
                              <span className="adm-billing-pill adm-billing-pill--failed">Payment Failed</span>
                            )}
                            {c.status === 'live' && c.campaignStatus === 'pending' && (
                              <button
                                className="adm-warmup-btn"
                                onClick={() => handleStartWarmup(c)}
                              >
                                Start Warmup
                              </button>
                            )}

                            {/* Mobile-only: pill row — only renders when there's at least one item to show */}
                            {c.status !== 'pending' && (() => {
                              const showTrial = c.status === 'live' && !c.firstMonthPaid && (c.billingStatus === 'trial' || !c.billingStatus);
                              const showPayFailed = c.billingStatus === 'past_due' || c.billingStatus === 'paused';
                              const cs = c.campaignStatus;
                              const warmDay = cs === 'warming' && c.warmupStartedAt
                                ? Math.floor((Date.now() - new Date(c.warmupStartedAt).getTime()) / 86400000) + 1
                                : 0;
                              const showWarming    = cs === 'warming' && warmDay >= 1 && warmDay <= 14;
                              const showPaused     = cs === 'paused';
                              const showCancelled  = cs === 'cancelled';
                              const showStartWarmup = c.status === 'live' && cs === 'pending';
                              if (!showTrial && !showPayFailed && !showWarming && !showPaused && !showCancelled && !showStartWarmup) return null;
                              return (
                                <div className="adm-mobile-pill-row">
                                  {showTrial     && <span className="adm-billing-pill adm-billing-pill--trial">Trial</span>}
                                  {showPayFailed && <span className="adm-billing-pill adm-billing-pill--failed">Payment Failed</span>}
                                  {showWarming   && <span className="adm-client-pill adm-client-pill--warming"><span style={{ color: '#f59e0b' }}>●</span> Warming — Day {warmDay} of 14</span>}
                                  {showPaused    && <span className="adm-client-pill adm-client-pill--paused">● Paused</span>}
                                  {showCancelled && <span className="adm-client-pill adm-client-pill--cancelled">● Cancelled</span>}
                                  {showStartWarmup && (
                                    <button className="adm-warmup-btn" onClick={() => handleStartWarmup(c)}>Start Warmup</button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Campaign status pill + actions */}
                          <div className="adm-client-right">
                            {(() => {
                              const cs = c.campaignStatus;
                              if (cs === 'warming' && c.warmupStartedAt) {
                                const day = Math.floor((Date.now() - new Date(c.warmupStartedAt).getTime()) / 86400000) + 1;
                                if (day > 14) return <span className="adm-client-pill adm-client-pill--live">● Active</span>;
                                return <span className="adm-client-pill adm-client-pill--warming"><span style={{ color: '#f59e0b' }}>●</span> Warming — Day {day} of 14</span>;
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
                                    <button className="adm-actions-item" onClick={() => { setCampaignIdClient(c); setCampaignIdInput(c.smartleadCampaignId ?? ''); setOpenDropdownId(null); }}>
                                      {c.smartleadCampaignId ? 'Update Campaign ID' : 'Set Campaign ID'}
                                    </button>
                                    <div className="adm-actions-divider" />
                                    <button className="adm-actions-item" onClick={() => { setBookingLinkClient(c); setBookingLinkInput(c.bookingLink ?? ''); setOpenDropdownId(null); }}>
                                      {c.bookingLink ? 'Update Booking Link' : 'Set Booking Link'}
                                    </button>
                                    <div className="adm-actions-divider" />
                                    <button className="adm-actions-item" onClick={() => { setPromptClient(c); setPromptInput(c.aiReplyPrompt ?? ''); setOpenDropdownId(null); }}>
                                      {c.aiReplyPrompt ? 'Update AI Reply Prompt' : 'Set AI Reply Prompt'}
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
                                    {(c.billingStatus === 'past_due' || c.billingStatus === 'paused') && (
                                      <>
                                        <button className="adm-actions-item adm-actions-item--warn" onClick={() => handleUpdatePayment(c)}>
                                          Update Payment →
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

            {/* ── My Campaign ── */}
            {myClientId && (
              <>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, marginBottom: 12 }}>
                  <p className="cd-health-label" style={{ margin: 0 }}>My Campaign</p>
                  <div className="cd-period-dropdown" ref={myPeriodRef}>
                    <button className="cd-period-btn" onClick={() => setMyPeriodOpen(o => !o)}>
                      {PERIOD_LABEL[myPeriod]}
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {myPeriodOpen && (
                      <div className="cd-period-menu">
                        {(['week','month','alltime'] as const).map(opt => (
                          <button
                            key={opt}
                            className={`cd-period-option${myPeriod === opt ? ' active' : ''}`}
                            onClick={() => { setMyPeriod(opt); setMyPeriodOpen(false); }}
                          >
                            {PERIOD_LABEL[opt]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Three metric tiles */}
                <div className="adm-my-metrics">
                  <div className="cd-metric-card">
                    <div className="cd-metric-label">Emails Sent</div>
                    <div className="cd-metric-value">{myMetrics?.emails_sent ?? '—'}</div>
                    <div className="cd-metric-period">{PERIOD_LABEL[myPeriod]}</div>
                  </div>
                  <div className="cd-metric-card">
                    <div className="cd-metric-label">Replies</div>
                    <div className="cd-metric-value">{myMetrics?.replies ?? '—'}</div>
                    <div className="cd-metric-period">{PERIOD_LABEL[myPeriod]}</div>
                  </div>
                  <div className="cd-metric-card">
                    <div className="cd-metric-label">Hot Leads</div>
                    <div className="cd-metric-value">{myMetrics?.hot_leads ?? '—'}</div>
                    <div className="cd-metric-period">{PERIOD_LABEL[myPeriod]}</div>
                  </div>
                </div>

                {/* Hot Lead Conversations */}
                <p className="cd-health-label">Hot Lead Conversations</p>
                <div className="cd-card hl-card" style={{ marginBottom: 40 }}>
                  <div className="hl-search-row">
                    <div className="hl-search-inner">
                      <svg className="hl-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input
                        className="hl-search"
                        placeholder="Search leads..."
                        value={myHlSearch}
                        onChange={e => setMyHlSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {(() => {
                    const filtered = myHotLeads.filter(lead => {
                      if (!myHlSearch) return true;
                      const q = myHlSearch.toLowerCase();
                      return (
                        (lead.lead_name    ?? '').toLowerCase().includes(q) ||
                        (lead.lead_company ?? '').toLowerCase().includes(q) ||
                        lead.lead_email.toLowerCase().includes(q)
                      );
                    });
                    if (filtered.length === 0) return (
                      <div className="hl-empty">
                        {myHotLeads.length === 0
                          ? 'No hot leads yet — when a prospect replies with interest, your AI handles it and the conversation appears here.'
                          : 'No results match your search.'}
                      </div>
                    );
                    return (
                      <div className="hl-list" ref={myHlMenuRef}>
                        {filtered.map((lead, i) => (
                          <div key={lead.id}>
                            {i > 0 && <div className="hl-divider" />}
                            <div className="hl-row" onClick={() => handleMyHlOpen(lead)}>
                              <div className="hl-row-info">
                                <div className="hl-row-top">
                                  <span className="hl-row-name">{lead.lead_name || lead.lead_email}</span>
                                  {lead.status === 'followed_up' && (
                                    <span className="hl-pill-followed">Followed Up</span>
                                  )}
                                </div>
                                {lead.lead_company && <div className="hl-row-company">{lead.lead_company}</div>}
                                <div className="hl-row-email">{lead.lead_email}</div>
                              </div>
                              <div className="hl-menu-wrap" onClick={e => e.stopPropagation()}>
                                <button
                                  className="hl-menu-btn"
                                  onClick={() => setMyHlMenuId(myHlMenuId === lead.id ? null : lead.id)}
                                >
                                  •••
                                </button>
                                {myHlMenuId === lead.id && (
                                  <div className="hl-menu">
                                    <button className="hl-menu-item" onClick={() => handleMyHlFollowedUp(lead.id)}>
                                      {lead.status === 'followed_up' ? '✓ Followed Up' : 'Mark as Followed Up'}
                                    </button>
                                    <button className="hl-menu-item hl-menu-item--danger" onClick={() => handleMyHlRemove(lead.id)}>
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

          </div>

        )}
      </main>

      {/* ── My Conversation Modal ── */}
      {myHlOpenLead && (
        <div className="hl-modal-overlay" onClick={() => setMyHlOpenLead(null)}>
          <div className="hl-modal" onClick={e => e.stopPropagation()}>
            <div className="hl-modal-header">
              <div>
                <div className="hl-modal-lead-name">{myHlOpenLead.lead_name || myHlOpenLead.lead_email}</div>
                <div className="hl-modal-lead-meta">
                  {[myHlOpenLead.lead_company, myHlOpenLead.lead_email].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button className="hl-modal-close" onClick={() => setMyHlOpenLead(null)}>✕</button>
            </div>
            <div className="hl-modal-body">
              {myHlConvLoading && <div className="hl-modal-loading">Loading conversation…</div>}
              {!myHlConvLoading && myHlConvPartial && (
                <div className="hl-modal-partial-note">
                  Full conversation thread not yet available — showing the AI reply that triggered this hot lead.
                </div>
              )}
              {!myHlConvLoading && myHlConversation && myHlConversation.map(msg => (
                <div key={msg.id} className={`hl-msg hl-msg--${msg.type}`}>
                  <div className="hl-msg-sender">
                    {msg.type === 'outbound' ? 'AI Reply' : msg.sender}
                  </div>
                  {msg.subject && <div className="hl-msg-subject">Re: {msg.subject}</div>}
                  <div className="hl-msg-body">{msg.body}</div>
                  {msg.time && (
                    <div className="hl-msg-time">
                      {new Date(msg.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
              {!myHlConvLoading && (!myHlConversation || myHlConversation.length === 0) && (
                <div className="hl-modal-loading">No conversation data available yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* ── Set Campaign ID Modal ── */}
      {campaignIdClient && (
        <div className="modal-overlay" onClick={() => { setCampaignIdClient(null); setCampaignIdInput(''); }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setCampaignIdClient(null); setCampaignIdInput(''); }}>✕</button>
            <div className="modal-scroll">
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>Smartlead</p>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1715' }}>Set Campaign ID</h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Paste the Smartlead campaign ID for <strong style={{ color: '#1A1715' }}>{campaignIdClient.name}</strong>. This links their dashboard metrics to their specific campaign.
              </p>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Campaign ID
              </label>
              <input
                type="text"
                value={campaignIdInput}
                onChange={e => setCampaignIdInput(e.target.value)}
                placeholder="e.g. 123456"
                autoFocus
                style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 24, fontFamily: 'monospace' }}
              />
              <div className="ccm-actions">
                <button
                  className="ccm-btn-connect"
                  disabled={!campaignIdInput.trim() || campaignIdSaving}
                  onClick={handleSaveCampaignId}
                  style={{ opacity: !campaignIdInput.trim() ? 0.5 : 1 }}
                >
                  {campaignIdSaving ? 'Saving…' : 'Save Campaign ID'}
                </button>
                <button className="ccm-btn-cancel" onClick={() => { setCampaignIdClient(null); setCampaignIdInput(''); }}>Cancel</button>
              </div>
              {campaignIdClient?.smartleadCampaignId && (
                <button
                  onClick={() => handleClearField(campaignIdClient.id, 'smartlead_campaign_id')}
                  style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 13, color: '#DC2626', cursor: 'pointer', padding: 0 }}
                >
                  Clear campaign ID
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Set Booking Link Modal ── */}
      {bookingLinkClient && (
        <div className="modal-overlay" onClick={() => { setBookingLinkClient(null); setBookingLinkInput(''); }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setBookingLinkClient(null); setBookingLinkInput(''); }}>✕</button>
            <div className="modal-scroll">
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>AI Reply</p>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1715' }}>Set Booking Link</h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Paste the calendar URL for <strong style={{ color: '#1A1715' }}>{bookingLinkClient.name}</strong>. This is the link the AI will send to interested prospects.
              </p>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Calendar URL
              </label>
              <input
                type="url"
                value={bookingLinkInput}
                onChange={e => setBookingLinkInput(e.target.value)}
                placeholder="https://cal.com/theirname/call"
                autoFocus
                style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 24 }}
              />
              <div className="ccm-actions">
                <button
                  className="ccm-btn-connect"
                  disabled={!bookingLinkInput.trim() || bookingLinkSaving}
                  onClick={handleSaveBookingLink}
                  style={{ opacity: !bookingLinkInput.trim() ? 0.5 : 1 }}
                >
                  {bookingLinkSaving ? 'Saving…' : 'Save Booking Link'}
                </button>
                <button className="ccm-btn-cancel" onClick={() => { setBookingLinkClient(null); setBookingLinkInput(''); }}>Cancel</button>
              </div>
              {bookingLinkClient.bookingLink && (
                <button
                  onClick={() => handleClearField(bookingLinkClient.id, 'booking_link')}
                  style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 13, color: '#DC2626', cursor: 'pointer', padding: 0 }}
                >
                  Clear booking link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Set AI Reply Prompt Modal ── */}
      {promptClient && (
        <div className="modal-overlay" onClick={() => { setPromptClient(null); setPromptInput(''); }}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setPromptClient(null); setPromptInput(''); }}>✕</button>
            <div className="modal-scroll">
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>AI Reply</p>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1715' }}>Set AI Reply Prompt</h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Paste the full AI reply prompt for <strong style={{ color: '#1A1715' }}>{promptClient.name}</strong>. This is what Claude uses to reply to prospects on their behalf.
              </p>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Prompt
              </label>
              <textarea
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                placeholder="Paste the full AI reply prompt here..."
                autoFocus
                rows={14}
                style={{ width: '100%', padding: '11px 14px', fontSize: 13, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 24, resize: 'vertical', lineHeight: 1.7, fontFamily: 'inherit' }}
              />
              <div className="ccm-actions">
                <button
                  className="ccm-btn-connect"
                  disabled={!promptInput.trim() || promptSaving}
                  onClick={handleSavePrompt}
                  style={{ opacity: !promptInput.trim() ? 0.5 : 1 }}
                >
                  {promptSaving ? 'Saving…' : 'Save Prompt'}
                </button>
                <button className="ccm-btn-cancel" onClick={() => { setPromptClient(null); setPromptInput(''); }}>Cancel</button>
              </div>
              {promptClient.aiReplyPrompt && (
                <button
                  onClick={() => handleClearField(promptClient.id, 'ai_reply_prompt')}
                  style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 13, color: '#DC2626', cursor: 'pointer', padding: 0 }}
                >
                  Clear AI reply prompt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── My Settings Modal ── */}
      {settingsOpen && (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSettingsOpen(false)}>✕</button>
            <div className="modal-scroll">
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>My Account</p>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1715' }}>Settings</h2>
              <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Configure your own campaign, calendar link, and AI reply prompt.
              </p>

              {settingsLoading ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
              ) : (
                <>
                  {/* Campaign ID */}
                  <div style={{ marginBottom: 28 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Campaign ID
                    </label>
                    <input
                      type="text"
                      value={myCampaignId}
                      onChange={e => setMyCampaignId(e.target.value)}
                      placeholder="e.g. 123456"
                      style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 10, fontFamily: 'monospace' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {myCampaignId ? (
                        <button onClick={() => handleClearMySetting('smartlead_campaign_id')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#DC2626', cursor: 'pointer', padding: 0 }}>
                          Clear
                        </button>
                      ) : <span />}
                      <button
                        disabled={!myCampaignId.trim() || settingsSaving === 'campaignId'}
                        onClick={() => handleSaveMySetting('smartlead_campaign_id', myCampaignId, 'campaignId')}
                        style={{ background: '#1A1715', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: !myCampaignId.trim() ? 'default' : 'pointer', opacity: !myCampaignId.trim() ? 0.4 : 1 }}
                      >
                        {settingsSaving === 'campaignId' ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 1, background: '#F0EDE8', marginBottom: 28 }} />

                  {/* Booking Link */}
                  <div style={{ marginBottom: 28 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Booking Link
                    </label>
                    <input
                      type="url"
                      value={myBookingLink}
                      onChange={e => setMyBookingLink(e.target.value)}
                      placeholder="https://cal.com/yourname/call"
                      style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {myBookingLink ? (
                        <button onClick={() => handleClearMySetting('booking_link')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#DC2626', cursor: 'pointer', padding: 0 }}>
                          Clear
                        </button>
                      ) : <span />}
                      <button
                        disabled={!myBookingLink.trim() || settingsSaving === 'bookingLink'}
                        onClick={() => handleSaveMySetting('booking_link', myBookingLink, 'bookingLink')}
                        style={{ background: '#1A1715', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: !myBookingLink.trim() ? 'default' : 'pointer', opacity: !myBookingLink.trim() ? 0.4 : 1 }}
                      >
                        {settingsSaving === 'bookingLink' ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 1, background: '#F0EDE8', marginBottom: 28 }} />

                  {/* AI Reply Prompt */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      AI Reply Prompt
                    </label>
                    <textarea
                      value={myPrompt}
                      onChange={e => setMyPrompt(e.target.value)}
                      placeholder="Paste your full AI reply prompt here..."
                      rows={12}
                      style={{ width: '100%', padding: '11px 14px', fontSize: 13, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', color: '#1A1715', marginBottom: 10, resize: 'vertical', lineHeight: 1.7, fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {myPrompt ? (
                        <button onClick={() => handleClearMySetting('ai_reply_prompt')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#DC2626', cursor: 'pointer', padding: 0 }}>
                          Clear
                        </button>
                      ) : <span />}
                      <button
                        disabled={!myPrompt.trim() || settingsSaving === 'prompt'}
                        onClick={() => handleSaveMySetting('ai_reply_prompt', myPrompt, 'prompt')}
                        style={{ background: '#1A1715', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: !myPrompt.trim() ? 'default' : 'pointer', opacity: !myPrompt.trim() ? 0.4 : 1 }}
                      >
                        {settingsSaving === 'prompt' ? 'Saving…' : 'Save'}
                      </button>
                    </div>
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
