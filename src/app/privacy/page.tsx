'use client';

export default function PrivacyPage() {
  const updated = 'April 2026';

  return (
    <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid var(--zs-border)',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
      }}>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 0,
            padding: '8px 16px',
            borderRadius: 8,
            transition: 'background 160ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--zs-paper)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZionShift" style={{ height: 22, width: 'auto' }} />
        </a>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid var(--zs-border)',
        padding: '64px 32px 56px',
        maxWidth: 760,
        margin: '0 auto',
        width: '100%',
      }}>
        <p style={{
          font: '600 11px var(--zs-mono)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--zs-ink-5)',
          margin: '0 0 16px',
        }}>
          Legal
        </p>
        <h1 style={{
          font: '700 42px var(--zs-sans)',
          letterSpacing: '-0.04em',
          color: 'var(--zs-ink)',
          margin: '0 0 14px',
          lineHeight: 1.05,
        }}>
          Privacy Policy
        </h1>
        <p style={{
          font: '400 15px var(--zs-sans)',
          color: 'var(--zs-ink-4)',
          margin: '0 0 20px',
          lineHeight: 1.6,
          letterSpacing: '-0.005em',
          maxWidth: 560,
        }}>
          This policy explains what information ZionShift collects, how we use it,
          and your rights regarding your data.
        </p>
        <p style={{
          font: '400 12px var(--zs-mono)',
          color: 'var(--zs-ink-5)',
          margin: 0,
          letterSpacing: '0.04em',
        }}>
          Last updated: {updated}
        </p>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', width: '100%', padding: '0 32px' }}>

        <Section num="1" title="Who We Are">
          <p>ZionShift (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a B2B cold email outreach and lead generation service operated out of Tampa, Florida. We provide outreach campaign services to business owners and professionals (our &ldquo;Clients&rdquo;).</p>
          <p>If you have any questions about this policy, you can reach us at <strong>ryan@zionshift.com</strong>.</p>
        </Section>

        <Section num="2" title="Information We Collect">
          <SubHeading>Information You Provide</SubHeading>
          <p>When you complete our onboarding form or interact with ZionShift, we may collect:</p>
          <ul>
            <li>Your name, business name, and email address</li>
            <li>Business details such as location, industry, years in operation, and website URL</li>
            <li>Ideal client profile information (target industries, employee count, revenue range, geographic focus)</li>
            <li>Messaging preferences, tone, and campaign strategy details</li>
            <li>Your availability and scheduling preferences</li>
            <li>A business logo and professional headshot (if uploaded)</li>
          </ul>
          <SubHeading>Payment Information</SubHeading>
          <p>All payment processing is handled by <strong>Stripe</strong>. ZionShift does not store your credit card number, CVV, or full payment details. Stripe may retain payment data in accordance with their own privacy policy, available at stripe.com/privacy.</p>
          <SubHeading>Automatically Collected Information</SubHeading>
          <p>When you visit our website, standard server logs may capture your IP address, browser type, and pages visited. We do not use tracking pixels, retargeting cookies, or third-party analytics at this time.</p>
        </Section>

        <Section num="3" title="How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Set up and manage your outreach campaigns</li>
            <li>Build and personalize your booking page and email sequences</li>
            <li>Communicate with you about your account, campaigns, and billing</li>
            <li>Process payments and manage your subscription through Stripe</li>
            <li>Improve our services and internal processes</li>
            <li>Comply with applicable legal obligations</li>
          </ul>
          <p>We do not sell, rent, or trade your personal information to any third party for marketing purposes.</p>
        </Section>

        <Section num="4" title="Third-Party Services">
          <p>To operate our services, we work with the following third-party providers. Each has their own privacy policy governing how they handle data:</p>
          <ul>
            <li><strong>Stripe</strong> — payment processing and billing (stripe.com/privacy)</li>
            <li><strong>Supabase</strong> — secure cloud database and file storage (supabase.com/privacy)</li>
            <li><strong>Resend</strong> — transactional email delivery (resend.com/privacy)</li>
          </ul>
          <p>We share only the minimum information necessary for these providers to perform their services on our behalf. We do not authorize them to use your data for any other purpose.</p>
        </Section>

        <Section num="5" title="Data Retention">
          <p>We retain your personal information for as long as your account is active or as needed to provide services. If you terminate your agreement with ZionShift, we will retain your data for up to <strong>12 months</strong> for billing and legal compliance purposes, after which it will be deleted or anonymized.</p>
          <p>You may request earlier deletion by contacting us at <strong>ryan@zionshift.com</strong>. Note that we may need to retain certain records to comply with legal obligations or resolve disputes.</p>
        </Section>

        <Section num="6" title="Your Rights">
          <p>Depending on where you are located, you may have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            <li><strong>Correction</strong> — ask us to correct inaccurate or incomplete information</li>
            <li><strong>Deletion</strong> — request that we delete your personal data</li>
            <li><strong>Portability</strong> — receive your data in a commonly used, machine-readable format</li>
            <li><strong>Objection</strong> — object to certain processing of your data</li>
          </ul>
          <p>To exercise any of these rights, contact us at <strong>ryan@zionshift.com</strong>. We will respond within 30 days.</p>
        </Section>

        <Section num="7" title="Data Security">
          <p>We take reasonable technical and organizational measures to protect your information against unauthorized access, loss, or disclosure. Data is stored securely using Supabase&apos;s encrypted cloud infrastructure. Access to client data within ZionShift is limited to authorized personnel only.</p>
          <p>No method of transmission over the internet is 100% secure. While we do our best to protect your data, we cannot guarantee absolute security.</p>
        </Section>

        <Section num="8" title="Children's Privacy">
          <p>ZionShift is a B2B service intended solely for business professionals. We do not knowingly collect personal information from anyone under the age of 18. If you believe we have inadvertently collected such information, please contact us immediately at <strong>ryan@zionshift.com</strong>.</p>
        </Section>

        <Section num="9" title="Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo; date at the top of this page and notify active clients by email at least 14 days before changes take effect. Continued use of our services after that date constitutes acceptance of the updated policy.</p>
        </Section>

        <Section num="10" title="Contact Us" last>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please contact us at:</p>
          <p><strong>ryan@zionshift.com</strong></p>
        </Section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{
        marginTop: 64,
        borderTop: '1px solid var(--zs-border)',
      }}>
        <div style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZionShift" style={{ height: 22, width: 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="/" style={slimLinkStyle}>Home</a>
            <span style={{ color: 'var(--zs-ink-5)', fontSize: 13 }}>·</span>
            <a href="mailto:ryan@zionshift.com" style={slimLinkStyle}>ryan@zionshift.com</a>
            <span style={{ color: 'var(--zs-ink-5)', fontSize: 13 }}>·</span>
            <span style={{ font: '400 13px var(--zs-sans)', color: 'var(--zs-ink-5)', letterSpacing: '-0.005em' }}>
              © {new Date().getFullYear()} ZionShift
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

const slimLinkStyle: React.CSSProperties = {
  font: '400 13px var(--zs-sans)',
  color: 'var(--zs-ink-5)',
  textDecoration: 'none',
  letterSpacing: '-0.005em',
  transition: 'color 160ms',
};

function Section({ num, title, children, last = false }: {
  num: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section style={{
      padding: '40px 0',
      borderBottom: last ? 'none' : '1px solid var(--zs-border-soft)',
    }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <span style={{
          font: '600 11px var(--zs-mono)',
          color: 'var(--zs-ink-5)',
          letterSpacing: '0.08em',
          marginTop: 5,
          flexShrink: 0,
          width: 24,
        }}>
          {num}.
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            font: '700 18px var(--zs-sans)',
            letterSpacing: '-0.025em',
            color: 'var(--zs-ink)',
            margin: '0 0 14px',
            lineHeight: 1.2,
          }}>
            {title}
          </h2>
          <div style={{
            font: '400 14px var(--zs-sans)',
            color: 'var(--zs-ink-3)',
            lineHeight: 1.75,
            letterSpacing: '-0.005em',
          }}
            className="terms-body"
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      font: '600 13px var(--zs-sans)',
      color: 'var(--zs-ink)',
      letterSpacing: '-0.01em',
      margin: '20px 0 6px',
    }}>
      {children}
    </p>
  );
}
