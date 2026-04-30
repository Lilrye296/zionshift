import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { REPLY_HANDLER_PROMPT } from '@/prompts/reply_handler_v1';

/**
 * GET /api/process-reply-queue
 *
 * Called by Vercel Cron every 2 minutes.
 * Picks up pending items whose process_after time has passed,
 * calls Claude Sonnet per-client config, routes the result, and marks items done.
 *
 * Each client has their own ai_reply_prompt and booking_link stored in the
 * clients table. The default ZionShift prompt is used as fallback only.
 *
 * Vercel automatically sends Authorization: Bearer {CRON_SECRET}.
 */

const SMARTLEAD_BASE  = 'https://server.smartlead.ai/api/v1';
const ESCALATION_TO   = 'ryan@zionshift.com';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Fetch full conversation thread from Smartlead and format it as plain text.
 */
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
      console.warn(`[process-reply-queue] Smartlead history ${res.status} for ${leadEmail}`);
      return '';
    }

    const history = await res.json();
    const rawMessages: unknown[] = Array.isArray(history)
      ? history
      : (history?.data ?? history?.messages ?? []);

    if (!rawMessages.length) return '';

    return rawMessages
      .map((m: unknown) => {
        const msg = m as Record<string, unknown>;
        const rawType = String(msg.type ?? '').toUpperCase();
        const isOutbound =
          rawType === 'SENT' ||
          rawType === 'EMAIL_SENT' ||
          rawType === 'OUTBOUND';

        const body = sanitizeBody(String(
          msg.email_body ?? msg.body ?? msg.content ?? msg.message ?? ''
        ));
        const label = isOutbound ? 'Us' : 'Prospect';
        return `${label}: ${body}`;
      })
      .join('\n\n---\n\n');

  } catch (err) {
    console.error('[process-reply-queue] fetchConversationHistory error:', err);
    return '';
  }
}

/**
 * Send reply via Smartlead's reply-email-thread endpoint.
 * Returns true on success.
 *
 * NOTE: If Smartlead ever changes this endpoint, update the URL below.
 * Confirmed endpoint: POST /campaigns/{id}/leads/{leadId}/reply-email-thread
 */
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
      const errText = await res.text();
      console.error(
        `[process-reply-queue] Smartlead reply failed ${res.status}:`,
        errText.slice(0, 300)
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error('[process-reply-queue] sendSmartleadReply error:', err);
    return false;
  }
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
        <p style="margin:0;font-size:12px;color:#C8C4BC;">Internal alert — only you receive this. Questions? <a href="mailto:ryan@zionshift.com" style="color:#C8C4BC;">ryan@zionshift.com</a></p>
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

/**
 * Send escalation email to Ryan only — ZionShift branded internal alert.
 */
async function sendEscalationEmail(
  item: Record<string, unknown>,
  aiReply: string,
  reason: string
): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const bodyHtml = `
      <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        ${infoRow('Reason', reason)}
        ${infoRow('Lead', `${item.lead_name ?? ''} &lt;${item.lead_email}&gt;`)}
        ${infoRow('Company', String(item.lead_company ?? 'Unknown'))}
        ${infoRow('Campaign', String(item.campaign_id))}
      </div>

      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">Their Message</p>
      <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${String(item.inbound_message).slice(0, 800)}</div>

      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">AI Draft — Not Sent</p>
      <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${aiReply}</div>

      <a href="https://zionshift.com/client" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
        View Dashboard &rarr;
      </a>
    `;

    await resend.emails.send({
      from:    'ZionShift <hello@zionshift.com>',
      replyTo: ESCALATION_TO,
      to:      ESCALATION_TO,
      subject: `Action Required — Lead Reply Needs Attention`,
      html:    internalEmailShell('Lead Needs Your Attention', 'AI Escalation', bodyHtml),
    });
  } catch (err) {
    console.error('[process-reply-queue] sendEscalationEmail error:', err);
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Verify Vercel Cron secret ─────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[process-reply-queue] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // ── Fetch pending items ready to process ─────────────────────────────────
  const { data: items, error: fetchError } = await supabase
    .from('reply_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('process_after', new Date().toISOString())
    .order('process_after', { ascending: true })
    .limit(10); // Process max 10 per cron tick to stay within timeout

  if (fetchError) {
    console.error('[process-reply-queue] Fetch error:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  console.log(`[process-reply-queue] Processing ${items.length} queued replies`);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let processed = 0;

  for (const item of items) {
    try {
      // Mark as processing first to prevent double-processing across concurrent ticks
      const { error: lockError } = await supabase
        .from('reply_queue')
        .update({ status: 'processing' })
        .eq('id', item.id)
        .eq('status', 'pending'); // Only lock if still pending (optimistic lock)

      if (lockError) {
        console.warn(`[process-reply-queue] Could not lock item ${item.id} — skipping`);
        continue;
      }

      // ── Look up per-client prompt and booking link ──────────────────────
      const { data: clientConfig } = await supabase
        .from('clients')
        .select('ai_reply_prompt, booking_link')
        .eq('smartlead_campaign_id', item.campaign_id)
        .maybeSingle();

      // If no client row found — stop completely and alert. Never fall back to defaults.
      if (!clientConfig) {
        console.error(`[process-reply-queue] No client found for campaign ID: ${item.campaign_id} — skipping and alerting`);

        const resend = new Resend(process.env.RESEND_API_KEY);
        const unmatchedBody = `
          <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.75;">A prospect replied to a campaign but the campaign ID doesn&apos;t match any client row in Supabase. No reply was sent. Fix the campaign ID and requeue manually.</p>
          <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
            ${infoRow('Campaign ID', String(item.campaign_id))}
            ${infoRow('Lead Email', String(item.lead_email))}
          </div>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">Their Message</p>
          <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${String(item.inbound_message).slice(0, 500)}</div>
          <a href="https://supabase.com" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
            Open Supabase &rarr;
          </a>
        `;
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          replyTo: ESCALATION_TO,
          to:      ESCALATION_TO,
          subject: `Action Required — Unmatched Campaign ID`,
          html:    internalEmailShell('Unmatched Campaign ID', 'System Alert', unmatchedBody),
        });

        await supabase.from('reply_queue').update({ status: 'failed' }).eq('id', item.id);
        continue;
      }

      // Both prompt and booking link are required — no silent defaults
      if (!clientConfig.booking_link) {
        console.error(`[process-reply-queue] Client has no booking_link for campaign ID: ${item.campaign_id}`);
        const resend = new Resend(process.env.RESEND_API_KEY);
        const missingLinkBody = `
          <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.75;">A prospect replied but this client has no booking link set in Supabase. No reply was sent. Add the booking link to their row and requeue manually.</p>
          <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            ${infoRow('Campaign ID', String(item.campaign_id))}
            ${infoRow('Lead Email', String(item.lead_email))}
          </div>
          <a href="https://supabase.com" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
            Open Supabase &rarr;
          </a>
        `;
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          replyTo: ESCALATION_TO,
          to:      ESCALATION_TO,
          subject: `Action Required — Missing Booking Link`,
          html:    internalEmailShell('Missing Booking Link', 'System Alert', missingLinkBody),
        });
        await supabase.from('reply_queue').update({ status: 'failed' }).eq('id', item.id);
        continue;
      }

      // Build system prompt — use client's custom prompt if set, else ZionShift default
      // Note: the default is ONLY acceptable for Ryan's own ZionShift campaign.
      // All client rows should have their own prompt set in Supabase.
      const basePrompt   = clientConfig.ai_reply_prompt ?? REPLY_HANDLER_PROMPT;
      const systemPrompt = basePrompt.replace(/\[BOOKING_LINK\]/g, clientConfig.booking_link);

      // ── Fetch full conversation from Smartlead ──────────────────────────
      let conversationText = '';
      if (item.lead_id && item.campaign_id) {
        conversationText = await fetchConversationHistory(
          item.campaign_id,
          item.lead_id,
          item.lead_email
        );
      }

      // Fallback: just use the inbound message we stored
      if (!conversationText) {
        conversationText = `Prospect: ${sanitizeBody(item.inbound_message)}`;
      }

      // ── Call Claude Sonnet ─────────────────────────────────────────────
      const claudeMessage = await anthropic.messages.create({
        model:      'claude-sonnet-4-5',
        max_tokens: 500,
        system:     systemPrompt,
        messages: [{
          role:    'user',
          content: `Here is the full email conversation:\n\n${conversationText}\n\nWrite your reply now.`,
        }],
      });

      const claudeText =
        claudeMessage.content[0].type === 'text'
          ? claudeMessage.content[0].text
          : '';

      // ── Parse route tag ────────────────────────────────────────────────
      const tagMatch = claudeText.match(
        /ROUTE_TAG:\s*(AUTO_SUPPRESS|CONTINUE|ESCALATE_TO_DASHBOARD)/i
      );
      const routeTag = (tagMatch?.[1] ?? 'CONTINUE').toUpperCase();

      // Strip the ROUTE_TAG line to get clean reply text
      const replyText = claudeText
        .replace(/\nROUTE_TAG:.*$/im, '')
        .replace(/ROUTE_TAG:.*$/im, '')
        .trim();

      console.log(
        `[process-reply-queue] ${item.lead_email} → ${routeTag} | reply: ${replyText.slice(0, 80)}...`
      );

      // ── Route: AUTO_SUPPRESS ───────────────────────────────────────────
      if (routeTag === 'AUTO_SUPPRESS') {
        await supabase
          .from('suppressed_contacts')
          .upsert(
            {
              campaign_id: item.campaign_id,
              lead_email:  item.lead_email,
              reason:      'auto_suppress_by_ai',
            },
            { onConflict: 'campaign_id,lead_email' }
          );
        console.log(`[process-reply-queue] Auto-suppressed: ${item.lead_email}`);

      // ── Route: ESCALATE_TO_DASHBOARD ───────────────────────────────────
      } else if (routeTag === 'ESCALATE_TO_DASHBOARD') {
        // Flag in hot_leads if a record exists for this lead
        await supabase
          .from('hot_leads')
          .update({ ai_escalated: true })
          .eq('campaign_id', item.campaign_id)
          .eq('lead_email', item.lead_email);

        await sendEscalationEmail(
          item as Record<string, unknown>,
          replyText,
          'AI flagged this lead for human review'
        );

      // ── Route: CONTINUE — send reply via Smartlead ─────────────────────
      } else {
        if (item.lead_id && item.campaign_id) {
          const sent = await sendSmartleadReply(
            item.campaign_id,
            item.lead_id,
            replyText
          );

          if (!sent) {
            // Smartlead API failed — escalate so Ryan can reply manually
            await sendEscalationEmail(
              item as Record<string, unknown>,
              replyText,
              'Smartlead API failed — reply NOT sent, manual action required'
            );
          }
        } else {
          // No lead_id — can't hit Smartlead API, escalate
          await sendEscalationEmail(
            item as Record<string, unknown>,
            replyText,
            'Missing lead_id — reply could not be sent via Smartlead API'
          );
        }
      }

      // ── Log to reply_logs ──────────────────────────────────────────────
      await supabase
        .from('reply_logs')
        .insert({
          campaign_id:    item.campaign_id,
          lead_email:     item.lead_email,
          lead_id:        item.lead_id ?? null,
          route_tag:      routeTag,
          reply_sent:     routeTag === 'CONTINUE' ? replyText : null,
          claude_response: claudeText,
        });

      // ── Mark queue item done ───────────────────────────────────────────
      await supabase
        .from('reply_queue')
        .update({ status: 'done' })
        .eq('id', item.id);

      processed++;

    } catch (err) {
      console.error(`[process-reply-queue] Error processing ${item.lead_email}:`, err);

      // Mark as failed
      await supabase
        .from('reply_queue')
        .update({ status: 'failed' })
        .eq('id', item.id);

      // Send error alert
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const pipelineErrorBody = `
          <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.75;">The AI reply pipeline hit an unexpected error for the lead below. No reply was sent. Check the logs and requeue manually if needed.</p>
          <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
            ${infoRow('Lead', String(item.lead_email))}
            ${infoRow('Campaign', String(item.campaign_id))}
          </div>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">Error</p>
          <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#4B5563;white-space:pre-wrap;font-family:monospace;">${String(err).slice(0, 500)}</div>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;">Their Message</p>
          <div style="background:#FAFAF9;border:1px solid #EEEBE6;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:14px;color:#4B5563;line-height:1.7;white-space:pre-wrap;">${String(item.inbound_message ?? '').slice(0, 500)}</div>
          <a href="https://zionshift.com/client" style="display:inline-block;background:#1A1715;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:-0.01em;">
            View Dashboard &rarr;
          </a>
        `;
        await resend.emails.send({
          from:    'ZionShift <hello@zionshift.com>',
          replyTo: ESCALATION_TO,
          to:      ESCALATION_TO,
          subject: `Action Required — Pipeline Error`,
          html:    internalEmailShell('Pipeline Error', 'System Alert', pipelineErrorBody),
        });
      } catch (emailErr) {
        console.error('[process-reply-queue] Error alert email failed:', emailErr);
      }
    }
  }

  console.log(`[process-reply-queue] Done — processed ${processed}/${items.length}`);
  return NextResponse.json({ processed, total: items.length });
}
