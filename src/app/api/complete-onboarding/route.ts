import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      firstName, lastName, businessName, cityState, yearsInBusiness, websiteUrl,
      logoBase64, logoExt, headshotBase64, headshotExt,
      industries, otherIndustry, employeeCount, revenueRange, geoFocus,
      differentiator, painPoint, transformation, tone, avoidances,
      bookingLink,
      exclusions, prospectNote, referralSource,
    } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // ── 1. Validate token (server-side, authoritative) ─────────────
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('onboarding_tokens')
      .select('email, used, expires_at')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenRow) {
      return NextResponse.json({ error: 'Invalid link.' }, { status: 400 });
    }
    if (tokenRow.used) {
      return NextResponse.json({ error: 'This link has already been used.' }, { status: 400 });
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired.' }, { status: 400 });
    }

    const email = tokenRow.email;

    // ── 2. Mark token as used ──────────────────────────────────────
    await supabase
      .from('onboarding_tokens')
      .update({ used: true })
      .eq('token', token);

    // ── 3. Upload logo ─────────────────────────────────────────────
    let logoUrl: string | null = null;
    if (logoBase64 && logoExt) {
      try {
        const buffer = Buffer.from(logoBase64, 'base64');
        const path = `logos/${email}/logo.${logoExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('client-assets')
          .upload(path, buffer, {
            contentType: logoExt === 'png' ? 'image/png' : 'image/jpeg',
            upsert: true,
          });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage
            .from('client-assets')
            .getPublicUrl(path);
          logoUrl = publicUrl;
        }
      } catch (e) {
        console.error('[complete-onboarding] Logo upload failed:', e);
      }
    }

    // ── 4. Upload headshot ─────────────────────────────────────────
    let headshotUrl: string | null = null;
    if (headshotBase64 && headshotExt) {
      try {
        const buffer = Buffer.from(headshotBase64, 'base64');
        const path = `headshots/${email}/headshot.${headshotExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('client-assets')
          .upload(path, buffer, {
            contentType: headshotExt === 'png' ? 'image/png' : 'image/jpeg',
            upsert: true,
          });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage
            .from('client-assets')
            .getPublicUrl(path);
          headshotUrl = publicUrl;
        }
      } catch (e) {
        console.error('[complete-onboarding] Headshot upload failed:', e);
      }
    }

    // ── 5. Insert onboarding_responses ─────────────────────────────
    try {
      await supabase.from('onboarding_responses').insert({
        email,
        response_data: {
          firstName, lastName, businessName, cityState, yearsInBusiness, websiteUrl,
          industries, otherIndustry, employeeCount, revenueRange, geoFocus,
          differentiator, painPoint, transformation, tone, avoidances,
          bookingLink,
          exclusions, prospectNote, referralSource,
        },
        submitted_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[complete-onboarding] onboarding_responses insert failed:', e);
    }

    // ── 6. Insert clay_configs ─────────────────────────────────────
    try {
      await supabase.from('clay_configs').insert({
        email,
        firm_name: businessName,
        owner_name: `${firstName} ${lastName}`,
        city: cityState,
        years_in_business: parseInt(yearsInBusiness) || 0,
        ideal_client: Array.isArray(industries) ? industries.join(', ') : '',
        employee_count_range: Array.isArray(employeeCount) ? employeeCount.join(', ') : '',
        revenue_range: revenueRange,
        geo_focus: geoFocus,
        differentiator,
        pain_point: painPoint,
        transformation,
        tone,
        exclusions: avoidances,
        booking_link: bookingLink,
        submitted_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[complete-onboarding] clay_configs insert failed:', e);
    }

    // ── 7. Update clients row → live ───────────────────────────────
    const { error: clientErr } = await supabase
      .from('clients')
      .update({
        name: `${firstName} ${lastName}`,
        firm: businessName,
        status: 'live',
        since: new Date().toISOString(),
        campaign_status: 'warming',
        warmup_started_at: new Date().toISOString(),
        ...(logoUrl ? { logo_url: logoUrl } : {}),
        ...(headshotUrl ? { headshot_url: headshotUrl } : {}),
      })
      .eq('email', email);

    if (clientErr) {
      console.error('[complete-onboarding] Client update error:', clientErr);
    }

    // ── 8. Send build brief email to ryan@zionshift.com ───────────
    try {
      const industryList = Array.isArray(industries) ? industries.join(', ') : industries;
      const empList = Array.isArray(employeeCount) ? employeeCount.join(', ') : employeeCount;
      const submittedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      await resendClient().emails.send({
        from: 'ZionShift <hello@zionshift.com>',
        to: 'ryan@zionshift.com',
        replyTo: 'ryan@zionshift.com',
        subject: `🔥 New client just onboarded — ${businessName} is ready to build`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>New Client Onboarded</title></head>
<body style="margin:0;padding:40px 0;background:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

    <div style="background:#1A1715;padding:28px 36px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);">ZionShift — Build Brief</p>
      <h1 style="margin:10px 0 0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.03em;">${businessName} just onboarded.</h1>
      <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">${email} · ${submittedDate}</p>
    </div>

    <div style="padding:32px 36px;">
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#374151;">
        Their onboarding form is complete. Time to buy their domain, spin up their mailboxes, start the warmup, and build their Clay table. Everything you need is below.
      </p>

      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">About Them</p>
      <div style="background:#F9FAFB;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;width:42%;">Name</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Business</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${businessName}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Location</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${cityState}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Years in Business</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${yearsInBusiness}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Website</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${websiteUrl || '—'}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Booking Link</td><td style="padding:4px 0;font-size:14px;color:#1A1715;"><a href="${bookingLink}" style="color:#1A1715;">${bookingLink || '—'}</a></td></tr>
        </table>
      </div>

      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Ideal Client</p>
      <div style="background:#F9FAFB;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;width:42%;">Industries</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${industryList}${otherIndustry ? ` (Other: ${otherIndustry})` : ''}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Employee Count</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${empList}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Revenue Range</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${revenueRange}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Geo Focus</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${geoFocus}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Exclusions</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${exclusions || '—'}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Prospect Note</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${prospectNote || '—'}</td></tr>
        </table>
      </div>

      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">Voice &amp; Messaging</p>
      <div style="background:#F9FAFB;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;width:42%;">Differentiator</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${differentiator}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Pain Point</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${painPoint}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Transformation</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${transformation}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Tone</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${tone}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;">Avoid</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${avoidances || '—'}</td></tr>
        </table>
      </div>

      <div style="background:#F9FAFB;border-radius:10px;padding:18px 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;font-weight:600;color:#6B7280;width:42%;">Referral Source</td><td style="padding:4px 0;font-size:14px;color:#1A1715;">${referralSource || '—'}</td></tr>
        </table>
      </div>

    </div>

    <div style="padding:16px 36px 24px;border-top:1px solid #F0EDE8;">
      <p style="margin:0;font-size:12px;color:#C8C4BC;">ZionShift · Go build their machine — the clock is ticking.</p>
    </div>

  </div>
</body>
</html>
        `.trim(),
      });
    } catch (e) {
      console.error('[complete-onboarding] Notification email failed:', e);
    }

    // ── 9. Create Supabase auth user ───────────────────────────────
    const tempPass = crypto.randomUUID().replace(/-/g, '').slice(0, 16) + 'Zs1!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
    });

    if (authError) {
      // User might already exist — try to get them instead
      console.error('[complete-onboarding] Auth createUser error:', authError);
      return NextResponse.json({ success: true, tempPass: null });
    }

    const userId = authData.user?.id;

    // ── 10. Insert profile row with client_id ─────────────────────
    if (userId) {
      try {
        // Look up the clients row to get its id so the dashboard can load their data
        const { data: clientRecord } = await supabase
          .from('clients')
          .select('id')
          .eq('email', email)
          .single();

        await supabase.from('profiles').insert({
          id: userId,
          role: 'client',
          client_id: clientRecord?.id ?? null,
        });
      } catch (e) {
        console.error('[complete-onboarding] Profile insert failed:', e);
      }
    }

    return NextResponse.json({ success: true, tempPass });

  } catch (err) {
    console.error('[complete-onboarding] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
