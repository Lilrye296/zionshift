-- ============================================================
-- ZionShift Demo Conversations — 100% Realistic Rewrite
-- Paste and run this entire script in Supabase → SQL Editor
-- ============================================================

DO $$
DECLARE
  v_client_id UUID;
BEGIN

  SELECT id INTO v_client_id FROM clients WHERE email = 'sarah.demo@clearledger.com' LIMIT 1;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Demo client not found. Run seed-demo.sql first.';
  END IF;

  -- ══════════════════════════════════════════════════════════════
  -- Lead 1: Emma Richardson — Bloom & Thread Co.
  -- QUICK WIN. Shopify boutique. Replies same afternoon,
  -- clearly on her phone. Books within 30 minutes.
  -- ══════════════════════════════════════════════════════════════
  UPDATE hot_leads
  SET
    lead_company = 'Bloom & Thread Co.',
    lead_email   = 'emma@bloomthread.com',
    status       = 'followed_up',
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


  -- ══════════════════════════════════════════════════════════════
  -- Lead 2: Aisha Thompson — Aura Wellness Studio
  -- QUICK WIN. Refinery29 blew up her orders, bookkeeper quit.
  -- Frantic energy. Books in under 20 minutes.
  -- ══════════════════════════════════════════════════════════════
  UPDATE hot_leads
  SET
    lead_company = 'Aura Wellness Studio',
    lead_email   = 'aisha@aurawellness.com',
    status       = 'followed_up',
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


  -- ══════════════════════════════════════════════════════════════
  -- Lead 3: Jennifer Park — Glow Republic
  -- GHOST. Thoughtful, asks good questions over 3 days.
  -- AI drops link. Jennifer never responds. Complete silence.
  -- ══════════════════════════════════════════════════════════════
  UPDATE hot_leads
  SET
    lead_company = 'Glow Republic',
    lead_email   = 'jennifer@glowrepublic.co',
    status       = 'active',
    conversation = $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "bookkeeping for DTC skincare brands",
          "body": "Hi Jennifer, I work with a number of DTC skincare brands and Glow Republic caught my attention.\n\nBookkeeping gets complicated fast in your space — returns, COGS variability, multi-state sales tax. We handle all of that specifically for product brands.\n\nWould a 20-minute call make sense?\n\nSarah Mitchell\nClearLedger Bookkeeping",
          "time": "2026-04-14T09:00:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Jennifer Park",
          "body": "Hi Sarah, this is interesting timing actually. Few questions before I agree to a call:\n\n- Do you work in Xero? We're not switching software\n- Is it just bookkeeping or do you handle sales tax filing too\n- Rough pricing range?\n\nWant to make sure it's worth the time before I put it on my calendar",
          "time": "2026-04-14T14:33:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Happy to answer all three Jennifer:\n\nYes we work in Xero, no migration needed on your end at all.\n\nBookkeeping only — we don't file taxes. What we do is keep your books clean enough that your CPA's job is fast and straightforward at year end. If you ever need a CPA referral I have a couple I trust.\n\nPricing is a flat monthly retainer. For a DTC brand at your stage, typically somewhere in the $600-$1,000 range — I can give you an exact number on a call once I understand your transaction volume.\n\nDoes that help?\n— Sarah",
          "time": "2026-04-14T14:51:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Jennifer Park",
          "body": "Yeah that helps, that range works. One more — is it month to month or do you lock people into a contract? Had a bad experience with that before",
          "time": "2026-04-15T10:14:00.000Z"
        },
        {
          "id": 5,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Month to month after the first 3 months. The initial period is just onboarding and cleanup — after that it's 30 days notice to cancel anytime, no penalty.\n\nUnderstand the hesitation, that's a really common concern and honestly I think it's the right question to ask before committing to anything.\n\n— Sarah",
          "time": "2026-04-15T10:22:00.000Z"
        },
        {
          "id": 6,
          "type": "inbound",
          "sender": "Jennifer Park",
          "body": "Okay that all sounds reasonable. I think I'm ready to at least get on a call and learn more",
          "time": "2026-04-16T09:47:00.000Z"
        },
        {
          "id": 7,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Great, looking forward to it Jennifer. Here's my calendar:\nhttps://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-16T09:52:00.000Z"
        }
      ]
    }$json$::jsonb
  WHERE client_id = v_client_id AND lead_name = 'Jennifer Park';


  -- ══════════════════════════════════════════════════════════════
  -- Lead 4: Daniel Russo — Russo Kitchen Collective
  -- SHUTDOWN. Short direct replies. AI drops link with price.
  -- Daniel sleeps on it, comes back next morning and says no.
  -- AI is suppressed — no reply after his rejection.
  -- ══════════════════════════════════════════════════════════════
  UPDATE hot_leads
  SET
    lead_company = 'Russo Kitchen Collective',
    lead_email   = 'daniel@russokitchen.com',
    status       = 'active',
    conversation = $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "Amazon FBA bookkeeping — quick question",
          "body": "Hi Daniel, came across Russo Kitchen Collective on Amazon — strong reviews on the cookware line.\n\nQuick question: does your bookkeeper work directly from your Amazon disbursement reports or just reconcile your bank statements? Most FBA sellers don't realize how much gets miscategorized when you only go off bank statements.\n\nHappy to explain on a 20-minute call if that's worth your time.\n\nSarah Mitchell\nClearLedger Bookkeeping",
          "time": "2026-04-17T08:55:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Daniel Russo",
          "body": "I already have a bookkeeper. She reconciles the bank statements. What exactly would be different",
          "time": "2026-04-17T11:32:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "The difference is where the data comes from. Amazon deposits to your bank are already net of FBA fees, referral fees, refunds, reimbursements, and storage charges all bundled together. If your bookkeeper records that deposit as revenue you're understating income and missing expense categories.\n\nWe pull directly from Seller Central disbursement reports and break every line item out properly. It also means we catch Amazon reimbursements they owe you that most sellers never even know are missing — that alone usually adds up.\n\n— Sarah",
          "time": "2026-04-17T11:44:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Daniel Russo",
          "body": "okay that makes sense. what does it cost",
          "time": "2026-04-17T14:18:00.000Z"
        },
        {
          "id": 5,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "For a single-channel FBA seller typically $500-$800 a month depending on SKU count and volume. I know that's more than a general bookkeeper charges, but most of our Amazon clients recover more than our fee in the first quarter just from corrected tax liability and reimbursements they weren't tracking.\n\nEasiest way to know if the math works for your specific account is a 20-minute call — I can look at your setup and give you a real number.\n\nhttps://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-17T14:26:00.000Z"
        },
        {
          "id": 6,
          "type": "inbound",
          "sender": "Daniel Russo",
          "body": "appreciate the explanation but that's more than I'm paying now and I'm not convinced the switch is worth it right now. we're trying to keep costs tight heading into summer. maybe down the line",
          "time": "2026-04-18T08:41:00.000Z"
        }
      ]
    }$json$::jsonb
  WHERE client_id = v_client_id AND lead_name = 'Daniel Russo';


  -- ══════════════════════════════════════════════════════════════
  -- Lead 5: Rachel Kim — Nova Supply Co.
  -- DELAYED CLOSE. Burned before ($14k overstated revenue).
  -- Careful, deliberate replies. Goes quiet after getting link.
  -- Books 4 days later, still nervous. Realistic friction close.
  -- ══════════════════════════════════════════════════════════════
  UPDATE hot_leads
  SET
    lead_company = 'Nova Supply Co.',
    lead_email   = 'rachel@novasupplyco.com',
    status       = 'followed_up',
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


  -- ══════════════════════════════════════════════════════════════
  -- Lead 6: Marcus Webb — Webb's Hardware Supply
  -- HOSTILE THEN CONVERTS. Terse early messages, warms up
  -- after AI mentions the Mesa permit. Classic skeptic arc.
  -- Short gruff messages throughout. Books on msg 14.
  -- ══════════════════════════════════════════════════════════════
  UPDATE hot_leads
  SET
    lead_company = 'Webb''s Hardware Supply',
    lead_email   = 'marcus@webbshardware.com',
    status       = 'followed_up',
    conversation = $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "Webb's Hardware — multi-location bookkeeping",
          "body": "Hi Marcus, noticed Webb's Hardware is expanding to Mesa — three locations is a different operational challenge than two.\n\nMost multi-location retailers we work with had no real picture of which store was actually profitable until they got the books properly separated by location. We specialize in exactly that.\n\nWorth a quick 20-minute call?\n\nSarah Mitchell\nClearLedger Bookkeeping",
          "time": "2026-04-08T08:57:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "how did you get this email",
          "time": "2026-04-08T10:33:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "It's listed publicly on the Webb's Hardware contact page. I was researching multi-location retail businesses in the area before reaching out.\n\nApologies if it came off as intrusive — just say the word and I won't contact you again.\n\n— Sarah",
          "time": "2026-04-08T10:41:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "I get like 15-20 of these a week. not interested",
          "time": "2026-04-08T11:02:00.000Z"
        },
        {
          "id": 5,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Fair enough, I won't keep pushing. Just leaving this one thought: three-location retail bookkeeping is genuinely one of the harder things to do right, and most generalist bookkeepers combine everything into one set of books. When that happens you lose the ability to see which location is actually performing and which one isn't.\n\nIf that ever becomes a headache — especially with the Mesa opening coming — feel free to reach out. Won't email again.\n\n— Sarah",
          "time": "2026-04-08T11:09:00.000Z"
        },
        {
          "id": 6,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "wait how do you know about Mesa",
          "time": "2026-04-08T11:52:00.000Z"
        },
        {
          "id": 7,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Building permit filing — it's public record. I check before I reach out to anyone, I don't like sending cold emails blind.\n\nFor what it's worth that expansion is exactly the moment when getting the books set up right actually matters. Once you're at three locations you really need per-location P&Ls to understand the full picture — which store is carrying the others, where the margin actually lives.\n\n— Sarah",
          "time": "2026-04-08T12:04:00.000Z"
        },
        {
          "id": 8,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "okay I'll give you that, not many people do their homework. my current bookkeeper does lump everything together. never had a real breakdown by store",
          "time": "2026-04-09T08:22:00.000Z"
        },
        {
          "id": 9,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "That's the most common thing we fix for retailers in your situation. When everything is combined you can't see where a problem is developing until it's already serious.\n\nWe set up location-level tracking inside your existing accounting software — revenue, COGS, payroll, expenses all broken out by store. You'd always know exactly which location is doing what.\n\nWould a quick call make sense?\n\n— Sarah",
          "time": "2026-04-09T08:35:00.000Z"
        },
        {
          "id": 10,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "what does it cost. currently paying $400/mo",
          "time": "2026-04-09T09:14:00.000Z"
        },
        {
          "id": 11,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "More than $400 for three locations with proper per-location tracking — that's just the reality of what's involved.\n\nBut here's the thing worth thinking about: if one of your three stores is losing money and you don't know it, you're covering that loss with profit from the other two and it's invisible to you. That's almost certainly costing more than the difference in what you'd pay us.\n\nI'd rather give you an exact number on a call once I know more about your volume.\n\n— Sarah",
          "time": "2026-04-09T09:28:00.000Z"
        },
        {
          "id": 12,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "honestly that last part hit. I've suspected Gilbert is dragging us down for about a year. my bookkeeper can't tell me one way or the other",
          "time": "2026-04-10T09:48:00.000Z"
        },
        {
          "id": 13,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "You should be able to answer that question right now. A year is a long time to run blind on something that could be costing you real money.\n\nHere's my calendar, pick any 20 minutes and let's figure it out:\nhttps://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-10T10:05:00.000Z"
        },
        {
          "id": 14,
          "type": "inbound",
          "sender": "Marcus Webb",
          "body": "booked. friday 9am. don't waste my time",
          "time": "2026-04-10T14:31:00.000Z"
        }
      ]
    }$json$::jsonb
  WHERE client_id = v_client_id AND lead_name = 'Marcus Webb';


  -- ══════════════════════════════════════════════════════════════
  -- Lead 7: Tyler Brooks — Summit Outdoor Gear
  -- STALLER. Genuinely interested but partner always blocks it.
  -- Buying trips, delays, one-pager requests. AI drops link once.
  -- Tyler promises to talk to his partner. Never heard from again.
  -- ══════════════════════════════════════════════════════════════
  UPDATE hot_leads
  SET
    lead_company = 'Summit Outdoor Gear',
    lead_email   = 'tyler@summitoutdoor.com',
    status       = 'active',
    conversation = $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "bookkeeping question for Summit Outdoor",
          "body": "Hi Tyler, love what you've put together with Summit Outdoor Gear in Scottsdale.\n\nWe do bookkeeping specifically for specialty retailers and a lot of store owners at your stage are either handling it themselves or working with someone who doesn't really understand retail operations.\n\nWould a 20-minute call make sense?\n\nSarah Mitchell\nClearLedger Bookkeeping",
          "time": "2026-04-05T09:08:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "Hey Sarah, honestly our bookkeeping situation is kind of a disaster right now. My business partner handles all the financial stuff and I've been meaning to loop him in on finding someone new. What does something like this typically cost?",
          "time": "2026-04-05T14:44:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "For a single retail location typically somewhere in the $500-$1,200 range depending on transaction volume and complexity. I'd need to know more about your setup before I could give you a specific number.\n\nWould it make sense to do a quick call even just with you first? You could loop your partner in on a follow-up once you have a feel for what we do.\n\n— Sarah",
          "time": "2026-04-05T14:57:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "yeah that could work, let me just check with him first and I'll get back to you this week",
          "time": "2026-04-07T08:55:00.000Z"
        },
        {
          "id": 5,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Sounds good, just following up since I hadn't heard back. Happy to work around whatever schedule makes sense — even just you on the first call if that's easier.\n\n— Sarah",
          "time": "2026-04-10T09:15:00.000Z"
        },
        {
          "id": 6,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "hey sorry for the delay. my partner was traveling all last week. he's the one who really handles budget stuff so I want him on the call before we commit to anything. can we aim for next week?",
          "time": "2026-04-10T11:22:00.000Z"
        },
        {
          "id": 7,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "No problem at all, makes sense to have the right people in the room. Just reach out when you're both free and we'll find a time.\n\n— Sarah",
          "time": "2026-04-10T11:31:00.000Z"
        },
        {
          "id": 8,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "hey Sarah, so my partner got back but we've been completely slammed with our fall buying trip, been a crazy couple weeks. could we push one more week? I promise I haven't forgotten about this",
          "time": "2026-04-15T16:17:00.000Z"
        },
        {
          "id": 9,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Of course, buying season is hectic. Just reach out when things settle down a bit.\n\n— Sarah",
          "time": "2026-04-15T16:24:00.000Z"
        },
        {
          "id": 10,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "hey so my partner wants to see something in writing before he agrees to a call. like a one pager or overview of services. is that something you have?",
          "time": "2026-04-22T10:33:00.000Z"
        },
        {
          "id": 11,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "I hear you, but honestly a generic overview wouldn't really capture what we'd actually do for Summit specifically.\n\nWhat I'd suggest instead: get both of you on a 20-minute call. I'll walk through exactly what we'd do for your setup, answer everything your partner wants to know, and give you a real number on the spot. That's going to be more useful than any PDF.\n\nHere's the link whenever you're both ready:\nhttps://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-22T10:48:00.000Z"
        },
        {
          "id": 12,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "yeah that's fair. let me talk to him tonight and I'll get something on the calendar this week, I promise I'm not blowing you off we're just really bad at pulling the trigger on stuff like this",
          "time": "2026-04-22T14:19:00.000Z"
        }
      ]
    }$json$::jsonb
  WHERE client_id = v_client_id AND lead_name = 'Tyler Brooks';

  RAISE NOTICE 'All 7 demo conversations updated successfully.';

END $$;
