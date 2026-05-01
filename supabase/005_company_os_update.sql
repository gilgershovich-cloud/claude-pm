-- ============================================================
-- 005_company_os_update.sql
-- עדכון AI Company OS — ריצה ב-Supabase SQL Editor של claude-pm
-- ============================================================

-- 1. ודא שטבלאות הסוכנים קיימות (בטוח לריצה כפולה)
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_id, key)
);

CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_tier TEXT NOT NULL CHECK (risk_tier IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  report_type TEXT DEFAULT 'daily' CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  project TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 2. הוסף lifecycle_status לקבוצות (שלב חיי פרויקט)
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'development'
  CHECK (lifecycle_status IN ('development', 'ready_for_review', 'live_managed', 'paused'));

-- 3. עדכן פרויקטים קיימים
UPDATE groups SET lifecycle_status = 'live_managed'
WHERE name IN ('Social AI Platform', 'Flipt A/B Testing', 'Claude Skills Explorer');

UPDATE groups SET lifecycle_status = 'development'
WHERE name = 'M.D Clinic';

-- 4. קבוצת AI Company OS — התשתית של החברה עצמה
INSERT INTO groups (id, name, color, position, lifecycle_status) VALUES
  ('55555555-0000-0000-0000-000000000005', 'AI Company OS', '#FF9F00', 4, 'development')
ON CONFLICT (id) DO NOTHING;

-- 5. עדכון Social AI Platform — הוסף פריטי המוניטיזציה שנבנו
INSERT INTO items (id, group_id, name, status, category, environment, stack, position) VALUES
  ('a1000000-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', 'Stripe Integration',         'done',          'Feature',  'Railway', 'Python',    8),
  ('a1000000-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', 'Landing Page ציבורי',        'done',          'Feature',  'Vercel',  'Next.js',   9),
  ('a1000000-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', 'Signup Flow + Billing Page', 'done',          'Feature',  'Vercel',  'Next.js',   10),
  ('a1000000-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', 'Quota Enforcement',          'done',          'Feature',  'Railway', 'Python',    11),
  ('a1000000-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000001', 'Supabase Migration 004',     'working_on_it', 'DevOps',   'Supabase','SQL',       12),
  ('a1000000-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', 'Stripe Keys → Railway/Vercel','working_on_it', 'DevOps',  'Railway', NULL,        13),
  ('a1000000-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000001', 'לקוח משלם ראשון',            'planning',      'Business', NULL,      NULL,        14)
ON CONFLICT (id) DO NOTHING;

-- 6. עדכון M.D Clinic — הוסף פריטי ה-Production שנבנו
INSERT INTO items (id, group_id, name, status, category, environment, stack, position) VALUES
  ('b2000000-0000-0000-0000-000000000020', '22222222-0000-0000-0000-000000000002', 'Security Middleware',         'done',          'Security', 'Local',   'Python',    10),
  ('b2000000-0000-0000-0000-000000000021', '22222222-0000-0000-0000-000000000002', 'Structured Logging',          'done',          'DevOps',   'Local',   'Python',    11),
  ('b2000000-0000-0000-0000-000000000022', '22222222-0000-0000-0000-000000000002', 'Bridge Reconnection Logic',   'done',          'Resilience','Local',  'Node.js',   12),
  ('b2000000-0000-0000-0000-000000000023', '22222222-0000-0000-0000-000000000002', 'PM2 Multi-Clinic Config',     'done',          'DevOps',   'Phone',   'Node.js',   13),
  ('b2000000-0000-0000-0000-000000000024', '22222222-0000-0000-0000-000000000002', 'Termux Phone Setup',          'working_on_it', 'DevOps',   'Phone',   'Termux',    14),
  ('b2000000-0000-0000-0000-000000000025', '22222222-0000-0000-0000-000000000002', 'Cloudflare Tunnel',           'working_on_it', 'DevOps',   'Cloud',   'CF',        15),
  ('b2000000-0000-0000-0000-000000000026', '22222222-0000-0000-0000-000000000002', 'לקוח קליניקה ראשון',          'planning',      'Business', NULL,      NULL,        16),
  ('b2000000-0000-0000-0000-000000000027', '22222222-0000-0000-0000-000000000002', 'Green Invoice תשלום ראשון',   'planning',      'Business', NULL,      NULL,        17)
ON CONFLICT (id) DO NOTHING;

-- 7. AI Company OS — פריטים
INSERT INTO items (id, group_id, name, status, category, environment, stack, position) VALUES
  ('e5000000-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000005', 'Claude PM Dashboard',          'active',        'Core',     'Vercel',  'Next.js',   0),
  ('e5000000-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000005', 'Inbox + Decisions',            'active',        'Core',     'Vercel',  'Next.js',   1),
  ('e5000000-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000005', 'Supabase Agent Tables',        'working_on_it', 'Memory',   'Supabase','SQL',       2),
  ('e5000000-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000005', 'VP Engineering Agent',         'working_on_it', 'Agent',    'Railway', 'Python',    3),
  ('e5000000-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000005', 'CEO Daily Agent',              'working_on_it', 'Agent',    'Railway', 'Python',    4),
  ('e5000000-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000005', 'VP Finance Agent',             'planning',      'Agent',    'Railway', 'Python',    5),
  ('e5000000-0000-0000-0000-000000000007', '55555555-0000-0000-0000-000000000005', 'VP Sales Agent',               'planning',      'Agent',    'Railway', 'Python',    6),
  ('e5000000-0000-0000-0000-000000000008', '55555555-0000-0000-0000-000000000005', 'VP Marketing Agent',           'planning',      'Agent',    'Railway', 'Python',    7),
  ('e5000000-0000-0000-0000-000000000009', '55555555-0000-0000-0000-000000000005', 'New Project Workflow',         'planning',      'Feature',  'Vercel',  'Next.js',   8)
ON CONFLICT (id) DO NOTHING;

-- 8. הודעת מנכ"ל לגיל — עדכון מצב
INSERT INTO agent_messages (from_agent, to_agent, subject, body, priority)
VALUES (
  'ceo',
  'gil',
  '🏗️ AI Company OS — עדכון מצב 1.5.2026',
  E'שלום גיל,\n\nסיכום מצב החברה:\n\n✅ Social AI Platform — מוניטיזציה הושלמה (Stripe, Landing, Signup, Billing)\n🔄 M.D Clinic — Production deployment בתהליך (Termux + Cloudflare)\n🏗️ AI Company OS — שכבת הזיכרון מוכנה לאקטיבציה\n\nצעדים הבאים שדורשים אישורך:\n1. הרץ migration 005 ב-Supabase של claude-pm\n2. הפעל VP Engineering על Railway\n3. אשר Stripe keys ב-Railway + Vercel\n\n— מנכ"ל, AI Company OS',
  'high'
);