import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/handle-reply
 *
 * Smartlead fires this webhook when a prospect replies to an outbound email.
 * We queue the reply for delayed AI processing (3–8 min) to appear human,
 * then return 200 immediately so Smartlead doesn't retry.
 *
 * Smartlead webhook URL to configure:
 *   https://yourdomain.com/api/handle-reply?secret=YOUR_SMARTLEAD_WEBHOOK_SECRET
 * Event type: LEAD_REPLIED (or EMAIL_REPLIED / REPLY_RECEIVED depending on plan)
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify webhook secret ──────────────────────────────────────────────
    const expectedSecret = process.env.SMARTLEAD_WEBHOOK_SECRET;
    if (expectedSecret) {
      const receivedSecret =
        req.nextUrl.searchParams.get('secret') ??
        req.headers.get('x-smartlead-secret') ??
        req.headers.get('x-webhook-secret');

      if (receivedSecret !== expectedSecret) {
        console.warn('[handle-reply] Rejected webhook — invalid secret');
        return NextResponse.json({ received: true }); // Don't expose rejection reason
      }
    }

    const payload = await req.json();

    // ── 2. Filter to inbound events only ─────────────────────────────────────
    const eventType = String(
      payload.event_type ?? payload.eventType ?? payload.type ?? ''
    ).toUpperCase();

    const isInbound =
      eventType.includes('LEAD_REPL') ||
      eventType.includes('REPLY_RECEIVED') ||
      eventType === 'EMAIL_REPLIED'       ||
      eventType === 'INBOUND';

    if (!isInbound) {
      // Outbound events are handled by /api/webhooks/smartlead
      return NextResponse.json({ received: true });
    }

    // ── 3. Extract fields ─────────────────────────────────────────────────────
    const campaignId = String(
      payload.campaign_id  ??
      payload.campaignId   ??
      payload.campaign?.id ??
      ''
    );

    const leadId = String(
      payload.lead_id  ??
      payload.leadId   ??
      payload.lead?.id ??
      ''
    ) || null;

    const leadEmail = String(
      payload.lead_email ??
      payload.leadEmail  ??
      payload.from_email ??
      payload.email      ??
      ''
    );

    const leadName = String(
      payload.lead_name  ??
      payload.leadName   ??
      payload.lead?.name ??
      payload.name       ??
      ''
    ) || null;

    const leadCompany = String(
      payload.lead_company   ??
      payload.leadCompany    ??
      payload.company_name   ??
      payload.lead?.company  ??
      payload.organization   ??
      ''
    ) || null;

    const inboundMessage = String(
      payload.email_body ??
      payload.emailBody  ??
      payload.body       ??
      payload.message    ??
      payload.content    ??
      ''
    );

    console.log('[handle-reply] Inbound reply received:', {
      eventType,
      campaignId,
      leadEmail,
      leadId,
      msgPreview: inboundMessage.slice(0, 120),
    });

    // ── 4. Validate minimum required fields ───────────────────────────────────
    if (!campaignId || !leadEmail || !inboundMessage) {
      console.warn('[handle-reply] Skipping — missing required fields', {
        campaignId,
        leadEmail,
        hasBody: Boolean(inboundMessage),
      });
      return NextResponse.json({ received: true });
    }

    const supabase = supabaseAdmin();

    // ── 5. Check suppressed contacts — skip if already opted out ──────────────
    const { data: suppressed } = await supabase
      .from('suppressed_contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('lead_email', leadEmail)
      .maybeSingle();

    if (suppressed?.id) {
      console.log(`[handle-reply] Skipping suppressed contact: ${leadEmail}`);
      return NextResponse.json({ received: true });
    }

    // ── 6. Check for duplicate pending queue item ─────────────────────────────
    const { data: existing } = await supabase
      .from('reply_queue')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('lead_email', leadEmail)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing?.id) {
      // Already queued for this lead in this campaign — don't double-queue
      console.log(`[handle-reply] Already queued for ${leadEmail} — skipping duplicate`);
      return NextResponse.json({ received: true });
    }

    // ── 7. Schedule with 3–8 minute random delay ──────────────────────────────
    // Random delay makes AI replies feel human — not instant-bot.
    const delayMinutes = Math.floor(Math.random() * 6) + 3; // 3, 4, 5, 6, 7, or 8
    const processAfter = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('reply_queue')
      .insert({
        campaign_id:     campaignId,
        lead_id:         leadId,
        lead_email:      leadEmail,
        lead_name:       leadName,
        lead_company:    leadCompany,
        inbound_message: inboundMessage,
        process_after:   processAfter,
        status:          'pending',
      });

    if (insertError) {
      console.error('[handle-reply] Queue insert error:', insertError);
    } else {
      console.log(
        `[handle-reply] Queued AI reply for ${leadEmail} — fires in ${delayMinutes}min at ${processAfter}`
      );
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('[handle-reply] Unexpected error:', err);
    // Always return 200 so Smartlead doesn't retry endlessly
    return NextResponse.json({ received: true });
  }
}
