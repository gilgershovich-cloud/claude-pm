-- ClinicOS Seed Round — Investor Pipeline Table
-- Used by vp_investor_relations.py

CREATE TABLE IF NOT EXISTS investor_pipeline (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'new',
  -- status values: new | contacted | deck_sent | warm | meeting_set | committed | passed
  notes        TEXT DEFAULT '',
  amount_ils   INTEGER,          -- committed/target amount in ILS
  last_contact TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_investor_pipeline_status ON investor_pipeline(status);
CREATE INDEX IF NOT EXISTS idx_investor_pipeline_last_contact ON investor_pipeline(last_contact);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_investor_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS investor_pipeline_updated_at ON investor_pipeline;
CREATE TRIGGER investor_pipeline_updated_at
  BEFORE UPDATE ON investor_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_investor_pipeline_updated_at();

-- seed agent_memory entry for IR agent state
INSERT INTO agent_memory (agent_id, key, value)
VALUES ('vp_investor_relations', 'pipeline_summary', '{"total":0,"stale":0,"warm":0,"committed":0}')
ON CONFLICT (agent_id, key) DO NOTHING;
