import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // ── 1. Fetch client row ────────────────────────────────────────
    const { data: client, error: fetchErr } = await supabase
      .from('clients')
      .select('id, name, email, firm, campaign_status')
      .eq('id', clientId)
      .single();

    if (fetchErr || !client) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    // ── 2. Guard — only proceed if still warming ───────────────────
    if (client.campaign_status !== 'warming') {
      return NextResponse.json({ alreadyActive: true });
    }

    // ── 3. Flip campaign_status to active in DB ────────────────────
    await supabase
      .from('clients')
      .update({ campaign_status: 'active' })
      .eq('id', clientId);

    // ── 4. Send activation email to client ────────────────────────
    const firstName = client.name?.split(' ')[0] ?? 'there';

    try {
      await resendClient().emails.send({
        from: 'ZionShift <hello@zionshift.com>',
        to: client.email,
        replyTo: 'ryan@zionshift.com',
        subject: `Great news, ${firstName} — your campaign is officially live 🚀`,
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
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">
          Your campaign is live, ${firstName}.
        </h1>

        <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.75;">
          Your 14-day warm-up period is complete. We&apos;ve finished building your email reputation and your outreach campaign is now officially active &mdash; meaning we&apos;re starting to put <strong style="color:#1A1715;">${client.firm}</strong> in front of your ideal prospects today.
        </p>

        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">What happens next</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">1 &nbsp;&mdash;</span>&nbsp; Personalized outreach emails go out to qualified prospects on your behalf</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">2 &nbsp;&mdash;</span>&nbsp; Replies and interest get routed directly to you</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;"><span style="font-weight:700;color:#1A1715;">3 &nbsp;&mdash;</span>&nbsp; Meetings start booking &mdash; track them live in your dashboard</p>
        </div>

        <a href="https://zionshift.com/client" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
          View My Dashboard &rarr;
        </a>

      </div>

      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">Questions? Reply to this email or reach us at <a href="mailto:ryan@zionshift.com" style="color:#C8C4BC;">ryan@zionshift.com</a></p>
      </div>

    </div>
  </body>
</html>
        `.trim(),
      });
    } catch (emailErr) {
      console.error('[activate-campaign] Email send failed:', emailErr);
      // Don't fail the whole request — DB is already updated
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[activate-campaign] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
