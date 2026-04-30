import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { REPLY_HANDLER_PROMPT } from '@/prompts/reply_handler_v1';

/**
 * POST /api/handle-reply
 *
 * Smartlead fires this webhook when a prospect replies to an outbound email.
 * We process the reply inline — fetch the conversation, call Claude, route
 * the result, and send the reply back through Smartlead. No queue, no cron.
 *
 * Smartlead webhook URL to configure:
 *   https://yourdomain.com/api/handle-reply?secret=YOUR_SMARTLEAD_WEBHOOK_SECRET
 * Event type: LEAD_REPLIED
 */

const SMARTLEAD_BASE = 'https://server.smartlead.ai/api/v1';
const ESCALATION_TO  = 'ryan@zionshift.com';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sanitizeBody(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function internalEmailShell(title: string, label: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>${title}</title></head>
  <body style="margin:0;padding:48px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="background:#ffffff;padding:24px 36px;border-bottom:1px solid #F0EDE8;">
        <img src="https://www.zionshift.com/logo.png" alt="ZionShift" width="140" style="display:block;" />
      </div>
      <div style="padding:44px 36px 36px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">${label}</p>
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#1A1715;letter-spacing:-0.04em;line-height:1.2;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 36px 28px;border-top:1px solid #F0EDE8;">
        <p style="margin:0;font-size:12px;color:#C8C4BC;">Internal alert — only you receive this. <a href="mailto:ryan@zionshift.com" style="color:#C8C4BC;">ryan@zionshift.com</a></p>
      </div>
    </div>
  </body>
</html>`.trim();
}

function infoRow(label: string, value: string): string {
  return `
    <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #F0EDE8;">
      <span style="font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;min-width:100px;padding-top:2px;">${label}</span>
      <span style="font-size:14px;color:#1A1715;line-height:1.6;">${value}</span>
    </div>`;
}

async function sendAlert(subject: string, title: string, label: string, bodyHtml: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    'ZionShift <hello@zionshift.com>',
      replyTo: ESCALATION_TO,
      to:      ESCALATION_TO,
      subject,
      html: internalEmailShell(title, label, bodyHtml),
    });
  } catch (err) {
    console.error('[handle-reply] Alert email failed:', err);
  }
}

async function fetchConversationHistory(
  campaignId: string,
  leadId: string,
  leadEmail: string
): Promise<string> {
  try {
    const apiKey = process.env.SMARTLEAD_API_KEY!;
    const url = `${SMARTLEAD_BASE}/campaigns/${campaignId}/leads/${leadId}/message-history?api_key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[handle-reply] Smartlead history ${res.status} for ${leadEmail}`);
      return '';
    }
    const history = await res.json();
    const rawMessages: unknown[] = Array.isArray(history)
      ? history
      : (history?.data ?? history?.messages ?? []);
    if (!rawMessages.length) return '';
    return rawMessages.map((m: unknown) => {
      const msg = m as Record<string, unknown>;
      const rawType = String(msg.type ?? '').toUpperCase();
      const isOutbound = rawType === 'SENT' || rawType === 'EMAIL_SENT' || rawType === 'OUTBOUND';
      const body = sanitizeBody(String(msg.email_body ?? msg.body ?? msg.content ?? msg.message ?? ''));
      return `${isOutbound ? 'Us' : 'Prospect'}: ${body}`;
    }).join('\n\n---\n\n');
  } catch (err) {
    console.error('[handle-reply] fetchConversationHistory error:', err);
    return '';
  }
}

async function sendSmartleadReply(
  campaignId: string,
  leadId: string,
  replyText: string
): Promise<boolean> {
  try {
    const apiKey = process.env.SMARTLEAD_API_KEY!;
    const url = `${SMARTLEAD_BASE}/campaigns/${campaignId}/leads/${leadId}/reply-email-thread?api_key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_body: replyText }),
    });
    if (!res.ok) {
      console.error(`[handle-reply] Smartlead reply failed ${res.status}:`, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[handle-reply] sendSmartleadReply error:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify webhook secret ──────────────────────────────────
    const expectedSecret = process.env.SMARTLEAD_WEBHOOK_SECRET;
    if (expectedSecret) {
      const received =
        req.nextUrl.searchParams.get('secret') ??
        req.headers.get('x-smartlead-secret') ??
        req.headers.get('x-webhook-secret');
      if (received !== expectedSecret) {
        console.warn('[handle-reply] Rejected — invalid secret');
        return NextResponse.json({ received: true });
      }
    }

    const payload = await req.json();

    // ── 2. Filter to inbound events only ─────────────────────────
    const eventType = String(
      payload.event_type ?? payload.eventType ?? payload.type ?? ''
    ).toUpperCase();

    const isInbound =
      eventType.includes('LEAD_REPL') ||
      eventType.includes('REPLY_RECEIVED') ||
      eventType === 'EMAIL_REPLIED' ||
      eventType === 'INBOUND';

    if (!isInbound) return NextResponse.json({ received: true });

    // ── 3. Extract fields ─────────────────────────────────────────
    const campaignId = String(payload.campaign_id ?? payload.campaignId ?? payload.campaign?.id ?? '');
    const leadId     = String(payload.lead_id ?? payload.leadId ?? payload.lead?.id ?? '') || null;
    const leadEmail  = String(payload.lead_email ?? payload.leadEmail ?? payload.from_email ?? payload.email ?? '');
    const leadName   = String(payload.lead_name ?? payload.leadName ?? payload.lead?.name ?? payload.name ?? '') || null;
    const leadCompany = String(payload.lead_company ?? payload.leadCompany ?? payload.company_name ?? payload.lead?.company ?? '') || null;
    const inboundMessage = String(payload.email_body ?? payload.emailBody ?? payload.body ?? payload.message ?? payload.content ?? '');

    console.log('[handle-reply] Inbound reply:', { eventType, campaignId, leadEmail, leadId, msgPreview: inboundMessage.slice(0, 120) });

    if (!campaignId || !leadEmail || !inboundMessage) {
      console.warn('[handle-reply] Missing required fields — skipping');
      return NextResponse.json({ received: true });
    }

    const supabase = supabaseAdmin();

    // ── 4. Check suppressed contacts ──────────────────────────────
    const { data: suppressed } = await supabase
      .from('suppressed_contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('lead_email', leadEmail)
      .maybeSingle();

    if (suppressed?.id) {
      console.log(`[handle-reply] Suppressed — skipping: ${leadEmail}`);
      return NextResponse.json({ received: true });
    }

    // ── 5. Look up client — no silent defaults ────────────────────
    const { data: clientConfig } = await supabase
      .from('clients')
      .select('ai_reply_prompt, booking_link')
      .eq('smartlead_campaign_id', campaignId)
      .maybeSingle();

    if (!clientConfig) {
      console.error(`[handle-reply] No client for campaign ID: ${campaignId}`);
      await sendAlert(
        'Action Required — Unmatched Campaign ID',
        'Unmatched Campaign ID',
        'System Alert',
        `<p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.75;">A prospect replied but the campaign ID doesn&apos;t match any client row in Supabase. No reply was sent.</p>
         <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
           ${infoRow('Campaign ID', campaignId)}
           ${infoRow('Lead Email', leadEmail)}
         </div>
         <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">Their Message</p>
         <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${inboundMessage.slice(0, 500)}</div>
         <a href="https://supabase.com" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;">Open Supabase &rarr;</a>`
      );
      return NextResponse.json({ received: true });
    }

    if (!clientConfig.booking_link) {
      console.error(`[handle-reply] No booking_link for campaign ID: ${campaignId}`);
      await sendAlert(
        'Action Required — Missing Booking Link',
        'Missing Booking Link',
        'System Alert',
        `<p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.75;">A prospect replied but this client has no booking link set. No reply was sent. Add the booking link in your admin dashboard.</p>
         <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
           ${infoRow('Campaign ID', campaignId)}
           ${infoRow('Lead Email', leadEmail)}
         </div>
         <a href="https://zionshift.com/admin" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;">Open Admin &rarr;</a>`
      );
      return NextResponse.json({ received: true });
    }

    // ── 6. Fetch full conversation from Smartlead ─────────────────
    let conversationText = '';
    if (leadId && campaignId) {
      conversationText = await fetchConversationHistory(campaignId, leadId, leadEmail);
    }
    if (!conversationText) {
      conversationText = `Prospect: ${sanitizeBody(inboundMessage)}`;
    }

    // ── 7. Build Claude prompt ────────────────────────────────────
    const basePrompt   = clientConfig.ai_reply_prompt ?? REPLY_HANDLER_PROMPT;
    const systemPrompt = basePrompt.replace(/\[BOOKING_LINK\]/g, clientConfig.booking_link);

    // ── 8. Call Claude Sonnet ─────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const claudeMessage = await anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 500,
      system:     systemPrompt,
      messages: [{
        role:    'user',
        content: `Here is the full email conversation:\n\n${conversationText}\n\nWrite your reply now.`,
      }],
    });

    const claudeText = claudeMessage.content[0].type === 'text' ? claudeMessage.content[0].text : '';

    // ── 9. Parse route tag ────────────────────────────────────────
    const tagMatch = claudeText.match(/ROUTE_TAG:\s*(AUTO_SUPPRESS|CONTINUE|ESCALATE_TO_DASHBOARD)/i);
    const routeTag  = (tagMatch?.[1] ?? 'CONTINUE').toUpperCase();
    const replyText = claudeText.replace(/\nROUTE_TAG:.*$/im, '').replace(/ROUTE_TAG:.*$/im, '').trim();

    console.log(`[handle-reply] ${leadEmail} → ${routeTag} | reply: ${replyText.slice(0, 80)}...`);

    // ── 10. Route ─────────────────────────────────────────────────
    if (routeTag === 'AUTO_SUPPRESS') {
      await supabase
        .from('suppressed_contacts')
        .upsert({ campaign_id: campaignId, lead_email: leadEmail, reason: 'auto_suppress_by_ai' },
          { onConflict: 'campaign_id,lead_email' });
      console.log(`[handle-reply] Auto-suppressed: ${leadEmail}`);

    } else if (routeTag === 'ESCALATE_TO_DASHBOARD') {
      await supabase
        .from('hot_leads')
        .update({ ai_escalated: true })
        .eq('campaign_id', campaignId)
        .eq('lead_email', leadEmail);

      await sendAlert(
        'Action Required — Lead Needs Your Attention',
        'Lead Needs Your Attention',
        'AI Escalation',
        `<div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
           ${infoRow('Lead', `${leadName ?? ''} &lt;${leadEmail}&gt;`)}
           ${infoRow('Company', leadCompany ?? 'Unknown')}
           ${infoRow('Campaign', campaignId)}
         </div>
         <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">Their Message</p>
         <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${inboundMessage.slice(0, 800)}</div>
         <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">AI Draft — Not Sent</p>
         <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${replyText}</div>
         <a href="https://zionshift.com/client" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;">View Dashboard &rarr;</a>`
      );

    } else {
      // CONTINUE — send reply
      if (leadId) {
        const sent = await sendSmartleadReply(campaignId, leadId, replyText);
        if (!sent) {
          await sendAlert(
            'Action Required — Reply Failed to Send',
            'Reply Failed to Send',
            'System Alert',
            `<p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.75;">Claude wrote a reply but Smartlead failed to send it. Reply manually.</p>
             <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
               ${infoRow('Lead', leadEmail)}
               ${infoRow('Campaign', campaignId)}
             </div>
             <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">AI Draft</p>
             <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${replyText}</div>`
          );
        }
      } else {
        await sendAlert(
          'Action Required — Missing Lead ID',
          'Missing Lead ID',
          'System Alert',
          `<p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.75;">Claude wrote a reply but there&apos;s no lead ID to send it through Smartlead. Reply manually.</p>
           <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
             ${infoRow('Lead', leadEmail)}
             ${infoRow('Campaign', campaignId)}
           </div>
           <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">AI Draft</p>
           <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${replyText}</div>`
        );
      }
    }

    // ── 11. Log to reply_logs ─────────────────────────────────────
    await supabase.from('reply_logs').insert({
      campaign_id:     campaignId,
      lead_email:      leadEmail,
      lead_id:         leadId ?? null,
      route_tag:       routeTag,
      reply_sent:      routeTag === 'CONTINUE' ? replyText : null,
      claude_response: claudeText,
    });

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('[handle-reply] Unexpected error:', err);
    return NextResponse.json({ received: true });
  }
}
