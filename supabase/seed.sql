-- Schema
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0073EA',
  position INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'working_on_it',
  category TEXT,
  environment TEXT,
  stack TEXT,
  notes TEXT,
  position INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'working_on_it',
  notes TEXT,
  position INTEGER DEFAULT 0
);

-- Seed Data
-- Groups
INSERT INTO groups (id, name, color, position) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Social AI Platform',   '#0073EA', 0),
  ('22222222-0000-0000-0000-000000000002', 'M.D Clinic',           '#9D50DD', 1),
  ('33333333-0000-0000-0000-000000000003', 'Flipt A/B Testing',    '#FF7575', 2),
  ('44444444-0000-0000-0000-000000000004', 'Claude Skills Explorer','#00CA72', 3);

-- Social AI Platform items
INSERT INTO items (id, group_id, name, status, category, environment, stack, position) VALUES
  ('a1000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Video Processing Pipeline',  'active',        'Feature',      'Railway',  'FastAPI',      0),
  ('a1000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Flipt A/B Testing',          'active',        'Feature',      'Docker',   'Next.js',      1),
  ('a1000000-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'API Cost Dashboard',         'done',          'Feature',      'Vercel',   'Next.js',      2),
  ('a1000000-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Auto-scheduler (60s loop)',  'active',        'Feature',      'Railway',  'Python',       3),
  ('a1000000-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Multi-tenant Architecture',  'active',        'Architecture', 'Supabase', 'Next.js',      4),
  ('a1000000-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 'Client: Lenny (test)',        'active',        'Client',       'Vercel',   NULL,           5),
  ('a1000000-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 'Client: chapo.293',          'working_on_it', 'Client',       'Vercel',   NULL,           6);

-- Sub-items: Video Processing Pipeline
INSERT INTO sub_items (item_id, name, status, position) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'FFmpeg cutting 9:16 + logo',    'done',          0),
  ('a1000000-0000-0000-0000-000000000001', 'Whisper transcription',          'done',          1),
  ('a1000000-0000-0000-0000-000000000001', 'Claude caption generation',      'active',        2),
  ('a1000000-0000-0000-0000-000000000001', 'SRT subtitle burn-in',           'working_on_it', 3);

-- M.D Clinic items
INSERT INTO items (id, group_id, name, status, category, environment, stack, position) VALUES
  ('b2000000-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'WhatsApp AI Receptionist',      'active',        'Core Feature', 'Local',   'Node.js + Python', 0),
  ('b2000000-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'Multi-tenant (clinic_manager)', 'active',        'Architecture', 'Local',   'Python + SQLite',  1),
  ('b2000000-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000002', 'onboard_clinic.py wizard',      'active',        'Feature',      'Local',   'Python',            2),
  ('b2000000-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000002', 'Admin + Clinic Panels (HTML)',  'active',        'Feature',      'Local',   'HTML',              3),
  ('b2000000-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000002', 'Night Demo Simulator',          'active',        'Feature',      'Local',   'Python',            4),
  ('b2000000-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000002', 'Sales Engine + Proposal',       'active',        'Feature',      'Local',   'Python',            5),
  ('b2000000-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'A/B Testing (Tone + Flow)',     'active',        'Feature',      'Local',   'Python',            6),
  ('b2000000-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'Route A: Exit to Rapid Image',  'pending',       'Business',     NULL,      NULL,                7),
  ('b2000000-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'Route B: SaaS for Clinics',     'planning',      'Business',     NULL,      NULL,                8),
  ('b2000000-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', 'Cloud Deployment',              'planning',      'DevOps',       'Railway', 'Docker',            9);

-- Sub-items: WhatsApp AI Receptionist
INSERT INTO sub_items (item_id, name, status, position) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'bridge.js (whatsapp-web.js)',         'done',   0),
  ('b2000000-0000-0000-0000-000000000001', 'receptionist_engine.py',              'active', 1),
  ('b2000000-0000-0000-0000-000000000001', 'Config דינמי מה-DB (לא hardcoded)',   'done',   2),
  ('b2000000-0000-0000-0000-000000000001', 'get_clinic_by_whatsapp_number()',      'done',   3),
  ('b2000000-0000-0000-0000-000000000001', 'Farewell phrase detection',            'done',   4),
  ('b2000000-0000-0000-0000-000000000001', 'Medical escalation to doctor',         'done',   5);

-- Flipt A/B Testing items
INSERT INTO items (id, group_id, name, status, category, environment, stack, position) VALUES
  ('c3000000-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'Docker Setup',              'done',     'Infrastructure', 'Local',  'Docker',  0),
  ('c3000000-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'Social AI Integration',     'done',     'Integration',    NULL,     'Next.js', 1),
  ('c3000000-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003', 'MD Clinic Integration',     'done',     'Integration',    NULL,     'Python',  2),
  ('c3000000-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000003', 'Chi-square Analytics',      'done',     'Feature',        NULL,     'Next.js', 3),
  ('c3000000-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000003', 'Cloud Deployment',          'planning', 'DevOps',         NULL,     'Docker',  4);

-- Claude Skills Explorer items
INSERT INTO items (id, group_id, name, status, category, environment, stack, position) VALUES
  ('d4000000-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 'Skill Discovery UI',  'active', 'Core Feature', 'Vercel', 'Next.js', 0),
  ('d4000000-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000004', 'Agent System',        'active', 'Feature',      'Vercel', 'Next.js', 1),
  ('d4000000-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000004', 'Data Layer',          'active', 'Architecture', 'Vercel', 'Next.js', 2);
