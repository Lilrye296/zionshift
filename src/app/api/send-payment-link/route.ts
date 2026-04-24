import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const STRIPE_PAYMENT_LINK = 'STRIPE_LINK_HERE';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: 'ZionShift <hello@zionshift.com>',
      to: email,
      replyTo: 'ryan@zionshift.com',
      subject: 'Your ZionShift Setup — Complete Your Payment',
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your ZionShift Setup</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F0EDE8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0EDE8;padding:48px 16px;">
      <tr>
        <td align="center">

          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">

            <!-- Logo bar -->
            <tr>
              <td style="padding:32px 40px 0;text-align:left;">
                <img
                  src="https://zionshift.com/logo.png"
                  alt="ZionShift"
                  width="140"
                  style="display:block;height:auto;border:0;"
                />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 40px 40px;">

                <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1715;line-height:1.3;">
                  Welcome, ${name}.
                </p>

                <p style="margin:0 0 28px;font-size:15px;color:#555551;line-height:1.6;">
                  ZionShift gets qualified bookkeeping clients onto your calendar on autopilot — so you can focus on the work, not the chase.
                </p>

                <!-- CTA button -->
                <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="background-color:#1A1715;border-radius:8px;">
                      <a
                        href="${STRIPE_PAYMENT_LINK}"
                        target="_blank"
                        style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;"
                      >
                        Complete Setup — $1,000 →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:13px;color:#888884;line-height:1.6;">
                  Once payment is complete, you'll receive a separate email with a link to set up your ZionShift account. The whole process takes less than 5 minutes.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #F0EDE8;">
                <p style="margin:0;font-size:12px;color:#AAAAAA;">
                  © ${new Date().getFullYear()} ZionShift. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
          <!-- /Card -->

        </td>
      </tr>
    </table>
  </body>
</html>
      `.trim(),
    });

    if (error) {
      console.error('[send-payment-link] Resend error:', error);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-payment-link] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
