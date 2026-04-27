import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const { clientName, action } = await req.json();

    const isPause  = action === 'paused';
    const subject  = isPause
      ? `Action Required — ${clientName}'s campaign has been paused`
      : `Action Required — ${clientName} has been cancelled`;

    const bodyLine = isPause
      ? `You just paused <strong>${clientName}</strong>'s campaign in ZionShift. Go into Smartlead and pause their active sequence so emails stop immediately.`
      : `You just marked <strong>${clientName}</strong> as cancelled in ZionShift. Go into Smartlead and stop their campaign permanently.`;

    await resendClient().emails.send({
      from:    'ZionShift <hello@zionshift.com>',
      to:      'ryan@zionshift.com',
      subject,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:40px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:#1A1715;padding:20px 32px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.5);">ZionShift — Action Required</p>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1A1715;letter-spacing:-0.03em;">${subject}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.7;">${bodyLine}</p>
      <a href="https://app.smartlead.ai" target="_blank"
         style="display:inline-block;background:#1A1715;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:8px;">
        Open Smartlead →
      </a>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notify-status-change] Error:', err);
    return NextResponse.json({ error: 'Failed to send notification.' }, { status: 500 });
  }
}
