-- ============================================================
-- Update demo metrics to 1.5-month realistic numbers
-- Run in Supabase → SQL Editor
-- ============================================================

UPDATE clients
SET demo_metrics = '{
  "alltime": {
    "emails_sent": 2183,
    "replies":     54,
    "reply_rate":  2.47,
    "bounces":     31,
    "bounce_rate": 1.42,
    "opt_outs":    8
  },
  "month": {
    "emails_sent": 1247,
    "replies":     31,
    "reply_rate":  2.49,
    "bounces":     17,
    "bounce_rate": 1.36,
    "opt_outs":    4
  },
  "week": {
    "emails_sent": 298,
    "replies":     7,
    "reply_rate":  2.35,
    "bounces":     4,
    "bounce_rate": 1.34,
    "opt_outs":    1
  }
}'::jsonb
WHERE email = 'sarah.demo@clearledger.com';
