import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Dummy client data for previewing emails
const DUMMY = {
  firstName:   'Ryan',
  fullName:    'Ryan Flores',
  email:       'ryan@zionshift.com',
  firm:        'Apex Financial Group',
  amount:      '$2,000.00',
  date:        'May 15, 2026',
  chargeDate:  'May 15, 2026',
  portalUrl:   'https://www.zionshift.com/client',
};

const VALID_TYPES = [
  'trial-ending',
  'campaign-live',
  'payment-failed-client',
  'payment-failed-admin',
  'payment-resolved',
  'campaign-paused',
] as const;

type EmailType = typeof VALID_TYPES[number];

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') as EmailType | null;

  if (!type || !VALID_TYPES.includes(type as EmailType)) {
    return NextResponse.json({
      error: 'Missing or invalid ?type= param.',
      validTypes: VALID_TYPES,
    }, { status: 400 });
  }

  const resend = resendClient();

  try {
    switch (type) {

      // ── 1. Trial ending warning ────────────────────────────────────
      case 'trial-ending': {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      DUMMY.email,
          replyTo: 'ryan@zionshift.com',
          subject: '[TEST] Your free period ends in 3 days.',
          html: `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Your free period ends in 3 days</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Billing Update</p>
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">
          Your free period ends<br>in 3 days, ${DUMMY.firstName}.
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.75;">
          Your first $2,000 retainer is scheduled for <strong style="color:#1A1715;">${DUMMY.chargeDate}</strong>. Your card on file will be charged automatically &mdash; no action needed on your end.
        </p>
        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Charge summary</p>
          <p style="margin:0 0 6px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Amount:</span>&nbsp; $2,000</p>
          <p style="margin:0 0 6px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Date:</span>&nbsp; ${DUMMY.chargeDate}</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">After that:</span>&nbsp; $2,000 every 30 days</p>
        </div>
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">Questions? Reply to this email or reach us at <a href="mailto:ryan@zionshift.com" style="color:#C8C4BC;">ryan@zionshift.com</a></p>
      </div>
    </div>
  </body>
</html>`,
        });
        break;
      }

      // ── 2. Campaign live (client) ──────────────────────────────────
      case 'campaign-live': {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      DUMMY.email,
          replyTo: 'ryan@zionshift.com',
          subject: `[TEST] Great news, ${DUMMY.firstName} — your campaign is officially live 🚀`,
          html: `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Your Campaign is Live</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Campaign Update</p>
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">Your campaign is live, ${DUMMY.firstName}.</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.75;">
          Your 14-day warm-up period is complete. We&apos;ve finished building your email reputation and your outreach campaign is now officially active &mdash; meaning we&apos;re starting to put <strong style="color:#1A1715;">${DUMMY.firm}</strong> in front of your ideal prospects today.
        </p>
        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">What happens next</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">1 &nbsp;&mdash;</span>&nbsp; Personalized outreach emails go out to qualified prospects on your behalf</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">2 &nbsp;&mdash;</span>&nbsp; Replies and interest get routed directly to you</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">3 &nbsp;&mdash;</span>&nbsp; Meetings start booking &mdash; track them live in your dashboard</p>
        </div>
        <a href="https://zionshift.com/client" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">View My Dashboard &rarr;</a>
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">Questions? Reply to this email or reach us at <a href="mailto:ryan@zionshift.com" style="color:#C8C4BC;">ryan@zionshift.com</a></p>
      </div>
    </div>
  </body>
</html>`,
        });
        break;
      }

      // ── 3. Payment failed — client ─────────────────────────────────
      case 'payment-failed-client': {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      DUMMY.email,
          replyTo: 'ryan@zionshift.com',
          subject: '[TEST] Action needed — payment issue with your ZionShift account.',
          html: `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Payment Issue</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Action Required</p>
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">
          There was an issue with your payment, ${DUMMY.firstName}.
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.75;">
          We weren&apos;t able to process your <strong style="color:#1A1715;">${DUMMY.amount}</strong> retainer payment on <strong style="color:#1A1715;">${DUMMY.date}</strong>. Don&apos;t worry &mdash; this happens sometimes and it&apos;s easy to fix.
        </p>
        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">What to do</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">1 &nbsp;&mdash;</span>&nbsp; Click the button below to update your payment method</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">2 &nbsp;&mdash;</span>&nbsp; Your payment will retry automatically once updated</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">3 &nbsp;&mdash;</span>&nbsp; Your campaign continues without interruption</p>
        </div>
        <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">Please resolve this within 3 days to avoid any interruption to your campaign.</p>
        <a href="${DUMMY.portalUrl}" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">Update Payment Method &rarr;</a>
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">Questions? Reply to this email or reach us at <a href="mailto:ryan@zionshift.com" style="color:#C8C4BC;">ryan@zionshift.com</a></p>
      </div>
    </div>
  </body>
</html>`,
        });
        break;
      }

      // ── 4. Payment failed — admin ──────────────────────────────────
      case 'payment-failed-admin': {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      DUMMY.email,
          replyTo: 'ryan@zionshift.com',
          subject: `[TEST] ⚠️ Payment failed — ${DUMMY.fullName}`,
          html: `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Payment Failed</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Billing Alert</p>
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">⚠️ Payment failed.</h1>
        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Client Details</p>
          <p style="margin:0 0 6px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Client:</span>&nbsp; ${DUMMY.fullName}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Email:</span>&nbsp; ${DUMMY.email}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Amount:</span>&nbsp; ${DUMMY.amount}</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Date:</span>&nbsp; ${DUMMY.date}</p>
        </div>
        <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">Their account has been flagged as past due. If they don&apos;t resolve payment within <strong style="color:#1A1715;">3 days</strong>, their campaign may be paused. Keep an eye on your admin dashboard.</p>
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">ZionShift &middot; Automated billing notification</p>
      </div>
    </div>
  </body>
</html>`,
        });
        break;
      }

      // ── 5. Payment resolved — admin ────────────────────────────────
      case 'payment-resolved': {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      DUMMY.email,
          replyTo: 'ryan@zionshift.com',
          subject: `[TEST] ✅ Payment resolved — ${DUMMY.fullName} is back on track`,
          html: `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Payment Resolved</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Billing Update</p>
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">✅ Payment resolved.</h1>
        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Client Details</p>
          <p style="margin:0 0 6px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Client:</span>&nbsp; ${DUMMY.fullName}</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">Email:</span>&nbsp; ${DUMMY.email}</p>
        </div>
        <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">Their $2,000 retainer has been successfully paid and their account is back in good standing. If their campaign was paused, go into Smartlead and turn it back on now.</p>
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">ZionShift &middot; Automated billing notification</p>
      </div>
    </div>
  </body>
</html>`,
        });
        break;
      }

      // ── 6. Campaign paused — admin ─────────────────────────────────
      case 'campaign-paused': {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      DUMMY.email,
          replyTo: 'ryan@zionshift.com',
          subject: `[TEST] Action Required — ${DUMMY.fullName}'s campaign has been paused`,
          html: `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Campaign Paused</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Action Required</p>
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">${DUMMY.fullName}&apos;s campaign has been paused.</h1>
        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Next Step</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;">Go into Smartlead and pause <strong style="color:#1A1715;">${DUMMY.fullName}</strong>&apos;s active sequence so emails stop immediately.</p>
        </div>
        <a href="https://app.smartlead.ai" target="_blank" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">Open Smartlead &rarr;</a>
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">ZionShift &middot; Automated campaign notification</p>
      </div>
    </div>
  </body>
</html>`,
        });
        break;
      }

    }

    return NextResponse.json({ success: true, sent: type });

  } catch (err) {
    console.error('[test-email] Error:', err);
    return NextResponse.json({ error: 'Failed to send test email.' }, { status: 500 });
  }
}
