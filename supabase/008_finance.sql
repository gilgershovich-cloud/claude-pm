-- Finance entries table — הוצאות + הכנסות
CREATE TABLE IF NOT EXISTS finance_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL CHECK (type IN ('expense', 'revenue')),
  amount_ils   DECIMAL(10,2) NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT DEFAULT 'other',  -- api_usage | infrastructure | sales | marketing | other
  project      TEXT,                  -- social_ai | md_clinic | claude_pm | general
  source       TEXT DEFAULT 'manual', -- manual | api | green_invoice | railway | vercel
  reference_id TEXT,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  created_by   TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS finance_entries_date ON finance_entries(date DESC);
CREATE INDEX IF NOT EXISTS finance_entries_type ON finance_entries(type);

-- Seed: ידועי הוצאות תשתית (מאי 2026)
INSERT INTO finance_entries (type, amount_ils, description, category, project, source, date, created_by) VALUES
  ('expense', 37,   'Railway Pro — Social AI Platform',    'infrastructure', 'social_ai',  'railway',  '2026-05-01', 'vp_finance'),
  ('expense', 75,   'Vercel Pro subscription',             'infrastructure', 'general',    'vercel',   '2026-05-01', 'vp_finance'),
  ('expense', 0,    'Supabase — Free tier',                'infrastructure', 'general',    'manual',   '2026-05-01', 'vp_finance'),
  ('expense', 12,   'Anthropic API — claude-pm agents',    'api_usage',      'claude_pm',  'manual',   '2026-05-01', 'vp_finance');
