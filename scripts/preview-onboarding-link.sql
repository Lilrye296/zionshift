-- ============================================================
-- Generate a one-time onboarding preview link for review.
-- Creates ONLY a token — no client record, no account.
-- Just don't hit the final submit button and nothing is stored.
-- Expires in 48 hours automatically.
-- ============================================================

DO $$
DECLARE
  v_token UUID := gen_random_uuid();
BEGIN

  INSERT INTO onboarding_tokens (token, email, expires_at, used)
  VALUES (
    v_token,
    'ryanjflo@gmail.com',
    NOW() + INTERVAL '48 hours',
    false
  );

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Your onboarding preview link:';
  RAISE NOTICE 'https://www.zionshift.com/onboard?token=%', v_token;
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Browse all 5 screens freely. Just do NOT hit the final';
  RAISE NOTICE '"Go to my dashboard" button or it will create an account.';
  RAISE NOTICE 'Token auto-expires in 48 hours.';

END $$;
