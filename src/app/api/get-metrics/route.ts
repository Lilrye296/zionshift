import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SMARTLEAD_BASE = 'https://server.smartlead.ai/api/v1';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Returns ISO date strings for period-scoped queries, or null for All Time. */
function getDateRange(period: string): { start: string; end: string } | null {
  const now  = new Date();
  const end  = now.toISOString().split('T')[0];

  if (period === 'week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start: start.toISOString().split('T')[0], end };
  }

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().split('T')[0], end };
  }

  return null; // alltime — no date filter
}

/** Safely read a numeric field — handles undefined, null, string numbers. */
function num(val: unknown): number {
  if (val === undefined || val === null) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');
  const period   = req.nextUrl.searchParams.get('period') ?? 'alltime';

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId.' }, { status: 400 });
  }

  // ── 1. Look up client's Smartlead campaign ID ──────────────────
  const supabase = supabaseAdmin();
  const { data: client } = await supabase
    .from('clients')
    .select('smartlead_campaign_id')
    .eq('id', clientId)
    .single();

  if (!client?.smartlead_campaign_id) {
    // No campaign linked yet — return null so dashboard shows dashes
    return NextResponse.json({ metrics: null });
  }

  const apiKey     = process.env.SMARTLEAD_API_KEY!;
  const campaignId = client.smartlead_campaign_id;
  const dateRange  = getDateRange(period);

  // ── 2. Call Smartlead API ──────────────────────────────────────
  try {
    let sent = 0, replies = 0, bounces = 0, optOuts = 0;

    if (!dateRange) {
      // ── All Time: main analytics endpoint ─────────────────────
      const url = `${SMARTLEAD_BASE}/campaigns/${campaignId}/analytics?api_key=${apiKey}`;
      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) {
        console.error(`[get-metrics] Smartlead analytics error ${res.status}:`, await res.text());
        return NextResponse.json({ metrics: null });
      }

      const data = await res.json();

      // Smartlead field names (flat object on the root or nested under data)
      const d = data?.data ?? data;
      sent    = num(d.sent_count);
      replies = num(d.reply_count);
      bounces = num(d.bounce_count);
      optOuts = num(d.unsubscribe_count);

    } else {
      // ── This Week / This Month: analytics-by-date endpoint ────
      const url = `${SMARTLEAD_BASE}/campaigns/${campaignId}/analytics-by-date`
        + `?api_key=${apiKey}&start_date=${dateRange.start}&end_date=${dateRange.end}`;
      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) {
        console.error(`[get-metrics] Smartlead analytics-by-date error ${res.status}:`, await res.text());
        return NextResponse.json({ metrics: null });
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        // Array of daily records — sum them up
        for (const day of data) {
          sent    += num(day.sent_count);
          replies += num(day.reply_count);
          bounces += num(day.bounce_count);
          optOuts += num(day.unsubscribe_count);
        }
      } else {
        // Aggregated object (same shape as main analytics)
        const d  = data?.data ?? data;
        sent    = num(d.sent_count);
        replies = num(d.reply_count);
        bounces = num(d.bounce_count);
        optOuts = num(d.unsubscribe_count);
      }
    }

    // ── 3. Calculate rates ourselves for accuracy ──────────────
    const replyRate  = sent > 0 ? parseFloat(((replies / sent) * 100).toFixed(2)) : 0;
    const bounceRate = sent > 0 ? parseFloat(((bounces / sent) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      metrics: {
        emails_sent:  sent,
        replies,
        reply_rate:   replyRate,
        bounces,
        bounce_rate:  bounceRate,
        opt_outs:     optOuts,
      },
    });

  } catch (err) {
    console.error('[get-metrics] Unexpected error:', err);
    return NextResponse.json({ metrics: null });
  }
}
