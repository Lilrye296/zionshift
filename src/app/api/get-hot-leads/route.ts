import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId.' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('hot_leads')
    .select('id, lead_name, lead_company, lead_email, conversation, status, booking_link, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[get-hot-leads] Error:', error);
    return NextResponse.json({ hotLeads: [] });
  }

  return NextResponse.json({ hotLeads: data ?? [] });
}
