import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(req: NextRequest) {
  const { id, action } = await req.json();

  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action.' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  if (action === 'followed_up') {
    const { error } = await supabase
      .from('hot_leads')
      .update({ status: 'followed_up' })
      .eq('id', id);

    if (error) {
      console.error('[update-hot-lead] followed_up error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { error } = await supabase
      .from('hot_leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[update-hot-lead] delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
