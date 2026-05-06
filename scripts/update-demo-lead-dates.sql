-- ============================================================
-- Shift Emma, Aisha, Rachel to March so hot lead counts
-- are proportional across week / month / all-time periods.
--
-- Result after running:
--   This month (April): 4 hot leads — Jennifer, Daniel, Marcus, Tyler
--   All time:           7 hot leads
--   Ratio:              ~1 per 312 emails in both periods
--
-- Run in Supabase → SQL Editor
-- ============================================================

DO $$
DECLARE
  v_client_id UUID;
BEGIN

  SELECT id INTO v_client_id FROM clients WHERE email = 'sarah.demo@clearledger.com' LIMIT 1;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Demo client not found. Run seed-demo.sql first.';
  END IF;


  -- ── Emma Richardson → March 18 ────────────────────────────────
  -- Quick win. Same-day back and forth, books within the hour.
  UPDATE hot_leads
  SET
    created_at   = '2026-03-18 14:19:00+00',
    conversation = $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "quick question about Bloom & Thread",
          "body": "Hi Emma, just came across Bloom & Thread on Shopify — the spring collection looks really good, especially the linen pieces.\n\nQuick question: are you still handling your own bookkeeping or do you have someone on that? We work specifically with Shopify brands to take that whole thing off your plate.\n\nWorth a quick 20-minute call?\n\nSarah Mitchell\nClearLedger Bookkeeping",
          "time": "2026-03-18T09:02:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Emma Richardson",
          "body": "oh my gosh yes I am still doing it myself and it is a whole mess lol. im in quickbooks and honestly i have no idea if im even doing it right. my accountant call is coming up and i am not looking forward to it\n\nid love to chat, what does your calendar look like",
          "time": "2026-03-18T14:17:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Emma haha you are definitely not alone in that — it's honestly one of the most common things we hear. The good news is it's very fixable and your accountant call will go a lot smoother once the books are clean.\n\nHere's my calendar, grab whatever time works:\nhttps://cal.com/clearledger/discovery\n\nLooking forward to it!\n— Sarah",
          "time": "2026-03-18T14:19:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Emma Richardson",
          "body": "just booked for thursday at 10! so excited to finally get this off my plate honestly",
          "time": "2026-03-18T14:44:00.000Z"
        }
      ]
    }$json$::jsonb
  WHERE client_id = v_client_id AND lead_name = 'Emma Richardson';


  -- ── Aisha Thompson → March 21 ─────────────────────────────────
  -- Frantic energy, books in under 20 minutes.
  UPDATE hot_leads
  SET
    created_at   = '2026-03-21 11:01:00+00',
    conversation = $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "congrats on the Refinery29 feature",
          "body": "Hi Aisha, saw the Refinery29 piece on Aura Wellness Studio — really well deserved.\n\nI do bookkeeping for wellness and lifestyle brands and I know from experience that a press moment like that usually means the financial side gets complicated fast. Just wanted to reach out in case the timing was right.\n\nWould a 20-minute call make sense?\n\nSarah Mitchell\nClearLedger Bookkeeping",
          "time": "2026-03-21T08:48:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Aisha Thompson",
          "body": "SARAH yes oh my god. okay so the Refinery29 thing was amazing but orders literally tripled in like 10 days and my bookkeeper quit in February and I have been doing EVERYTHING manually since then and I am drowning\n\ncan we please do this week I need help like yesterday",
          "time": "2026-03-21T10:58:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Aisha — yes absolutely this week. Honestly this is exactly the situation we're built for, tripled order volume with no bookkeeper is a lot to carry by yourself.\n\nHere's the calendar, grab the earliest slot:\nhttps://cal.com/clearledger/discovery\n\nWe'll get this sorted out.\n— Sarah",
          "time": "2026-03-21T11:01:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Aisha Thompson",
          "body": "booked wednesday at 2pm THANK YOU seriously you have no idea",
          "time": "2026-03-21T11:18:00.000Z"
        }
      ]
    }$json$::jsonb
  WHERE client_id = v_client_id AND lead_name = 'Aisha Thompson';


  -- ── Rachel Kim → March 17–23 ──────────────────────────────────
  -- Careful, deliberate. Burned before. Takes 4 days after link to book.
  UPDATE hot_leads
  SET
    created_at   = '2026-03-19 11:49:00+00',
    conversation = $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "bookkeeping for multi-channel product brands",
          "body": "Hi Rachel, I work with a number of multi-channel product businesses and Nova Supply caught my attention.\n\nA lot of brands at your stage have books that look fine on the surface but have real errors underneath — usually because their bookkeeper doesn't have specific e-commerce experience.\n\nWorth a 20-minute call to take a look?\n\nSarah Mitchell\nClearLedger Bookkeeping",
          "time": "2026-03-17T09:15:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Rachel Kim",
          "body": "I'll be upfront with you. I had a bookkeeper for 18 months and when I finally had a CPA review everything last year she found my revenue had been overstated by close to $14,000 over two years. Had to amend two tax returns.\n\nSo I'm not exactly jumping to trust another outside service with my books. What's actually different about what you do",
          "time": "2026-03-17T15:42:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Rachel I'm really sorry that happened — two amended returns is a serious situation and I completely understand why you'd be hesitant.\n\nWhat you described is almost always the same root cause: recording gross platform payouts instead of net. Shopify, Amazon, and others send a lump deposit that already has refunds, fees, and chargebacks baked in. If your bookkeeper just records that number as revenue without breaking it out, income gets overstated every single month.\n\nEvery client we work with, we reconcile to the source report — not the bank deposit. Returns get netted before revenue is ever recorded. And we send you a summary before we close the books each month so nothing is a surprise.\n\nI get that this probably sounds like everyone else says the same thing. Happy to keep answering questions here before you commit to anything.\n\n— Sarah",
          "time": "2026-03-17T15:58:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Rachel Kim",
          "body": "That is exactly what she was doing, Shopify payouts recorded as revenue with no refund adjustment.\n\nIf something is wrong with the books on your end, what happens? Is there any kind of accountability or is it just sorry we'll do better",
          "time": "2026-03-18T09:07:00.000Z"
        },
        {
          "id": 5,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Honest answer: I won't promise we're perfect because bookkeeping requires some back and forth — there are things only you can tell me, like whether a charge is personal or business.\n\nWhat I will promise is that if we make an error we fix it at no charge, we tell you exactly what happened, and we change our process so it doesn't happen again. No hiding it, no billing you to clean up our own mistake.\n\nWe're also month to month after the first three months. If the work isn't right at any point you can leave. We don't hold anyone to a contract once they're through onboarding.\n\n— Sarah",
          "time": "2026-03-18T09:21:00.000Z"
        },
        {
          "id": 6,
          "type": "inbound",
          "sender": "Rachel Kim",
          "body": "okay that's fair. one more thing — my books are kind of a mess right now. i've been doing it myself since i let my last person go and i know it's not right. is that a problem or do you need clean books to start",
          "time": "2026-03-19T10:48:00.000Z"
        },
        {
          "id": 7,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "That's actually the norm for us, not the exception. The first thing we do with every new client is go back and clean things up — three months of DIY books is completely fixable, we've started with people who had years of backlog.\n\nWe'd scope the cleanup in the first call and roll the cost into the onboarding conversation so there are no surprises.\n\n— Sarah",
          "time": "2026-03-19T11:02:00.000Z"
        },
        {
          "id": 8,
          "type": "inbound",
          "sender": "Rachel Kim",
          "body": "okay. let me think about it for a couple days",
          "time": "2026-03-19T11:44:00.000Z"
        },
        {
          "id": 9,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Of course, take your time. Here's my calendar whenever you're ready — no pressure at all:\nhttps://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-03-19T11:49:00.000Z"
        },
        {
          "id": 10,
          "type": "inbound",
          "sender": "Rachel Kim",
          "body": "okay i booked. tuesday at 3pm. still a little nervous about this if i'm being honest but i figured the worst case is i spend 20 minutes and decide it's not the right fit",
          "time": "2026-03-23T11:14:00.000Z"
        }
      ]
    }$json$::jsonb
  WHERE client_id = v_client_id AND lead_name = 'Rachel Kim';


  RAISE NOTICE 'Lead dates updated. Emma → Mar 18, Aisha → Mar 21, Rachel → Mar 17–23.';

END $$;
