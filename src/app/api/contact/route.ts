import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

const signature = `
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e0d9d0;">
    <p style="margin:0;font-size:15px;font-weight:700;color:#1A1715;">Ryan Flores</p>
    <p style="margin:4px 0 16px;font-size:14px;color:#8B7D6B;">Founder, ZionShift</p>
    <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="120" style="display:block;margin-bottom:10px;" />
    <a href="https://www.zionshift.com" style="font-size:13px;color:#8B7D6B;text-decoration:none;">www.zionshift.com</a>
  </div>
`;

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#1A1715;font-size:15px;line-height:1.7;">
    ${body}
    ${signature}
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, phone, business, challenge } = await req.json();

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required.' },
        { status: 400 }
      );
    }

    /* ── 1. Generate personalized AI response ── */
    const userMessage = [
      `Name: ${name}`,
      business ? `Business: ${business}` : null,
      challenge ? `Their biggest challenge: ${challenge}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system:
        "You are Ryan from ZionShift. Someone just filled out a form on your website interested in your AI outbound system that books qualified meetings for service businesses. Write a short, warm, personalized 3-4 sentence email response. Mention their business name if provided, reference their specific challenge, and let them know you will follow up personally within a few hours to schedule a call. Keep it conversational and professional. Do not use any markdown formatting. Sign off as Ryan from ZionShift.",
      messages: [{ role: 'user', content: userMessage }],
    });

    const aiText =
      aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';

    // Convert newlines to <br> for HTML rendering
    const aiHtml = aiText
      .split('\n')
      .map((line) => line.trim() === '' ? '<br>' : `<p style="margin:0 0 12px;">${line}</p>`)
      .join('');

    /* ── 2a. Prospect email (HTML) ── */
    const email1Result = await resend.emails.send({
      from: 'Ryan from ZionShift <ryan@zionshift.com>',
      to: email,
      replyTo: 'ryan@zionshift.com',
      subject: `Thanks for reaching out, ${name} — ZionShift`,
      html: wrapHtml(aiHtml),
    });

    /* ── 2b. Internal notification email (HTML) ── */
    const notificationHtml = `
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:700;">New Lead from ZionShift</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#8B7D6B;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#8B7D6B;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#C75B2A;">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#8B7D6B;">Phone</td><td style="padding:8px 0;">${phone}</td></tr>
        <tr><td style="padding:8px 0;color:#8B7D6B;">Business</td><td style="padding:8px 0;">${business || '<span style="color:#8B7D6B;">not provided</span>'}</td></tr>
        <tr><td style="padding:8px 0;color:#8B7D6B;vertical-align:top;">Challenge</td><td style="padding:8px 0;">${challenge || '<span style="color:#8B7D6B;">not provided</span>'}</td></tr>
      </table>
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e0d9d0;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#8B7D6B;">AI Response Sent to Prospect</p>
        <div style="background:#f9f7f4;border-left:3px solid #C75B2A;padding:16px;font-size:14px;line-height:1.7;color:#1A1715;">
          ${aiHtml}
        </div>
      </div>
    `;

    const email2Result = await resend.emails.send({
      from: 'ZionShift Form <ryan@zionshift.com>',
      to: 'zionshiftai@gmail.com',
      subject: `New Lead: ${name}${business ? ` from ${business}` : ''}`,
      html: wrapHtml(notificationHtml),
    });

    return NextResponse.json({
      success: true,
      aiResponse: 'generated',
      email1: email1Result,
      email2: email2Result,
    });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
