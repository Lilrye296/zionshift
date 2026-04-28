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
    const { clientId, clientEmail } = await req.json();

    if (!clientId || !clientEmail) {
      return NextResponse.json({ error: 'Missing clientId or clientEmail.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // ── 1. Cancel Stripe subscription ─────────────────────────────
    try {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', clientId)
        .single();

      const stripe = stripeClient();

      // Cancel active subscription immediately if it exists
      if (clientRow?.stripe_subscription_id) {
        await stripe.subscriptions.cancel(clientRow.stripe_subscription_id);
      }

      // Also cancel any other active subscriptions on the customer as a safety net
      if (clientRow?.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: clientRow.stripe_customer_id,
          status: 'active',
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
        }

        // Cancel trialing subscriptions too
        const trialingSubs = await stripe.subscriptions.list({
          customer: clientRow.stripe_customer_id,
          status: 'trialing',
        });
        for (const sub of trialingSubs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    } catch (stripeErr) {
      console.error('[delete-client] Stripe cancellation error:', stripeErr);
      // Non-fatal — continue with DB deletion regardless
    }

    // ── 3. Find the auth user by email ────────────────────────────
    const { data: authList } = await supabase.auth.admin.listUsers();
    const authUser = authList?.users?.find(u => u.email === clientEmail);

    // ── 4. Delete Supabase auth user (also cascades profile delete if FK is set) ──
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id);
      // Also delete profile row explicitly in case no cascade
      await supabase.from('profiles').delete().eq('id', authUser.id);
    }

    // ── 5. Delete all table records tied to this client ───────────
    await supabase.from('clients').delete().eq('id', clientId);
    await supabase.from('onboarding_responses').delete().eq('email', clientEmail);
    await supabase.from('clay_configs').delete().eq('email', clientEmail);
    await supabase.from('onboarding_tokens').delete().eq('email', clientEmail);
    await supabase.from('meetings').delete().eq('client_id', clientId);
    await supabase.from('activity').delete().eq('client_id', clientId);

    // ── 6. Delete storage files ────────────────────────────────────
    // List and remove headshot folder
    const { data: headshotFiles } = await supabase.storage
      .from('client-assets')
      .list(`headshots/${clientEmail}`);

    if (headshotFiles && headshotFiles.length > 0) {
      const headshotPaths = headshotFiles.map(f => `headshots/${clientEmail}/${f.name}`);
      await supabase.storage.from('client-assets').remove(headshotPaths);
    }

    // List and remove logo folder
    const { data: logoFiles } = await supabase.storage
      .from('client-assets')
      .list(`logos/${clientEmail}`);

    if (logoFiles && logoFiles.length > 0) {
      const logoPaths = logoFiles.map(f => `logos/${clientEmail}/${f.name}`);
      await supabase.storage.from('client-assets').remove(logoPaths);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[delete-client] Error:', err);
    return NextResponse.json({ error: 'Failed to delete client.' }, { status: 500 });
  }
}
