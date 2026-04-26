import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email.' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // Fetch the client's file URLs and firm name
  const { data: client, error } = await supabase
    .from('clients')
    .select('logo_url, headshot_url, firm, name')
    .eq('email', email)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
  }

  const zip = new JSZip();
  let hasFiles = false;

  // Helper to fetch a URL and add to zip
  async function addToZip(url: string, filename: string) {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const buffer = await res.arrayBuffer();
      zip.file(filename, buffer);
      hasFiles = true;
    } catch {
      // Skip silently — file may not exist
    }
  }

  if (client.logo_url) {
    const ext = client.logo_url.split('.').pop()?.split('?')[0] ?? 'png';
    await addToZip(client.logo_url, `logo.${ext}`);
  }

  if (client.headshot_url) {
    const ext = client.headshot_url.split('.').pop()?.split('?')[0] ?? 'jpg';
    await addToZip(client.headshot_url, `headshot.${ext}`);
  }

  if (!hasFiles) {
    return NextResponse.json({ error: 'No files found for this client.' }, { status: 404 });
  }

  const zipBuffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const slug = (client.firm || client.name || 'client').replace(/[^a-zA-Z0-9]/g, '_');
  const blob = new Blob([zipBuffer], { type: 'application/zip' });

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}_assets.zip"`,
    },
  });
}
