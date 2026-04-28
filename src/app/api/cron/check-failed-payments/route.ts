import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function GET(req: NextRequest) {
  // ── Verify Vercel cron secret ──────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const stripe   = stripeClient();
  const resend   = resendClient();
  const now      = new Date();

  // ── Find all clients past_due for more than 3 days ─────────────
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: overdueClients, error: fetchErr } = await supabase
    .from('clients')
    .select('id, name, email, stripe_customer_id')
    .eq('billing_status', 'past_due')
    .lt('failed_payment_at', threeDaysAgo);

  if (fetchErr) {
    console.error('[check-failed-payments] Fetch error:', fetchErr);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }

  if (!overdueClients || overdueClients.length === 0) {
    console.log('[check-failed-payments] No overdue clients found.');
    return NextResponse.json({ paused: 0 });
  }

  let pausedCount = 0;

  for (const client of overdueClients) {
    try {
      // ── Pause campaign + mark billing paused ───────────────────
      await supabase
        .from('clients')
        .update({
          campaign_status: 'paused',
          billing_status:  'paused',
        })
        .eq('id', client.id);

      // ── Generate billing portal URL for client email ───────────
      let portalUrl = 'https://www.zionshift.com/client';
      if (client.stripe_customer_id) {
        try {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer:   client.stripe_customer_id,
            return_url: 'https://www.zionshift.com/client',
          });
          portalUrl = portalSession.url;
        } catch (portalErr) {
          console.error('[check-failed-payments] Portal session error for', client.email, portalErr);
        }
      }

      const firstName   = getFirstName(client.name ?? '');
      const pausedDate  = fmtDate(now);

      // ── Email Ryan ─────────────────────────────────────────────
      try {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      'ryan@zionshift.com',
          replyTo: 'ryan@zionshift.com',
          subject: `🔴 Campaign auto-paused — ${client.name} — payment unresolved after 3 days`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Campaign Auto-Paused</title></head>
<body style="margin:0;padding:40px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:#1A1715;padding:28px 36px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);">ZionShift — Billing Alert</p>
      <h1 style="margin:10px 0 0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.03em;">🔴 Campaign auto-paused.</h1>
    </div>
    <div style="padding:32px 36px;">
      <div style="background:#FFF5F5;border:1px solid #FECACA;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;width:40%;">Client</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${client.name}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Email</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${client.email}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Paused On</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${pausedDate}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Reason</td><td style="padding:4px 0;font-size:14px;color:#DC2626;">Payment unresolved after 3 days</td></tr>
        </table>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
        Their campaign has been automatically paused. Go into <strong>Smartlead</strong> and pause their campaign there as well. Once they update their payment method and Stripe processes successfully, their account will flip back to active — resume their campaign at that point.
      </p>
    </div>
    <div style="padding:16px 36px 24px;border-top:1px solid #F0EDE8;">
      <p style="margin:0;font-size:12px;color:#C8C4BC;">ZionShift · Automated billing notification</p>
    </div>
  </div>
</body>
</html>
          `.trim(),
        });
      } catch (emailErr) {
        console.error('[check-failed-payments] Ryan email error for', client.email, emailErr);
      }

      // ── Email client ───────────────────────────────────────────
      try {
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          to:      client.email,
          replyTo: 'ryan@zionshift.com',
          subject: 'Your ZionShift campaign has been paused.',
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Campaign Paused</title></head>
<body style="margin:0;padding:40px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:#1A1715;padding:28px 36px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);">ZionShift</p>
      <h1 style="margin:10px 0 0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.03em;">Your campaign has been paused, ${firstName}.</h1>
    </div>
    <div style="padding:32px 36px;">
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
        We weren't able to process your payment, and after 3 days without resolution, your campaign has been automatically paused. We hate to do this — but we can't keep sending on your behalf without an active payment method on file.
      </p>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#374151;">
        The good news: it takes less than 2 minutes to fix. Update your payment method below and your campaign will be back up and running the same day.
      </p>
      <a href="${portalUrl}" style="display:inline-block;background:#1A1715;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;padding:13px 24px;letter-spacing:-0.01em;">
        Update Payment Method →
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#9CA3AF;">
        Questions or need help? Just reply to this email and we'll sort it out right away.
      </p>
    </div>
    <div style="padding:16px 36px 24px;border-top:1px solid #F0EDE8;">
      <p style="margin:0;font-size:12px;color:#C8C4BC;">ZionShift · Questions? Reply to this email and we'll get right back to you.</p>
    </div>
  </div>
</body>
</html>
          `.trim(),
        });
      } catch (emailErr) {
        console.error('[check-failed-payments] Client email error for', client.email, emailErr);
      }

      pausedCount++;
      console.log(`[check-failed-payments] Auto-paused: ${client.name} (${client.email})`);

    } catch (clientErr) {
      console.error('[check-failed-payments] Error processing client', client.id, clientErr);
    }
  }

  return NextResponse.json({ paused: pausedCount });
}
