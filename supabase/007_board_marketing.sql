-- ============================================================
-- 007_board_marketing.sql
-- הוספת פריטי VP Marketing לבורד AI Company OS
-- ============================================================

-- AI Company OS — עדכון פריטים (הוסף VP Marketing)
INSERT INTO items (id, group_id, name, status, category, environment, stack, position)
VALUES
  ('e5000000-0000-0000-0000-000000000010', '55555555-0000-0000-0000-000000000005', 'VP Marketing Agent',         'active',        'Agent',    'Railway', 'Python',    9),
  ('e5000000-0000-0000-0000-000000000011', '55555555-0000-0000-0000-000000000005', 'Meta Ads Integration',       'working_on_it', 'Agent',    'Railway', 'Python',    10),
  ('e5000000-0000-0000-0000-000000000012', '55555555-0000-0000-0000-000000000005', 'Google Ads Integration',     'working_on_it', 'Agent',    'Railway', 'Python',    11),
  ('e5000000-0000-0000-0000-000000000013', '55555555-0000-0000-0000-000000000005', 'TikTok Ads Integration',     'working_on_it', 'Agent',    'Railway', 'Python',    12),
  ('e5000000-0000-0000-0000-000000000014', '55555555-0000-0000-0000-000000000005', 'LinkedIn Ads Integration',   'working_on_it', 'Agent',    'Railway', 'Python',    13),
  ('e5000000-0000-0000-0000-000000000015', '55555555-0000-0000-0000-000000000005', 'Proposal Page Generator',    'active',        'Feature',  'Railway', 'Python',    14),
  ('e5000000-0000-0000-0000-000000000016', '55555555-0000-0000-0000-000000000005', 'Analytics Monitor (ROAS)',   'active',        'Feature',  'Railway', 'Python',    15),
  ('e5000000-0000-0000-0000-000000000017', '55555555-0000-0000-0000-000000000005', 'Budget Controller',          'active',        'Feature',  'Railway', 'Python',    16),
  ('e5000000-0000-0000-0000-000000000018', '55555555-0000-0000-0000-000000000005', 'Marketing DB Schema',        'done',          'Data',     'Supabase','SQL',       17)
ON CONFLICT (id) DO NOTHING;

-- Sub-items: VP Marketing Agent
INSERT INTO sub_items (item_id, name, status, position) VALUES
  ('e5000000-0000-0000-0000-000000000010', 'Project platform analyzer (Claude)',  'done',          0),
  ('e5000000-0000-0000-0000-000000000010', 'Campaign strategy builder',           'done',          1),
  ('e5000000-0000-0000-0000-000000000010', 'Approved campaign activator',         'done',          2),
  ('e5000000-0000-0000-0000-000000000010', 'Performance monitor (ROAS)',          'done',          3),
  ('e5000000-0000-0000-0000-000000000010', 'New project detector',                'done',          4);

-- Sub-items: Proposal Page Generator
INSERT INTO sub_items (item_id, name, status, position) VALUES
  ('e5000000-0000-0000-0000-000000000015', 'Claude copy generation',             'done',          0),
  ('e5000000-0000-0000-0000-000000000015', 'HTML builder (RTL Hebrew)',           'done',          1),
  ('e5000000-0000-0000-0000-000000000015', 'Green Invoice integration',           'done',          2),
  ('e5000000-0000-0000-0000-000000000015', 'Stripe integration',                  'done',          3),
  ('e5000000-0000-0000-0000-000000000015', 'Supabase storage + URL serving',      'done',          4);

-- הודעת מנכ"ל — VP Marketing הופעל
INSERT INTO agent_messages (from_agent, to_agent, subject, body, priority)
VALUES (
  'ceo',
  'gil',
  '📢 VP Marketing הופעל — חברה אוטונומית מלאה',
  E'שלום גיל,\n\nמערך השיווק האוטונומי הופעל.\n\n'
  E'מה VP Marketing יעשה אוטומטית:\n'
  E'✅ זיהוי פלטפורמות מתאימות לכל פרויקט (Claude מנתח)\n'
  E'✅ בניית אסטרטגיית קמפיין מפורטת\n'
  E'✅ ניטור ביצועים כל שעה (ROAS, CPC, המרות)\n'
  E'✅ הצעת עצירה/הגדלה לפי ביצועים\n'
  E'✅ יצירת עמודי הצעה/רכישה אוטונומית לכל פרויקט\n\n'
  E'⚠️ כל הוצאת כסף לפרסום — גיל מאשר.\n\n'
  E'צעד ראשון שצריך ממך:\n'
  E'1. פתח Meta Business Manager → צור Ad Account\n'
  E'2. הוסף META_ACCESS_TOKEN_MD_CLINIC ל-Railway\n'
  E'3. VP Marketing יזהה ויתחיל לנטר אוטומטית\n\n'
  E'— מנכ"ל, AI Company OS',
  'high'
);
