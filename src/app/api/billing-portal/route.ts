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

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Look up the client's Stripe customer ID
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('stripe_customer_id, email')
      .eq('id', clientId)
      .single();

    if (clientErr || !client?.stripe_customer_id) {
      console.error('[billing-portal] Client lookup failed:', clientErr);
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    // Create Stripe billing portal session
    const stripe = stripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer:   client.stripe_customer_id,
      return_url: 'https://www.zionshift.com/client',
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error('[billing-portal] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
