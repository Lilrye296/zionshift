import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SMARTLEAD_BASE = 'https://server.smartlead.ai/api/v1';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function fmtTime(val: unknown): string {
  if (!val) return '';
  try { return new Date(String(val)).toISOString(); } catch { return ''; }
}

function sanitizeBody(html: string): string {
  // Strip HTML tags for clean text display
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

export async function GET(req: NextRequest) {
  const hotLeadId = req.nextUrl.searchParams.get('hotLeadId');

  if (!hotLeadId) {
    return NextResponse.json({ error: 'Missing hotLeadId.' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // ── 1. Fetch hot lead record ──────────────────────────────────
  const { data: lead } = await supabase
    .from('hot_leads')
    .select('campaign_id, lead_email, lead_name, lead_company, conversation, email_body')
    .eq('id', hotLeadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: 'Hot lead not found.' }, { status: 404 });
  }

  // ── 2. Try to get lead_id from stored conversation metadata ───
  const meta = (lead.conversation as { _meta?: { lead_id?: number | string } } | null)?._meta;
  const leadId = meta?.lead_id;

  // ── 3. Fetch full message history from Smartlead if we have lead_id ──
  if (leadId && lead.campaign_id) {
    try {
      const apiKey = process.env.SMARTLEAD_API_KEY!;
      const url = `${SMARTLEAD_BASE}/campaigns/${lead.campaign_id}/leads/${leadId}/message-history?api_key=${apiKey}`;
      const res = await fetch(url, { cache: 'no-store' });

      if (res.ok) {
        const history = await res.json();
        const rawMessages: unknown[] = Array.isArray(history)
          ? history
          : (history?.data ?? history?.messages ?? []);

        // Map Smartlead message history to our ConversationMessage format
        const messages = rawMessages.map((m: unknown, i: number) => {
          const msg = m as Record<string, unknown>;
          const rawType = String(msg.type ?? '').toUpperCase();
          const isOutbound = rawType === 'SENT' || rawType === 'EMAIL_SENT' || rawType === 'OUTBOUND';
          const seqNum = msg.seq_number ?? msg.sequence_number ?? null;
          const isAiGenerated = Boolean(msg.is_ai_generated ?? msg.ai_generated ?? false);

          let sender = 'AI Reply';
          if (isOutbound) {
            if (seqNum && Number(seqNum) <= 10 && !isAiGenerated) {
              sender = `Cold Email — Sequence ${seqNum}`;
            } else {
              sender = 'AI Reply';
            }
          } else {
            sender = lead.lead_name ?? lead.lead_email ?? 'Lead';
          }

          const body = sanitizeBody(String(
            msg.email_body ?? msg.body ?? msg.content ?? msg.message ?? ''
          ));

          const time = fmtTime(
            msg.email_time ?? msg.time ?? msg.sent_at ?? msg.created_at ?? null
          );

          return {
            id: i,
            type: isOutbound ? 'outbound' : 'inbound',
            sender,
            body,
            time,
            subject: msg.subject ? String(msg.subject) : undefined,
          };
        });

        return NextResponse.json({ messages });
      }
    } catch (err) {
      console.error('[get-lead-conversation] Smartlead fetch error:', err);
    }
  }

  // ── 4. Fallback: return just the AI reply we stored from webhook ──
  if (lead.email_body) {
    return NextResponse.json({
      messages: [{
        id: 0,
        type: 'outbound',
        sender: 'AI Reply (booking link sent)',
        body: sanitizeBody(lead.email_body),
        time: '',
      }],
      partial: true, // signals to UI that this is incomplete
    });
  }

  return NextResponse.json({ messages: [] });
}
