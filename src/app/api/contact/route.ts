import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

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

    /* ── 2a. Send personalized reply to the lead ── */
    const email1Result = await resend.emails.send({
      from: 'Ryan from ZionShift <ryan@zionshift.com>',
      to: email,
      replyTo: 'ryan@zionshift.com',
      subject: `Thanks for reaching out, ${name} — ZionShift`,
      text: aiText,
    });

    /* ── 2b. Send internal notification to Ryan ── */
    const notificationBody = [
      `New lead from the ZionShift website:`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Business: ${business || '(not provided)'}`,
      `Challenge: ${challenge || '(not provided)'}`,
      ``,
      `---`,
      `AI Response Sent:`,
      ``,
      aiText,
    ].join('\n');

    const email2Result = await resend.emails.send({
      from: 'ZionShift Form <ryan@zionshift.com>',
      to: 'zionshiftai@gmail.com',
      subject: `New Lead: ${name}${business ? ` from ${business}` : ''}`,
      text: notificationBody,
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
