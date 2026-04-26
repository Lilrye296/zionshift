'use client';

export default function TermsPage() {
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
          Client Service Agreement
        </h1>
        <p style={{
          font: '400 15px var(--zs-sans)',
          color: 'var(--zs-ink-4)',
          margin: '0 0 20px',
          lineHeight: 1.6,
          letterSpacing: '-0.005em',
          maxWidth: 560,
        }}>
          Please read this agreement carefully before completing your setup fee payment.
          By paying, you confirm you have read and agreed to these terms.
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

        <Section num="1" title="Services">
          <p>ZionShift provides B2B cold email outreach and lead generation services on behalf of the Client. Specific services include:</p>
          <ul>
            <li>Custom outreach campaign strategy and copywriting</li>
            <li>Email infrastructure setup, warmup, and deliverability management</li>
            <li>Ongoing campaign management and optimization</li>
            <li>A dedicated booking page where qualified prospects can schedule discovery calls</li>
            <li>Access to the ZionShift client dashboard</li>
          </ul>
          <p>We do not provide website design, paid advertising, social media management, or any service not explicitly listed above.</p>
        </Section>

        <Section num="2" title="Fees &amp; Billing">
          <SubHeading>Setup Fee</SubHeading>
          <p>A one-time, non-refundable Setup Fee of <strong>$1,000</strong> is due before services begin. This fee covers account creation, email infrastructure buildout, campaign strategy, and initial warmup. It is non-refundable under any circumstances, including early cancellation.</p>

          <SubHeading>Monthly Retainer</SubHeading>
          <p>Following your first qualified lead (defined in Section 3), a recurring monthly retainer of <strong>$2,000</strong> will be charged to the payment method on file.</p>

          <SubHeading>Trial Period</SubHeading>
          <p>Your first monthly retainer will not be charged until <strong>30 days after the date your first qualified lead books a discovery call</strong> on your calendar. This trial period is a courtesy and does not affect the non-refundable nature of the Setup Fee. After the trial period ends, billing continues monthly on the same date until the Agreement is terminated per Section 6.</p>

          <SubHeading>Automatic Billing</SubHeading>
          <p>By completing the Setup Fee payment, you authorize ZionShift to store your payment method and automatically charge the monthly retainer of $2,000 on your billing date each month. You will receive advance notice before your first retainer charge and before each subsequent renewal.</p>

          <SubHeading>Late Payments</SubHeading>
          <p>If a charge fails, we will retry up to three times over seven days. If payment is not resolved, services may be paused until the outstanding balance is settled.</p>
        </Section>

        <Section num="3" title="Qualified Lead Definition">
          <p>A &ldquo;qualified lead&rdquo; is defined as any business owner or decision-maker who books a discovery call through your ZionShift booking page in response to outreach conducted by ZionShift. ZionShift does not control whether prospects attend their scheduled calls, convert to clients, or meet any specific revenue threshold. A booked call &mdash; regardless of outcome &mdash; constitutes a qualified lead for billing purposes.</p>
        </Section>

        <Section num="4" title="No Guarantee of Results">
          <Callout>
            ZionShift makes no guarantee of specific results, including but not limited to: a minimum number of leads, meetings, clients, or revenue generated.
          </Callout>
          <p>Cold email outreach performance depends on many factors outside our control, including your industry, offer, geographic market, pricing, and how you conduct discovery calls. We commit to building and managing professional, high-quality campaigns &mdash; we do not commit to specific outcomes.</p>
          <p>By signing this Agreement, you acknowledge that you understand lead generation involves inherent uncertainty and that payment obligations are not contingent on achieving any particular result.</p>
        </Section>

        <Section num="5" title="Client Responsibilities">
          <p>You agree to:</p>
          <ul>
            <li>Complete the onboarding form accurately and in full</li>
            <li>Respond to booked discovery calls in a timely manner</li>
            <li>Maintain an active calendar and booking page</li>
            <li>Notify ZionShift promptly of any changes to your business, target market, or availability</li>
            <li>Not use ZionShift&apos;s outreach infrastructure for spam, illegal communications, or any purpose that violates applicable law or email regulations (CAN-SPAM, GDPR, CASL)</li>
          </ul>
          <p>Failure to fulfill these responsibilities may affect campaign performance. ZionShift is not liable for reduced results caused by Client inaction.</p>
        </Section>

        <Section num="6" title="Term &amp; Termination">
          <p>This Agreement begins on the date the Setup Fee is paid and continues on a month-to-month basis following the trial period.</p>
          <SubHeading>Cancellation by Client</SubHeading>
          <p>You may cancel at any time by providing written notice to <strong>ryan@zionshift.com</strong> at least <strong>7 days before your next billing date.</strong> You will not be charged for the following month. No partial-month refunds are issued.</p>
          <SubHeading>Termination by ZionShift</SubHeading>
          <p>We reserve the right to terminate this Agreement immediately if you violate Section 5, fail to pay outstanding balances, or engage in conduct that damages ZionShift&apos;s reputation or infrastructure. Upon termination, your campaign will be wound down and dashboard access will be discontinued at the end of your paid period.</p>
        </Section>

        <Section num="7" title="Refund Policy">
          <p>The $1,000 Setup Fee is <strong>non-refundable</strong> under all circumstances. Monthly retainer payments are non-refundable once charged. If you believe a charge was made in error, contact us within 7 days at <strong>ryan@zionshift.com</strong> and we will investigate in good faith.</p>
        </Section>

        <Section num="8" title="Chargebacks">
          <p>Initiating a chargeback or payment dispute without first contacting ZionShift to resolve the issue is a breach of this Agreement. In the event of an unjustified chargeback, you authorize ZionShift to provide this Agreement and all payment records to the card issuer as evidence that services were rendered and agreed to. ZionShift reserves the right to pursue collection of disputed amounts plus any fees incurred as a result of the chargeback.</p>
        </Section>

        <Section num="9" title="Confidentiality">
          <p>Each party agrees to keep confidential any non-public information shared by the other party in connection with this Agreement, including but not limited to business strategy, client lists, and pricing. This obligation survives termination of the Agreement.</p>
        </Section>

        <Section num="10" title="Limitation of Liability">
          <p>ZionShift&apos;s total liability to you for any claim arising under this Agreement shall not exceed the total amount paid by you to ZionShift in the three months preceding the claim. ZionShift is not liable for any indirect, incidental, consequential, or punitive damages, including lost profits or lost business opportunities.</p>
        </Section>

        <Section num="11" title="Dispute Resolution">
          <p>In the event of a dispute, both parties agree to first attempt resolution in good faith through direct communication. If unresolved within 30 days, disputes shall be settled by binding arbitration under the rules of the American Arbitration Association. The prevailing party shall be entitled to recover reasonable legal fees.</p>
        </Section>

        <Section num="12" title="Governing Law">
          <p>This Agreement is governed by the laws of the <strong>State of Florida</strong>, without regard to conflict of law principles.</p>
        </Section>

        <Section num="13" title="Entire Agreement">
          <p>This Agreement constitutes the entire agreement between the parties regarding its subject matter and supersedes any prior discussions, representations, or agreements. ZionShift may update these terms with 30 days&apos; written notice to the Client&apos;s email on file.</p>
        </Section>

        <Section num="14" title="Electronic Acceptance" last>
          <p>By completing payment of the Setup Fee, you confirm that you have read, understood, and agree to be bound by this Agreement. Electronic acceptance carries the same legal weight as a handwritten signature.</p>
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
        {/* Section number */}
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
          }}
            dangerouslySetInnerHTML={{ __html: title }}
          />
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

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--zs-paper)',
      border: '1px solid var(--zs-border)',
      borderLeft: '3px solid var(--zs-ink)',
      borderRadius: '0 8px 8px 0',
      padding: '14px 18px',
      margin: '0 0 16px',
      font: '500 13px var(--zs-sans)',
      color: 'var(--zs-ink-2)',
      lineHeight: 1.65,
      letterSpacing: '-0.005em',
    }}>
      {children}
    </div>
  );
}
