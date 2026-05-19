-- ClinicOS / Investor Waitlist Signups
-- Captures leads from clinicos.ai landing pages (clinic-side + investor-side)
-- Run in Supabase: https://supabase.com/dashboard/project/pcbqkyvrkbmlmtmporsg/sql/new

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text,
  clinic_name  text,
  phone        text,
  source       text NOT NULL CHECK (source IN ('clinicos', 'investor', 'demo_request', 'waitlist', 'investor_deck_request')),
  user_agent   text,
  ip_hash      text,
  referrer     text,
  notes        text,
  processed    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_signups_created_at_idx ON waitlist_signups (created_at DESC);
CREATE INDEX IF NOT EXISTS waitlist_signups_source_idx     ON waitlist_signups (source);
CREATE INDEX IF NOT EXISTS waitlist_signups_processed_idx  ON waitlist_signups (processed) WHERE processed = false;

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (landing pages use anon key)
DROP POLICY IF EXISTS "anon_insert_waitlist" ON waitlist_signups;
CREATE POLICY "anon_insert_waitlist"
  ON waitlist_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (dashboard) can read / update
DROP POLICY IF EXISTS "auth_read_waitlist" ON waitlist_signups;
CREATE POLICY "auth_read_waitlist"
  ON waitlist_signups
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_update_waitlist" ON waitlist_signups;
CREATE POLICY "auth_update_waitlist"
  ON waitlist_signups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
