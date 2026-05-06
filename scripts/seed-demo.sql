-- ============================================================
-- ZionShift Demo Data Seed
-- Paste and run this entire script in Supabase → SQL Editor
-- Safe to run once. To reset: delete the row where
--   email = 'sarah.demo@clearledger.com' from clients,
--   then re-run.
-- ============================================================

-- Add demo_metrics column (skipped if already exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS demo_metrics JSONB;

-- Insert demo client + 7 hot leads in one transaction
DO $$
DECLARE
  v_id UUID;
BEGIN

  INSERT INTO clients (
    name, email, firm, status, mrr, since,
    first_month_paid, setup_fee_paid,
    headshot_url, logo_url,
    campaign_status, billing_status,
    warmup_started_at, smartlead_campaign_id,
    booking_link, ai_reply_prompt,
    demo_metrics, created_at
  ) VALUES (
    'Sarah Mitchell',
    'sarah.demo@clearledger.com',
    'ClearLedger Bookkeeping',
    'live',
    2000,
    '2026-03-01',
    true,
    true,
    null,
    null,
    'active',
    'active',
    '2026-02-15 00:00:00+00',
    null,
    'https://cal.com/clearledger/discovery',
    'You are the AI booking assistant for ClearLedger Bookkeeping, a firm that specializes in bookkeeping for e-commerce and retail businesses. When a prospect replies with interest, your goal is to get them booked on a 20-minute discovery call. Be warm, professional, and concise. Address concerns about pricing, process, or past experiences directly and with empathy. Always end with a clear call to action using the booking link provided.',
    '{"alltime":{"emails_sent":2183,"replies":54,"reply_rate":2.47,"bounces":31,"bounce_rate":1.42,"opt_outs":8},"month":{"emails_sent":1247,"replies":31,"reply_rate":2.49,"bounces":17,"bounce_rate":1.36,"opt_outs":4},"week":{"emails_sent":298,"replies":7,"reply_rate":2.35,"bounces":4,"bounce_rate":1.34,"opt_outs":1}}'::jsonb,
    '2026-03-01 10:00:00+00'
  ) RETURNING id INTO v_id;

  -- ── Lead 1: Emma Richardson ──────────────────────────────────
  -- Shopify boutique owner. Doing books herself, immediately interested.
  INSERT INTO hot_leads (client_id, lead_name, lead_company, lead_email, status, booking_link, campaign_id, email_body, created_at, conversation)
  VALUES (
    v_id, 'Emma Richardson', 'Bloom & Thread Co.', 'emma@bloomthread.com',
    'followed_up', 'https://cal.com/clearledger/discovery', 'DEMO', null,
    '2026-04-28 14:32:00+00',
    $json${
      "messages": [
        {
          "id": 0,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "body": "Hi Emma, quick question — are you still managing your own books for Bloom & Thread Co., or do you have someone handling that?\n\nWe work exclusively with Shopify and e-commerce brands to take bookkeeping completely off their plate — monthly reconciliations, inventory COGS tracking, sales tax prep, and clean P&Ls your accountant will actually love.\n\nMost of our clients save 8-12 hours a month and finally know exactly what their margins are by product.\n\nWorth a 20-minute call to see if we'd be a fit?\n\n— Sarah Mitchell, ClearLedger Bookkeeping",
          "time": "2026-04-28T09:00:00.000Z"
        },
        {
          "id": 1,
          "type": "inbound",
          "sender": "Emma Richardson",
          "body": "Hi Sarah! Yes actually I'm doing it all myself in QuickBooks and it's a nightmare haha. I would definitely be interested in chatting. What does your calendar look like?",
          "time": "2026-04-28T14:32:00.000Z"
        },
        {
          "id": 2,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Hi Emma! So glad this landed at the right time — you're definitely not alone, most Shopify founders we work with were in the exact same spot before they found us.\n\nHere's my calendar link to grab a 20-minute call: https://cal.com/clearledger/discovery\n\nLooking forward to it!\n— Sarah",
          "time": "2026-04-28T14:33:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  -- ── Lead 2: Marcus Webb ──────────────────────────────────────
  -- Multi-location hardware retail. Initially hostile, AI turned him around.
  INSERT INTO hot_leads (client_id, lead_name, lead_company, lead_email, status, booking_link, campaign_id, email_body, created_at, conversation)
  VALUES (
    v_id, 'Marcus Webb', 'Webb''s Hardware Supply', 'marcus@webbshardware.com',
    'followed_up', 'https://cal.com/clearledger/discovery', 'DEMO', null,
    '2026-04-22 16:47:00+00',
    $json${
      "messages": [
        {
          "id": 0,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "body": "Hi Marcus, noticed Webb's Hardware has multiple locations across the valley — multi-location retail is one of our specialties at ClearLedger.\n\nWe handle the bookkeeping so you're not stuck reconciling 3 different POS systems at the end of every month. Clean financials across all locations, inventory reconciliation, and P&Ls by location so you know which store is actually making money.\n\nWorth a 20-minute call?\n\n— Sarah Mitchell, ClearLedger",
          "time": "2026-04-22T09:00:00.000Z"
        },
        {
          "id": 1,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "How did you get my email? I get a lot of these pitches and they're usually a complete waste of time. Not interested.",
          "time": "2026-04-22T11:14:00.000Z"
        },
        {
          "id": 2,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Totally fair, Marcus — I respect the directness. Found your email through public business listings. No pressure at all.\n\nI'll just say this: most multi-location retail owners we work with said the same thing before their first call, and almost every one of them said it was the most useful 20 minutes they spent that quarter. We're not generalists — everything we do is built around retail operations specifically.\n\nIf that ever becomes relevant, my calendar is here: https://cal.com/clearledger/discovery\n\nEither way, I won't bother you again. — Sarah",
          "time": "2026-04-22T11:15:00.000Z"
        },
        {
          "id": 3,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "Alright, fair enough. I'll give you 20 minutes. Send me the link.",
          "time": "2026-04-22T16:47:00.000Z"
        },
        {
          "id": 4,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Really appreciate it, Marcus. Here it is: https://cal.com/clearledger/discovery\n\nTalk soon. — Sarah",
          "time": "2026-04-22T16:48:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  -- ── Lead 3: Jennifer Park ────────────────────────────────────
  -- DTC skincare brand. Asked a ton of questions before booking.
  INSERT INTO hot_leads (client_id, lead_name, lead_company, lead_email, status, booking_link, campaign_id, email_body, created_at, conversation)
  VALUES (
    v_id, 'Jennifer Park', 'Glow Republic', 'jennifer@glowrepublic.co',
    'followed_up', 'https://cal.com/clearledger/discovery', 'DEMO', null,
    '2026-04-18 13:55:00+00',
    $json${
      "messages": [
        {
          "id": 0,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "body": "Hi Jennifer, love what you're building with Glow Republic — DTC skincare is one of the more complex bookkeeping setups because of returns, COGS variability, and multi-channel revenue.\n\nWe specialize in exactly this. Clean monthly books, margin tracking by SKU, and sales tax compliance across every state you're shipping to.\n\nWorth a quick call?\n\n— Sarah Mitchell, ClearLedger",
          "time": "2026-04-18T09:00:00.000Z"
        },
        {
          "id": 1,
          "type": "inbound",
          "sender": "Jennifer Park",
          "body": "Hi Sarah, this is interesting. Can you tell me more about what's actually included? Do you handle the filing too, or just the bookkeeping? And what does pricing look like?",
          "time": "2026-04-18T10:22:00.000Z"
        },
        {
          "id": 2,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Great questions, Jennifer. Here's the breakdown:\n\nWhat's included: full monthly bookkeeping — bank reconciliations, categorization, COGS tracking by SKU, and clean P&Ls every month. We also track sales tax across states so you stay compliant as you scale.\n\nFiling: we handle sales tax filing. For income tax returns, we partner with CPAs and hand off spotless books so their job is fast (and cheaper for you).\n\nPricing: we customize based on transaction volume and complexity — the best way to get an accurate number is a quick 20-minute call.\n\nWant to grab time? https://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-18T10:23:00.000Z"
        },
        {
          "id": 3,
          "type": "inbound",
          "sender": "Jennifer Park",
          "body": "That sounds solid. One more question — do you have experience with brands our size? We're doing about $40k/month in revenue right now.",
          "time": "2026-04-18T12:41:00.000Z"
        },
        {
          "id": 4,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Absolutely — $40k/month is actually our sweet spot. Most of our DTC clients are in the $30k–$150k/month range, and we have the workflow dialed in for exactly that stage of growth.\n\nAt that volume, clean books can uncover $3–5k in missed deductions or margin leaks per quarter. Grab a spot and we can walk through exactly what that would look like for Glow Republic: https://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-18T12:42:00.000Z"
        },
        {
          "id": 5,
          "type": "inbound",
          "sender": "Jennifer Park",
          "body": "Okay, I'm sold. Booking now.",
          "time": "2026-04-18T13:55:00.000Z"
        },
        {
          "id": 6,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Love it — looking forward to connecting, Jennifer! See you on the call. — Sarah",
          "time": "2026-04-18T13:56:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  -- ── Lead 4: Daniel Russo ─────────────────────────────────────
  -- Amazon FBA seller. Price-sensitive, needed ROI justification.
  INSERT INTO hot_leads (client_id, lead_name, lead_company, lead_email, status, booking_link, campaign_id, email_body, created_at, conversation)
  VALUES (
    v_id, 'Daniel Russo', 'Russo Wholesale Group', 'daniel@russogroup.com',
    'followed_up', 'https://cal.com/clearledger/discovery', 'DEMO', null,
    '2026-04-10 15:03:00+00',
    $json${
      "messages": [
        {
          "id": 0,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "body": "Hi Daniel, just following up on my note from last week — wanted to make sure this didn't get buried.\n\nQuick version: we handle bookkeeping specifically for Amazon FBA sellers — COGS tracking, reimbursement reconciliation, fee breakdowns, and clean monthly P&Ls so you know your actual net margins by ASIN.\n\nWorth 20 minutes?\n\n— Sarah Mitchell, ClearLedger",
          "time": "2026-04-10T09:00:00.000Z"
        },
        {
          "id": 1,
          "type": "inbound",
          "sender": "Daniel Russo",
          "body": "What does something like this actually cost? I already pay an accountant at the end of the year and I'm not looking to add more overhead.",
          "time": "2026-04-10T11:30:00.000Z"
        },
        {
          "id": 2,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Fair question, Daniel. Our monthly bookkeeping is separate from year-end tax prep — think of us as the people who keep your books clean all year so your accountant's job takes 2 hours instead of 20, which usually saves you more on their fees than we cost.\n\nFor most FBA sellers at a similar size, our fee falls between $400–$800/month depending on SKU count and transaction volume.\n\nThe ROI case: most sellers find $1,200–$2,000+ per year in missed reimbursements and COGS errors in just the first month of working with us.\n\nWorth a 20-minute call to run the numbers for your account? https://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-10T11:31:00.000Z"
        },
        {
          "id": 3,
          "type": "inbound",
          "sender": "Daniel Russo",
          "body": "Okay that actually makes sense. I'll take a look at the calendar.",
          "time": "2026-04-10T15:03:00.000Z"
        },
        {
          "id": 4,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Perfect — here it is: https://cal.com/clearledger/discovery\n\nTalk soon! — Sarah",
          "time": "2026-04-10T15:04:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  -- ── Lead 5: Aisha Thompson ───────────────────────────────────
  -- Online fashion boutique. Enthusiastic, booked in two messages.
  INSERT INTO hot_leads (client_id, lead_name, lead_company, lead_email, status, booking_link, campaign_id, email_body, created_at, conversation)
  VALUES (
    v_id, 'Aisha Thompson', 'Luxe by Aisha', 'aisha@luxebyaisha.com',
    'followed_up', 'https://cal.com/clearledger/discovery', 'DEMO', null,
    '2026-04-05 10:11:00+00',
    $json${
      "messages": [
        {
          "id": 0,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "body": "Hi Aisha, Luxe by Aisha is gorgeous — congrats on building something so elevated.\n\nQuick question: do you have someone handling the bookkeeping side, or is that still on your plate?\n\nWe work with online fashion brands specifically — returns management, inventory COGS, seasonal cash flow planning. The financial side, so you can stay focused on the creative side.\n\n20-minute call?\n\n— Sarah Mitchell, ClearLedger",
          "time": "2026-04-05T09:00:00.000Z"
        },
        {
          "id": 1,
          "type": "inbound",
          "sender": "Aisha Thompson",
          "body": "Oh my gosh I needed this email today. Yes I am DROWNING in my books right now. Please yes. What's your availability?",
          "time": "2026-04-05T09:48:00.000Z"
        },
        {
          "id": 2,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Haha I love that — let's fix this immediately! Here's my booking link: https://cal.com/clearledger/discovery\n\nSo excited to chat, Aisha! — Sarah",
          "time": "2026-04-05T09:49:00.000Z"
        },
        {
          "id": 3,
          "type": "inbound",
          "sender": "Aisha Thompson",
          "body": "Just booked! See you then!",
          "time": "2026-04-05T10:11:00.000Z"
        },
        {
          "id": 4,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Amazing — confirmed! You're going to love having this off your plate. See you on the call. — Sarah",
          "time": "2026-04-05T10:12:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  -- ── Lead 6: Tyler Brooks ─────────────────────────────────────
  -- Multi-location retail. Burned before, cautious, still on the fence.
  INSERT INTO hot_leads (client_id, lead_name, lead_company, lead_email, status, booking_link, campaign_id, email_body, created_at, conversation)
  VALUES (
    v_id, 'Tyler Brooks', 'Brooks Retail Partners', 'tyler@brooksretail.com',
    'active', 'https://cal.com/clearledger/discovery', 'DEMO', null,
    '2026-04-29 09:20:00+00',
    $json${
      "messages": [
        {
          "id": 0,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "body": "Hi Tyler, running multiple retail locations means your books are probably 3x more complex than a single-store operation — separate P&Ls, inter-location inventory, and consolidating everything at month-end.\n\nWe handle all of that. Clean books per location, consolidated financials for the whole operation, no more month-end chaos.\n\nWorth a quick 20-minute call?\n\n— Sarah Mitchell, ClearLedger",
          "time": "2026-04-29T09:00:00.000Z"
        },
        {
          "id": 1,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "We've actually tried outsourcing our books before and it didn't work out at all. What makes you any different from the last firm we used?",
          "time": "2026-04-29T09:20:00.000Z"
        },
        {
          "id": 2,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "That's a completely fair concern Tyler, and honestly it's one we hear a lot. When outsourced bookkeeping fails it almost always comes down to one of three things: the bookkeeper didn't understand retail operations, communication was slow, or the handoff process was messy.\n\nHere's what's different with us: retail and e-commerce is all we do, so there's no learning curve on your business model. You get a dedicated point of contact, monthly reporting on a fixed schedule, and we work inside the systems you already use.\n\nI don't want to oversell it over email — a 20-minute call would let me show you exactly how we'd handle your setup: https://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-29T09:21:00.000Z"
        },
        {
          "id": 3,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "Maybe. I'll think about it. I might have more questions before I commit to anything.",
          "time": "2026-04-29T11:08:00.000Z"
        },
        {
          "id": 4,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Of course — no pressure at all. What questions do you have? Happy to answer anything here first, and if it makes sense after that we can set up a quick call. Either way works for me. — Sarah",
          "time": "2026-04-29T11:09:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  -- ── Lead 7: Rachel Kim ───────────────────────────────────────
  -- DTC pet supply brand. Had a bad experience with a past bookkeeper, cautious but booked.
  INSERT INTO hot_leads (client_id, lead_name, lead_company, lead_email, status, booking_link, campaign_id, email_body, created_at, conversation)
  VALUES (
    v_id, 'Rachel Kim', 'PawVault Supplies', 'rachel@pawvault.com',
    'followed_up', 'https://cal.com/clearledger/discovery', 'DEMO', null,
    '2026-03-28 14:19:00+00',
    $json${
      "messages": [
        {
          "id": 0,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "body": "Hi Rachel, PawVault is doing impressive things in a competitive space — DTC pet supply runs on tight margins, which makes clean bookkeeping more important than most categories.\n\nWe work with DTC brands on monthly reconciliations, COGS tracking, and real-time margin visibility. Most founders we work with had no idea what their actual profitability was until month one with us.\n\nWorth a 20-minute call?\n\n— Sarah Mitchell, ClearLedger",
          "time": "2026-03-28T09:00:00.000Z"
        },
        {
          "id": 1,
          "type": "inbound",
          "sender": "Rachel Kim",
          "body": "Honestly I had a really bad experience with a bookkeeper last year. They made a complete mess of our books and we ended up owing back taxes because of their errors. I'm very hesitant to trust another outside service at this point.",
          "time": "2026-03-28T11:44:00.000Z"
        },
        {
          "id": 2,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Rachel, I really appreciate you sharing that — and I'm genuinely sorry it happened. It unfortunately occurs more than it should when bookkeepers aren't specialized in the right type of business.\n\nHere's what I can tell you: everything we produce goes through a monthly close checklist, and we offer a free diagnostic call where we look at your current books before you commit to anything. If something looks off, we tell you upfront — no surprises.\n\nGiven what you went through, I'd suggest starting with just the diagnostic. No pitch, no pressure — just an honest look at where things stand. If we're not the right fit, I'll tell you that too.\n\nhttps://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-03-28T11:45:00.000Z"
        },
        {
          "id": 3,
          "type": "inbound",
          "sender": "Rachel Kim",
          "body": "A diagnostic call actually sounds a lot safer than just jumping in blind. Okay, I'll book it.",
          "time": "2026-03-28T14:19:00.000Z"
        },
        {
          "id": 4,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Really glad to hear it, Rachel. That's exactly the right approach — let's make sure we're genuinely the right fit before anything else. Looking forward to connecting. — Sarah",
          "time": "2026-03-28T14:20:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  RAISE NOTICE 'Demo client inserted with ID: %', v_id;

END $$;
