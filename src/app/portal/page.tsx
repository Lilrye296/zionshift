'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const OPS_TABS = ['Pending Replies', 'Opt-Out Log', 'Future Pipeline', 'Website Inbound'];

export default function PortalPage() {
  const [activeSection, setActiveSection] = useState<'ops' | 'business'>('ops');
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="portal-page">
      {/* Portal Nav */}
      <header className="portal-nav">
        <div className="portal-nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZionShift" className="portal-logo" />
          <div className="portal-nav-sections">
            <button
              className={`portal-section-btn ${activeSection === 'ops' ? 'active' : ''}`}
              onClick={() => setActiveSection('ops')}
            >
              Operations
            </button>
            <button
              className={`portal-section-btn ${activeSection === 'business' ? 'active' : ''}`}
              onClick={() => setActiveSection('business')}
            >
              Business
            </button>
          </div>
          <button className="btn btn-ghost" onClick={handleSignOut} style={{ fontSize: 13, padding: '8px 16px' }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="portal-main">

        {/* ── OPERATIONS ── */}
        {activeSection === 'ops' && (
          <div>
            <div className="portal-tabs">
              {OPS_TABS.map((tab, i) => (
                <button
                  key={i}
                  className={`portal-tab ${activeTab === i ? 'active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="portal-tab-body">
              {activeTab === 0 && (
                <div className="portal-empty">
                  <p>Pending Replies will appear here.</p>
                  <span>Approve, edit, or skip AI-drafted responses.</span>
                </div>
              )}
              {activeTab === 1 && (
                <div className="portal-empty">
                  <p>Opt-Out Log will appear here.</p>
                  <span>Read-only legal trail of all opt-outs.</span>
                </div>
              )}
              {activeTab === 2 && (
                <div className="portal-empty">
                  <p>Future Pipeline will appear here.</p>
                  <span>Not-now leads with scheduled re-entry dates.</span>
                </div>
              )}
              {activeTab === 3 && (
                <div className="portal-empty">
                  <p>Website Inbound will appear here.</p>
                  <span>Form fills submitted from zionshift.com.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BUSINESS ── */}
        {activeSection === 'business' && (
          <div>
            <div className="portal-section-header">
              <span className="eyebrow">Business Overview</span>
              <h2 className="portal-heading">Your numbers.</h2>
            </div>
            <div className="portal-metrics">
              {[
                { label: 'Active Clients',  value: '—' },
                { label: 'MRR',             value: '—' },
                { label: 'Setup Fees',      value: '—' },
                { label: 'Zooms Booked',    value: '—' },
              ].map((m, i) => (
                <div key={i} className="portal-metric-card">
                  <div className="portal-metric-label">{m.label}</div>
                  <div className="portal-metric-value">{m.value}</div>
                </div>
              ))}
            </div>
            <div className="portal-empty" style={{ marginTop: 32 }}>
              <p>Pipeline overview coming soon.</p>
              <span>Client activity and revenue data will display here.</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
