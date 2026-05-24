-- Schema for landing-page contact leads.
-- The app also creates this table automatically on first submission
-- (CREATE TABLE IF NOT EXISTS), but you can run it manually too:
--   psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text NOT NULL,
  email       text,
  event_type  text,
  message     text,
  locale      text,
  source      text NOT NULL DEFAULT 'landing',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
