'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function sendPasswordResetEmail(email: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://www.zionshift.com/auth/callback?next=/reset-password',
  });

  if (error) {
    if (error.status === 429 || error.message?.toLowerCase().includes('rate')) {
      return { error: 'rate_limited' };
    }
    return { error: error.message };
  }

  return {};
}
