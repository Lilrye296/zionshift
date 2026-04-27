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
<body style="margin:0;padding:40px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

    <div style="background:#1A1715;padding:28px 36px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);">ZionShift</p>
      <h1 style="margin:10px 0 0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.03em;">Your campaign is live, ${firstName}.</h1>
    </div>

    <div style="padding:32px 36px;">
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
        Your 14-day warm-up period is complete. We've finished building your email reputation and your outreach campaign is now officially active — meaning we're starting to put <strong>${client.firm}</strong> in front of your ideal prospects today.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
        Here's what happens from here:
      </p>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.8;color:#374151;">
        <li>Personalized outreach emails go out to qualified prospects on your behalf</li>
        <li>Replies and interest get routed directly to you</li>
        <li>Meetings start booking — you'll see them appear in your dashboard</li>
      </ul>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#374151;">
        You can track everything in real time from your client portal.
      </p>

      <a href="https://zionshift.com/client" style="display:inline-block;background:#1A1715;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;padding:13px 24px;letter-spacing:-0.01em;">
        View My Dashboard →
      </a>
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
      console.error('[activate-campaign] Email send failed:', emailErr);
      // Don't fail the whole request — DB is already updated
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[activate-campaign] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
