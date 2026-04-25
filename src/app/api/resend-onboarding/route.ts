import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // ── 1. Look up client name + email ──────────────────────────────
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email, status')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('[resend-onboarding] Client not found:', clientId);
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    if (!client.email) {
      console.error('[resend-onboarding] Client has no email:', clientId);
      return NextResponse.json({ error: 'Client has no email on record.' }, { status: 400 });
    }

    if (client.status !== 'pending') {
      return NextResponse.json({ error: 'Client has already completed onboarding.' }, { status: 400 });
    }

    // ── 2. Generate fresh token ─────────────────────────────────────
    const token     = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from('onboarding_tokens')
      .insert({
        token,
        email: client.email,
        expires_at: expiresAt,
        used: false,
      });

    if (tokenError) {
      console.error('[resend-onboarding] Token insert error:', tokenError);
      return NextResponse.json({ error: 'Database error.' }, { status: 500 });
    }

    // ── 3. Send welcome email with fresh link ───────────────────────
    const firstName  = getFirstName(client.name);
    const onboardUrl = `https://www.zionshift.com/onboard?token=${token}`;

    const { error: emailError } = await resendClient().emails.send({
      from:    'ZionShift <hello@zionshift.com>',
      to:      client.email,
      replyTo: 'ryan@zionshift.com',
      subject: 'Your ZionShift Account Setup Link',
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your ZionShift Setup Link</title>
  </head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Logo bar -->
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>

      <!-- Body -->
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Account Setup</p>
        <h1 style="margin:0 0 16px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.03em;line-height:1.15;">
          Here&apos;s your<br>new link, ${firstName}.
        </h1>
        <p style="margin:0 0 32px;font-size:15px;color:#6B7280;line-height:1.7;">
          We&apos;ve generated a fresh setup link for you. Click below to complete your account setup and get access to your ZionShift dashboard.
        </p>

        <a href="${onboardUrl}"
           target="_blank"
           style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
          Set Up My Account &rarr;
        </a>

        <p style="margin:32px 0 0;font-size:13px;color:#9CA3AF;line-height:1.7;">
          This link expires in 48 hours. If you need another one, reply to this email.
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
      console.error('[resend-onboarding] Resend error:', emailError);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[resend-onboarding] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
