export default function ThankYouPage() {
  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center', padding: '52px 40px 48px' }}>

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/" style={{ display: 'inline-block', marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZionShift" className="login-logo" style={{ margin: '0 auto' }} />
        </a>

        {/* Check circle */}
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Heading */}
        <h1 style={{
          font: '700 34px var(--zs-sans)',
          letterSpacing: '-0.04em',
          color: 'var(--zs-ink)',
          margin: '0 0 12px',
          lineHeight: 1.1,
        }}>
          Payment confirmed.
        </h1>

        {/* Subtext */}
        <p style={{
          font: '400 15px var(--zs-sans)',
          color: 'var(--zs-ink-4)',
          lineHeight: 1.65,
          margin: '0 0 32px',
          letterSpacing: '-0.005em',
        }}>
          Thank you — we&apos;re genuinely excited to have you on board.
          Your account setup link is on its way to your inbox right now.
        </p>

        {/* Inbox nudge */}
        <div style={{
          background: 'var(--zs-paper)',
          border: '1px solid var(--zs-border)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--zs-ink-4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }} aria-hidden>
            <rect x="2" y="4" width="20" height="16" rx="3"/>
            <polyline points="2,7 12,14 22,7"/>
          </svg>
          <p style={{
            font: '400 13px var(--zs-sans)',
            color: 'var(--zs-ink-3)',
            margin: 0,
            lineHeight: 1.55,
            letterSpacing: '-0.005em',
          }}>
            Check your inbox for an email from{' '}
            <span style={{ fontWeight: 600, color: 'var(--zs-ink)' }}>hello@zionshift.com</span>
            {' '}— it has everything you need to get started.
          </p>
        </div>

        {/* Footer note */}
        <p style={{
          font: '400 12px var(--zs-mono)',
          color: 'var(--zs-ink-5)',
          marginTop: 28,
          letterSpacing: '0.01em',
        }}>
          Questions? Reply to the email or reach us at{' '}
          <a href="mailto:ryan@zionshift.com"
            style={{ color: 'var(--zs-ink-4)', textDecoration: 'none' }}>
            ryan@zionshift.com
          </a>
        </p>

      </div>
    </div>
  );
}
