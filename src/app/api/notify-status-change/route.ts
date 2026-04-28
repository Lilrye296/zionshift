import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const { clientName, action } = await req.json();

    const subject  = `Action Required — ${clientName}'s campaign has been paused`;
    const bodyLine = `You just paused <strong>${clientName}</strong>'s campaign in ZionShift. Go into Smartlead and pause their active sequence so emails stop immediately.`;

    await resendClient().emails.send({
      from:    'ZionShift <hello@zionshift.com>',
      to:      'ryan@zionshift.com',
      subject,
      html: `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>${subject}</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Action Required</p>
        <h1 style="margin:0 0 20px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.1;">${subject}</h1>
        <div style="padding:20px 24px;background:#FAFAF9;border-radius:10px;border:1px solid #EEEBE6;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Next Step</p>
          <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6;">${bodyLine}</p>
        </div>
        <a href="https://app.smartlead.ai" target="_blank" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">Open Smartlead &rarr;</a>
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">ZionShift &middot; Automated campaign notification</p>
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
