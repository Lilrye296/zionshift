import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Implicit flow sends tokens in the URL hash instead of a PKCE code,
        // so password-reset links work reliably across browsers and email clients
        // without needing a stored code verifier. Login (signInWithPassword) is unaffected.
        flowType: 'implicit',
      },
    }
  )
}
