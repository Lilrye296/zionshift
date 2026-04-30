import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Booking platform URL patterns we treat as a hot lead signal ──
const BOOKING_PATTERNS = [
  'cal.com/',
  'calendly.com/',
  'hubspot.com/meetings/',
  'acuityscheduling.com/',
  'tidycal.com/',
  'savvycal.com/',
  'zcal.co/',
  'usemotion.com/',
  'appointlet.com/',
  'clockwise.app/',
];

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Scan email body for any booking/calendar link.
 * Returns the full URL if found, null if not.
 */
function detectBookingLink(text: string): string | null {
  if (!text) return null;
  const urls = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  for (const url of urls) {
    const lower = url.toLowerCase();
    if (BOOKING_PATTERNS.some(p => lower.includes(p))) {
      return url;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // ── 1. Extract fields — handle variations in Smartlead payload shape ──
    const campaignId = String(
      payload.campaign_id   ??
      payload.campaignId    ??
      payload.campaign?.id  ??
      ''
    );

    const leadEmail = String(
      payload.lead_email  ??
      payload.leadEmail   ??
      payload.to_email    ??
      payload.email       ??
      ''
    );

    const emailBody = String(
      payload.email_body  ??
      payload.emailBody   ??
      payload.body        ??
      payload.message     ??
      payload.content     ??
      ''
    );

    const eventType = String(
      payload.event_type  ??
      payload.eventType   ??
      payload.type        ??
      ''
    ).toUpperCase();

    // Extra enrichment fields — used for conversation viewer
    const leadId = payload.lead_id ?? payload.leadId ?? payload.lead?.id ?? null;
    const leadName = String(
      payload.lead_name   ??
      payload.leadName    ??
      payload.lead?.name  ??
      payload.name        ??
      ''
    ) || null;
    const leadCompany = String(
      payload.lead_company      ??
      payload.leadCompany       ??
      payload.company_name      ??
      payload.lead?.company     ??
      payload.organization      ??
      ''
    ) || null;

    // ── 2. Log full payload on first use so we can verify field names ──
    console.log('[smartlead-webhook] Event received:', {
      eventType,
      campaignId,
      leadEmail,
      bodyPreview: emailBody.slice(0, 100),
    });

    // ── 3. Ignore if we don't have minimum required data ──────────
    if (!campaignId || !emailBody) {
      return NextResponse.json({ received: true });
    }

    // ── 4. Only process outbound AI replies — skip inbound lead replies ──
    // Smartlead event types for inbound: LEAD_REPLIED, EMAIL_REPLIED, REPLY_RECEIVED
    // We want outbound: EMAIL_SENT, AI_EMAIL_SENT, or any sent event
    const isInbound =
      eventType.includes('LEAD_REPL') ||
      eventType.includes('REPLY_RECEIVED') ||
      eventType === 'INBOUND';

    if (isInbound) {
      return NextResponse.json({ received: true });
    }

    // ── 5. Check for a booking/calendar link in the email body ────
    const bookingLink = detectBookingLink(emailBody);
    if (!bookingLink) {
      // No calendar link dropped — not a hot lead
      return NextResponse.json({ received: true });
    }

    // ── 6. Look up which client owns this campaign ID ─────────────
    const supabase = supabaseAdmin();
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('smartlead_campaign_id', campaignId)
      .maybeSingle();

    if (!client?.id) {
      console.error(`[smartlead-webhook] No client found for campaign ID: ${campaignId}`);
      return NextResponse.json({ received: true });
    }

    // ── 7. Prevent duplicate hot leads for same lead in same campaign ─
    const { data: existing } = await supabase
      .from('hot_leads')
      .select('id')
      .eq('client_id', client.id)
      .eq('campaign_id', campaignId)
      .eq('lead_email', leadEmail)
      .maybeSingle();

    if (existing?.id) {
      // Already recorded a hot lead for this lead — skip
      return NextResponse.json({ received: true });
    }

    // ── 8. Write hot lead to Supabase ─────────────────────────────
    // Store lead_id in conversation._meta so get-lead-conversation
    // can use it to fetch the full thread from Smartlead's API.
    const conversationMeta = leadId
      ? { _meta: { lead_id: leadId, lead_name: leadName, lead_company: leadCompany } }
      : null;

    const { error } = await supabase
      .from('hot_leads')
      .insert({
        client_id:    client.id,
        campaign_id:  campaignId,
        lead_email:   leadEmail,
        lead_name:    leadName,
        lead_company: leadCompany,
        email_body:   emailBody,
        booking_link: bookingLink,
        conversation: conversationMeta,
        status:       'new',
      });

    if (error) {
      console.error('[smartlead-webhook] Insert error:', error);
    } else {
      console.log(
        `[smartlead-webhook] Hot lead recorded — client: ${client.id}, lead: ${leadEmail}, link: ${bookingLink}`
      );

      // ── 9. Suppress this lead so the AI never replies again ──────
      // Booking link was dropped — conversation is now handed off to
      // the client. Any future replies from the prospect are ignored
      // by handle-reply because the lead is in suppressed_contacts.
      const { error: suppressError } = await supabase
        .from('suppressed_contacts')
        .upsert(
          { campaign_id: campaignId, lead_email: leadEmail, reason: 'booking_link_sent' },
          { onConflict: 'campaign_id,lead_email' }
        );

      if (suppressError) {
        console.error('[smartlead-webhook] Suppression insert error:', suppressError);
      } else {
        console.log(`[smartlead-webhook] Lead suppressed — no further AI replies: ${leadEmail}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('[smartlead-webhook] Unexpected error:', err);
    // Always return 200 so Smartlead doesn't retry endlessly
    return NextResponse.json({ received: true });
  }
}
