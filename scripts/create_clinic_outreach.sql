-- clinic_outreach: tracks M.D Clinic sales outreach to 50 clinics
-- Run once in Supabase SQL editor: https://supabase.com/dashboard/project/pcbqkyvrkbmlmtmporsg/sql

create table if not exists clinic_outreach (
  id           uuid primary key default gen_random_uuid(),
  clinic_name  text not null,
  contact_name text,
  city         text,
  channel      text default 'whatsapp',   -- whatsapp | instagram | phone
  status       text default 'pending',    -- pending | sent | replied | meeting | closed_won | closed_lost
  sent_at      timestamptz,
  replied_at   timestamptz,
  follow_up_at timestamptz,               -- when VP Sales should remind Gil
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 50 clinics seed (fill in real data)
-- insert into clinic_outreach (clinic_name, contact_name, city, channel) values
--   ('קליניקת יופי השרון', 'ד"ר כהן', 'נתניה', 'whatsapp'),
--   ('מרפאת אסתטיקה תל אביב', 'ד"ר לוי', 'תל אביב', 'instagram');
