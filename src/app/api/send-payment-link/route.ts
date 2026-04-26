import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 }
      );
    }

    // ── 1. Create a dynamic Stripe Checkout Session ─────────────────
    let checkoutUrl: string;
    try {
      const session = await stripeClient().checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            price: process.env.STRIPE_SETUP_FEE_PRICE_ID!,
            quantity: 1,
          },
        ],
        consent_collection: {
          terms_of_service: 'required',
        },
        custom_text: {
          terms_of_service_acceptance: {
            message: 'I have read and agree to the [Terms of Service](https://www.zionshift.com/terms) and [Privacy Policy](https://www.zionshift.com/privacy).',
          },
        },
        payment_intent_data: {
          metadata: { name, email },
        },
        metadata: { name, email },
        success_url: 'https://www.zionshift.com/thank-you',
        cancel_url:  'https://www.zionshift.com',
      });

      if (!session.url) {
        throw new Error('Stripe returned no checkout URL.');
      }
      checkoutUrl = session.url;
    } catch (err) {
      console.error('[send-payment-link] Stripe session error:', err);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // ── 2. Send branded email with the unique checkout URL ──────────
    const { error: emailError } = await resendClient().emails.send({
      from:    'ZionShift <hello@zionshift.com>',
      to:      email,
      replyTo: 'ryan@zionshift.com',
      subject: 'Your ZionShift Setup \u2014 Complete Your Payment',
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your ZionShift Setup</title>
  </head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Logo bar -->
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>

      <!-- Body -->
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">New Client Setup</p>
        <h1 style="margin:0 0 16px;font-size:30px;font-weight:800;color:#1A1715;letter-spacing:-0.03em;line-height:1.15;">
          Welcome,<br>${name}.
        </h1>

        <a href="${checkoutUrl}"
           target="_blank"
           style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
          Complete Setup &rarr;
        </a>

        <p style="margin:32px 0 0;font-size:13px;color:#9CA3AF;line-height:1.7;">
          Once payment is complete, you&apos;ll receive a separate email with a link to set up your ZionShift account. The whole process takes less than 5 minutes.
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
      console.error('[send-payment-link] Resend error:', emailError);
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
