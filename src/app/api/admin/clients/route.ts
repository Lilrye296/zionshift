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
    const admin = supabaseAdmin();
    const projectRef = 'apgzaawqmunbuzfryntc';

    // Supabase SSR may chunk the auth cookie across multiple keys
    let tokenJson = '';
    for (let i = 0; i < 5; i++) {
      const chunk = req.cookies.get(`sb-${projectRef}-auth-token.${i}`)?.value;
      if (!chunk) break;
      tokenJson += chunk;
    }
    // Fall back to non-chunked cookie
    if (!tokenJson) {
      tokenJson = req.cookies.get(`sb-${projectRef}-auth-token`)?.value ?? '';
    }

    let accessToken: string | null = null;
    if (tokenJson) {
      try {
        const parsed = JSON.parse(decodeURIComponent(tokenJson));
        accessToken = parsed.access_token ?? null;
      } catch {
        accessToken = tokenJson; // already a raw token string
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized — no session token found' }, { status: 401 });
    }

    // Verify the token — admin.auth.getUser(token) validates without needing cookies
    const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized — invalid or expired token' }, { status: 401 });
    }

    // Check admin role (service role bypasses RLS)
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch clients — service role bypasses RLS entirely
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
