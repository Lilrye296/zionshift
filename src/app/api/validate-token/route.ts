import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, reason: 'no_token' });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select('token, email, expires_at, used')
    .eq('token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: 'not_found' });
  }

  if (data.used) {
    return NextResponse.json({ valid: false, reason: 'used' });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'expired' });
  }

  return NextResponse.json({ valid: true, email: data.email });
}
