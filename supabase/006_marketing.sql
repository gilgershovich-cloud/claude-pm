-- ============================================================
-- 006_marketing.sql — VP Marketing infrastructure
-- הרץ ב-Supabase SQL Editor של claude-pm
-- ============================================================

-- הגדרת שיווק לכל פרויקט
CREATE TABLE IF NOT EXISTS project_marketing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  needs_marketing BOOLEAN DEFAULT FALSE,
  goal TEXT,                        -- "הבא 50 לקוחות לקליניקה" / "sign-ups ל-SaaS"
  target_audience TEXT,             -- תיאור קהל היעד
  monthly_budget_ils INT DEFAULT 0, -- תקציב חודשי כולל (₪)
  platforms JSONB DEFAULT '[]',     -- ["meta","google","tiktok","linkedin"]
  approved_by_gil BOOLEAN DEFAULT FALSE,
  claude_strategy TEXT,             -- האסטרטגיה שClaude יצר
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id)
);

-- חשבונות רשתות חברתיות per project per platform
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta','google','tiktok','linkedin','instagram','youtube')),
  account_type TEXT NOT NULL,       -- 'ad_account' / 'page' / 'business' / 'profile'
  account_id TEXT NOT NULL,
  account_name TEXT,
  env_token_key TEXT NOT NULL,      -- שם env var ב-Railway: META_ACCESS_TOKEN_MD_CLINIC
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','needs_reconnect','pending')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ,
  UNIQUE (group_id, platform, account_type)
);

-- קמפיינים פעילים
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  campaign_id_external TEXT,        -- ID ב-Meta/Google/TikTok
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN (
    'pending_approval', 'active', 'paused', 'ended', 'draft'
  )),
  objective TEXT,                   -- 'conversions' / 'traffic' / 'awareness' / 'leads'
  daily_budget_ils INT DEFAULT 0,
  total_spent_ils NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  approved_by_gil BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  decision_id UUID REFERENCES agent_decisions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- מדדי ביצועים — נשמר כל שעה
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions INT DEFAULT 0,
  spend_ils NUMERIC DEFAULT 0,
  roas NUMERIC,                     -- Return on Ad Spend
  cpc_ils NUMERIC,                  -- Cost Per Click
  cpm_ils NUMERIC,                  -- Cost Per 1000 Impressions
  ctr NUMERIC                       -- Click-Through Rate %
);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_time ON campaign_metrics(campaign_id, measured_at DESC);

-- עמודי הצעה שנוצרו אוטונומית
CREATE TABLE IF NOT EXISTS proposal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,        -- URL path: md-clinic / social-ai-pro
  title TEXT NOT NULL,
  html_content TEXT NOT NULL,       -- HTML מלא שClaude כתב
  payment_provider TEXT DEFAULT 'green_invoice' CHECK (payment_provider IN ('green_invoice','stripe','none')),
  price_ils INT,
  cta_text TEXT DEFAULT 'התחל עכשיו',
  published BOOLEAN DEFAULT FALSE,
  url TEXT,                         -- URL ציבורי סופי
  webhook_url TEXT,                 -- לקבלת אירועי תשלום
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- seed: הגדר marketing config לפרויקטים קיימים
INSERT INTO project_marketing_config (group_id, needs_marketing, goal, target_audience, platforms)
SELECT id, TRUE,
  CASE name
    WHEN 'M.D Clinic' THEN 'גיוס 10 קליניקות אסתטיקה משלמות'
    WHEN 'Social AI Platform' THEN 'גיוס 20 לקוחות SaaS משלמים'
    ELSE 'הגדל מודעות למוצר'
  END,
  CASE name
    WHEN 'M.D Clinic' THEN 'בעלי קליניקות אסתטיקה, רופאים, 30-55, ישראל'
    WHEN 'Social AI Platform' THEN 'בעלי עסקים קטנים עם נוכחות סושיאל, 25-45, ישראל'
    ELSE 'קהל כללי, ישראל'
  END,
  CASE name
    WHEN 'M.D Clinic' THEN '["meta","google"]'::jsonb
    WHEN 'Social AI Platform' THEN '["meta","tiktok","google"]'::jsonb
    ELSE '["meta"]'::jsonb
  END
FROM groups
WHERE name IN ('M.D Clinic', 'Social AI Platform')
ON CONFLICT (group_id) DO NOTHING;
