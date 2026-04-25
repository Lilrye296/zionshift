import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateToken(): string {
  return crypto.randomUUID();
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

export async function POST(req: NextRequest) {
  // ── 1. Verify Stripe signature ──────────────────────────────────
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[stripe-webhook] Missing signature or webhook secret.');
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripeClient().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  // ── 2. Only handle payment_intent.succeeded ─────────────────────
  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const name  = paymentIntent.metadata?.name  ?? '';
  const email = paymentIntent.metadata?.email ?? '';

  if (!email) {
    console.error('[stripe-webhook] No email in payment_intent metadata.', paymentIntent.id);
    return NextResponse.json({ error: 'No email in metadata.' }, { status: 400 });
  }

  try {
    // ── 3. Generate token + insert into onboarding_tokens ──────────
    const token     = generateToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const supabase = supabaseAdmin();
    const { error: dbError } = await supabase
      .from('onboarding_tokens')
      .insert({
        token,
        email,
        stripe_payment_id: paymentIntent.id,
        expires_at: expiresAt,
        used: false,
      });

    if (dbError) {
      console.error('[stripe-webhook] Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Database error.' }, { status: 500 });
    }

    // ── 4. Insert pending client row ───────────────────────────────
    const { error: clientError } = await supabase
      .from('clients')
      .insert({
        name,
        email,
        firm: '',
        status: 'pending',
        mrr: 0,
        setup_fee_paid: true,
        first_month_paid: false,
      });

    if (clientError) {
      console.error('[stripe-webhook] Client insert error:', clientError);
      // Non-fatal — token already saved, continue to send email.
    }

    // ── 5. Send branded welcome email ──────────────────────────────
    const firstName   = getFirstName(name);
    const onboardUrl  = `https://www.zionshift.com/onboard?token=${token}`;

    const { error: emailError } = await resendClient().emails.send({
      from:    'ZionShift <hello@zionshift.com>',
      to:      email,
      replyTo: 'ryan@zionshift.com',
      subject: 'Welcome to ZionShift \u2014 Set Up Your Account',
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to ZionShift</title>
  </head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Logo bar -->
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>

      <!-- Body -->
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">You&apos;re In</p>
        <h1 style="margin:0 0 16px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.03em;line-height:1.15;">
          Welcome,<br>${firstName}.
        </h1>
        <p style="margin:0 0 32px;font-size:15px;color:#6B7280;line-height:1.7;">
          Payment confirmed &mdash; you&apos;re officially a ZionShift client. Click below to set up your account and get access to your client dashboard.
        </p>

        <a href="${onboardUrl}"
           target="_blank"
           style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
          Set Up Your Account &rarr;
        </a>

        <p style="margin:32px 0 0;font-size:13px;color:#9CA3AF;line-height:1.7;">
          This link expires in 48 hours. If you need a new one, reply to this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">
          Questions? Reply to this email or reach us at <a href="mailto:ryan@zionshift.com" style="color:#C8C4BC;">ryan@zionshift.com</a>
        </p>
      </div>

    </div>
  </body>
</html>
      `.trim(),
    });

    if (emailError) {
      console.error('[stripe-webhook] Resend error:', emailError);
      // Token is already saved — don't return 500, log and move on.
      // The client can still be manually sent a link if needed.
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('[stripe-webhook] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
