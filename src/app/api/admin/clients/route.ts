import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  try {
    // 1. Extract Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization') ?? '';
    const accessToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized — no token' }, { status: 401 });
    }

    // 2. Verify the JWT with a direct HTTP call to Supabase Auth — no library quirks
    const authRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      }
    );

    if (!authRes.ok) {
      return NextResponse.json({ error: 'Unauthorized — token invalid' }, { status: 401 });
    }

    const userData = await authRes.json();
    const userId: string = userData.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized — no user id' }, { status: 401 });
    }

    // 3. Use service role (bypasses RLS) for all data queries
    const admin = supabaseAdmin();

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Fetch clients
    const { data: clients, error } = await admin
      .from('clients')
      .select('id, name, email, firm, status, mrr, since, first_month_paid, setup_fee_paid, headshot_url, logo_url')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients });
  } catch (err) {
    console.error('[admin/clients] Unhandled error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
