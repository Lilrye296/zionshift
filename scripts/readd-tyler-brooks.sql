-- ============================================================
-- Re-add Tyler Brooks to hot_leads
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

  INSERT INTO hot_leads (
    client_id, lead_name, lead_company, lead_email,
    status, booking_link, campaign_id, email_body,
    created_at, conversation
  ) VALUES (
    v_client_id,
    'Tyler Brooks',
    'Summit Outdoor Gear',
    'tyler@summitoutdoor.com',
    'active',
    'https://cal.com/clearledger/discovery',
    'DEMO',
    null,
    '2026-04-21 14:38:00+00',
    $json${
      "messages": [
        {
          "id": 1,
          "type": "outbound",
          "sender": "Initial Cold Email",
          "subject": "Summit Outdoor Gear — bookkeeping for outdoor retail",
          "body": "Hi Tyler, love what you've built with Summit Outdoor Gear in Scottsdale.\n\nWe do bookkeeping specifically for specialty retailers and a lot of store owners at your stage are either drowning in it themselves or working with someone who doesn't really get retail. Wanted to reach out in case the timing was right.\n\nWould a 20-minute call make sense?\n\nSarah Mitchell, ClearLedger Bookkeeping",
          "time": "2026-04-05T09:00:00.000Z"
        },
        {
          "id": 2,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "subject": "Re: Summit Outdoor Gear — bookkeeping for outdoor retail",
          "body": "Hi Sarah, thanks for reaching out. Yeah, our bookkeeping setup is a bit of a mess honestly. My business partner handles most of the financial stuff and I've been meaning to bring this up with him. What does something like this cost?",
          "time": "2026-04-05T14:22:00.000Z"
        },
        {
          "id": 3,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Great to hear from you, Tyler. Pricing varies based on transaction volume and complexity, typically in the range of $500-$1,200 a month for a single-location retail business. I'd want to learn a bit more about your setup before giving you a firm number.\n\nWould it make sense to hop on a quick call, even just you first, and you can loop in your partner afterward?\n\n— Sarah",
          "time": "2026-04-05T14:30:00.000Z"
        },
        {
          "id": 4,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "subject": "Re: Summit Outdoor Gear — bookkeeping for outdoor retail",
          "body": "Yeah that could work. Let me check with my partner first and I'll get back to you.",
          "time": "2026-04-06T09:00:00.000Z"
        },
        {
          "id": 5,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Sounds good, just following up in case it fell through the cracks. No rush, but if it's easier you're welcome to book a call just for yourself first and we can include your partner in a second conversation.\n\n— Sarah",
          "time": "2026-04-09T09:00:00.000Z"
        },
        {
          "id": 6,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "subject": "Re: Summit Outdoor Gear — bookkeeping for outdoor retail",
          "body": "Sorry for the delay. My partner is traveling this week. He's the one who really controls the budget decisions so I want him in the conversation. Can we push to next week?",
          "time": "2026-04-09T11:30:00.000Z"
        },
        {
          "id": 7,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Totally understand, makes sense to have the right people in the room. Next week works great. Just let me know when you're both free and we'll get something on the calendar.\n\n— Sarah",
          "time": "2026-04-09T11:38:00.000Z"
        },
        {
          "id": 8,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "subject": "Re: Summit Outdoor Gear — bookkeeping for outdoor retail",
          "body": "My partner got back but we've been slammed with a buying trip for fall inventory. Can we push to the following week? I haven't forgotten about this.",
          "time": "2026-04-14T10:00:00.000Z"
        },
        {
          "id": 9,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "Of course, buying season is no joke. The week of the 21st works great. Just shoot me a message when you're both ready.\n\n— Sarah",
          "time": "2026-04-14T10:10:00.000Z"
        },
        {
          "id": 10,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "subject": "Re: Summit Outdoor Gear — bookkeeping for outdoor retail",
          "body": "Hey Sarah, sorry again. My partner wants to see a one-pager or overview of what you offer before committing to a call. Can you send something like that?",
          "time": "2026-04-21T09:00:00.000Z"
        },
        {
          "id": 11,
          "type": "outbound",
          "sender": "AI Reply",
          "body": "I understand the ask, but honestly a generic one-pager wouldn't do it justice. What we do depends entirely on your setup.\n\nWhat I'd rather do: hop on 20 minutes with you and your partner together. I'll walk through exactly what we'd do for Summit specifically, answer all his questions live, and give you both a real price on the spot. That's going to be more useful than any document.\n\nHere's the link whenever you're both ready:\nhttps://cal.com/clearledger/discovery\n\n— Sarah",
          "time": "2026-04-21T09:15:00.000Z"
        },
        {
          "id": 12,
          "type": "inbound",
          "sender": "Tyler Brooks",
          "body": "I hear you. Let me talk to him tonight and I'll try to get something on the calendar this week. I promise I'm not blowing you off, we're just really bad at this kind of thing.",
          "time": "2026-04-21T14:30:00.000Z"
        }
      ]
    }$json$::jsonb
  );

  RAISE NOTICE 'Tyler Brooks re-added successfully.';

END $$;
