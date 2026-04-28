import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function fmtInvoiceDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function describeCharge(amountCents: number, description: string | null): string {
  if (amountCents === 100000) return 'Setup Fee';
  if (amountCents === 200000) return 'Monthly Retainer';
  return description ?? 'Charge';
}

function mapStatus(status: string): 'paid' | 'open' | 'failed' {
  if (status === 'succeeded') return 'paid';
  if (status === 'failed')    return 'failed';
  return 'open';
}

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // ── 1. Look up Stripe customer ID for this client ──────────────
    const { data: clientRow } = await supabase
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', clientId)
      .single();

    if (!clientRow?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = stripeClient();

    // ── 2. Fetch all charges for this customer ─────────────────────
    const charges = await stripe.charges.list({
      customer: clientRow.stripe_customer_id,
      limit: 20,
    });

    // ── 3. Format into clean invoice rows ─────────────────────────
    const invoices = charges.data.map(charge => ({
      date:        fmtInvoiceDate(charge.created),
      description: describeCharge(charge.amount, charge.description),
      amount:      charge.amount / 100,
      status:      mapStatus(charge.status),
    }));

    return NextResponse.json({ invoices });

  } catch (err) {
    console.error('[get-invoices] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch invoices.' }, { status: 500 });
  }
}
