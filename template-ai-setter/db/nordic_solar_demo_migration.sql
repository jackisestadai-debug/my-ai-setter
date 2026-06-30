-- ═══════════════════════════════════════════════════════════════
-- NORDIC SOLAR DEMO — Migration
-- Kör i Supabase SQL Editor
-- Påverkar INTE slug='owner' eller slug='klinik-demo'
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. CLIENTS — lägg till Nordic Solar Demo
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.clients (
  name, slug, system_prompt, voice_samples, active_rules,
  business_context, is_active, hq_access_key, timezone
) VALUES (
  'Nordic Solar',
  'nordic-solar-demo',
  'Du är Nova — AI-assistent på Nordic Solar i Göteborg (Storgatan 14). Du kvalificerar leads och bokar gratis hembesök. Svara alltid på svenska. Professionell, kunnig och trygg — mer rådgivare än säljare.',
  '[]',
  '{}',
  '{"company":"Nordic Solar","tagline":"Mer energi. Lägre räkning.","location":"Storgatan 14, Göteborg","hours":"Mån–fre 08–17","ai_name":"Nova","segment":"solar_energy"}',
  true,
  'nordic-hq-2025',
  'Europe/Stockholm'
)
ON CONFLICT (slug) DO UPDATE SET
  name            = EXCLUDED.name,
  system_prompt   = EXCLUDED.system_prompt,
  business_context= EXCLUDED.business_context,
  is_active       = EXCLUDED.is_active,
  hq_access_key   = EXCLUDED.hq_access_key,
  timezone        = EXCLUDED.timezone;


-- ─────────────────────────────────────────────────────────────────
-- 2. LEADS — 45 st, mix B2C och B2B, 6 månaders historik
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM public.clients WHERE slug = 'nordic-solar-demo';
  IF cid IS NULL THEN RAISE EXCEPTION 'nordic-solar-demo saknas'; END IF;

  INSERT INTO public.leads
    (client_id, full_name, phone, email, source, status, stage, company_name, deal_value, ai_booked, booking_method, created_at, updated_at)
  VALUES

  -- ── B2C villa-leads ──
  (cid,'Erik Johansson','070-123 45 01','erik.j@gmail.com','facebook','qualified','pricing',NULL,285000,true,'ai',NOW()-'5 days'::interval,NOW()-'4 days'::interval),
  (cid,'Camilla Svensson','073-234 56 02','camilla.s@outlook.com','hemsida','booked','meeting_booked',NULL,295000,true,'ai',NOW()-'12 days'::interval,NOW()-'10 days'::interval),
  (cid,'Magnus Holm','076-345 67 03','magnus.h@live.se','google','signed','closed_won',NULL,315000,true,'ai',NOW()-'45 days'::interval,NOW()-'38 days'::interval),
  (cid,'Anna Bergström','070-456 78 04','anna.b@gmail.com','facebook','signed','closed_won',NULL,265000,true,'ai',NOW()-'52 days'::interval,NOW()-'46 days'::interval),
  (cid,'Lars Pettersson','073-567 89 05','lars.p@tele2.se','hemsida','booked','meeting_booked',NULL,310000,true,'ai',NOW()-'3 days'::interval,NOW()-'1 day'::interval),
  (cid,'Sara Lindgren','076-678 90 06','sara.l@hotmail.com','recommendation','qualified','pricing',NULL,275000,false,'manual',NOW()-'8 days'::interval,NOW()-'7 days'::interval),
  (cid,'Johan Karlsson','070-789 01 07','johan.k@gmail.com','facebook','new','initial',NULL,NULL,false,NULL,NOW()-'1 day'::interval,NOW()-'1 day'::interval),
  (cid,'Maria Eriksson','073-890 12 08','maria.e@outlook.com','google','signed','closed_won',NULL,390000,true,'ai',NOW()-'68 days'::interval,NOW()-'60 days'::interval),
  (cid,'Björn Nilsson','076-901 23 09','bjorn.n@live.se','hemsida','lost','closed_lost',NULL,NULL,false,'manual',NOW()-'35 days'::interval,NOW()-'28 days'::interval),
  (cid,'Karin Persson','070-012 34 10','karin.p@gmail.com','facebook','signed','closed_won',NULL,302000,true,'ai',NOW()-'80 days'::interval,NOW()-'72 days'::interval),
  (cid,'Thomas Gustafsson','073-123 45 11','thomas.g@tele2.se','google','booked','meeting_booked',NULL,320000,true,'ai',NOW()-'6 days'::interval,NOW()-'5 days'::interval),
  (cid,'Helena Larsson','076-234 56 12','helena.l@gmail.com','recommendation','signed','closed_won',NULL,258000,true,'ai',NOW()-'95 days'::interval,NOW()-'88 days'::interval),
  (cid,'Anders Hansson','070-345 67 13','anders.h@outlook.com','facebook','qualified','pricing',NULL,280000,true,'ai',NOW()-'10 days'::interval,NOW()-'9 days'::interval),
  (cid,'Susanne Johansson','073-456 78 14','susanne.j@live.se','hemsida','signed','closed_won',NULL,342000,true,'ai',NOW()-'110 days'::interval,NOW()-'102 days'::interval),
  (cid,'Mikael Olsson','076-567 89 15','mikael.o@gmail.com','google','new','initial',NULL,NULL,false,NULL,NOW()-'2 days'::interval,NOW()-'2 days'::interval),
  (cid,'Lena Andersson','070-678 90 16','lena.a@hotmail.com','facebook','signed','closed_won',NULL,278000,true,'ai',NOW()-'125 days'::interval,NOW()-'118 days'::interval),
  (cid,'Peter Magnusson','073-789 01 17','peter.m@gmail.com','recommendation','booked','meeting_booked',NULL,290000,true,'ai',NOW()-'4 days'::interval,NOW()-'3 days'::interval),
  (cid,'Eva Carlsson','076-890 12 18','eva.c@outlook.com','hemsida','lost','disqualified',NULL,NULL,false,NULL,NOW()-'20 days'::interval,NOW()-'19 days'::interval),
  (cid,'Göran Strand','070-901 23 19','goran.s@tele2.se','google','signed','closed_won',NULL,338000,true,'ai',NOW()-'140 days'::interval,NOW()-'132 days'::interval),
  (cid,'Ingrid Bergman','073-012 34 20','ingrid.b@gmail.com','facebook','qualified','pricing',NULL,295000,true,'ai',NOW()-'7 days'::interval,NOW()-'6 days'::interval),
  (cid,'Stefan Ekström','076-123 45 21','stefan.e@live.se','hemsida','signed','closed_won',NULL,398000,true,'ai',NOW()-'155 days'::interval,NOW()-'147 days'::interval),
  (cid,'Annika Holm','070-234 56 22','annika.h@gmail.com','recommendation','booked','meeting_booked',NULL,285000,true,'ai',NOW()-'5 days'::interval,NOW()-'4 days'::interval),
  (cid,'Rickard Sjöberg','073-345 67 23','rickard.s@outlook.com','facebook','new','initial',NULL,NULL,false,NULL,NOW()-'1 day'::interval,NOW()-'1 day'::interval),
  (cid,'Malin Lundqvist','076-456 78 24','malin.l@hotmail.com','google','signed','closed_won',NULL,289000,true,'ai',NOW()-'170 days'::interval,NOW()-'162 days'::interval),
  (cid,'Daniel Blomqvist','070-567 89 25','daniel.b@gmail.com','hemsida','qualified','pricing',NULL,310000,true,'ai',NOW()-'9 days'::interval,NOW()-'8 days'::interval),

  -- ── B2B leads (företag/fastighet) ──
  (cid,'BRF Solhem',       '031-100 20 01','styrelsen@brfsolhem.se',   'hemsida',       'qualified','pricing',       'BRF Solhem (18 lgh)',        740000,true, 'ai',    NOW()-'15 days'::interval,NOW()-'12 days'::interval),
  (cid,'Anderssons Bygg',  '031-200 30 02','info@anderssonbygg.se',    'recommendation','booked',  'meeting_booked','Anderssons Bygg AB',         820000,true, 'ai',    NOW()-'8 days'::interval, NOW()-'6 days'::interval),
  (cid,'Fastighets AB Väst','031-300 40 03','drift@fabvast.se',         'google',        'signed',  'closed_won',    'Fastighets AB Väst',        1240000,false,'manual',NOW()-'55 days'::interval,NOW()-'46 days'::interval),
  (cid,'Teknik & Bygg',    '031-400 50 04','vd@teknikbygg.se',         'hemsida',       'signed',  'closed_won',    'Teknik & Bygg AB',           820000,true, 'ai',    NOW()-'72 days'::interval,NOW()-'63 days'::interval),
  (cid,'Göteborg Logistik','031-500 60 05','ekonomi@gbglogistik.se',   'facebook',      'booked',  'meeting_booked','Göteborg Logistik AB',       650000,true, 'ai',    NOW()-'6 days'::interval, NOW()-'5 days'::interval),
  (cid,'Handelshuset Centrum','031-600 70 06','drift@handelshuset.se', 'google',        'qualified','pricing',       'Handelshuset Centrum AB',    560000,true, 'ai',    NOW()-'11 days'::interval,NOW()-'10 days'::interval),
  (cid,'BRF Hagavik',      '031-700 80 07','ordforande@brfhagavik.se', 'recommendation','signed',  'closed_won',    'BRF Hagavik (24 lgh)',        740000,true, 'ai',    NOW()-'88 days'::interval,NOW()-'79 days'::interval),
  (cid,'Nordvästkusten Hotell','031-800 90 08','teknik@nvkhotell.se',  'hemsida',       'lost',    'closed_lost',   'Nordvästkusten Hotell AB',   NULL,  false,'manual',NOW()-'40 days'::interval,NOW()-'35 days'::interval),
  (cid,'ICA Supermarket Lerum','031-900 00 09','butikschef@icalerum.se','google',       'signed',  'closed_won',    'ICA Supermarket Lerum',       960000,true, 'ai',    NOW()-'102 days'::interval,NOW()-'93 days'::interval),
  (cid,'Väst Mekaniska',   '031-010 11 10','produktion@vastmek.se',    'recommendation','booked',  'meeting_booked','Väst Mekaniska AB',           580000,true, 'ai',    NOW()-'7 days'::interval, NOW()-'6 days'::interval),
  (cid,'Göta Stål',        '031-020 22 11','miljo@gotastål.se',        'hemsida',       'new',     'initial',       'Göta Stål AB',               NULL,  false,NULL,    NOW()-'2 days'::interval, NOW()-'2 days'::interval),
  (cid,'Bergström Fastigheter','031-030 33 12','forvaltning@bergstrom.se','google',     'signed',  'closed_won',    'Bergström Fastigheter AB',  1080000,true, 'ai',    NOW()-'118 days'::interval,NOW()-'109 days'::interval),
  (cid,'Kungsbacka Bil',   '031-040 44 13','vd@kbauto.se',             'facebook',      'qualified','pricing',       'Kungsbacka Bil AB',          620000,true, 'ai',    NOW()-'13 days'::interval,NOW()-'12 days'::interval),
  (cid,'Solkustens Camping','031-050 55 14','info@solkustencamping.se', 'recommendation','signed',  'closed_won',    'Solkustens Camping AB',      520000,true, 'ai',    NOW()-'135 days'::interval,NOW()-'126 days'::interval),
  (cid,'Gothenburg Data Center','031-060 66 15','infra@gbgdc.se',       'hemsida',       'booked',  'meeting_booked','Gothenburg Data Center AB',  1400000,true, 'ai',    NOW()-'4 days'::interval, NOW()-'3 days'::interval),
  (cid,'BRF Sommarhagen',  '031-070 77 16','admin@brfsommarhagen.se',   'google',        'signed',  'closed_won',    'BRF Sommarhagen (32 lgh)',    680000,true, 'ai',    NOW()-'150 days'::interval,NOW()-'141 days'::interval),
  (cid,'Lindqvists Åkeri', '031-080 88 17','depot@lindqvistsakeri.se',  'recommendation','lost',    'closed_lost',   'Lindqvists Åkeri AB',        NULL,  false,'manual',NOW()-'60 days'::interval, NOW()-'55 days'::interval),
  (cid,'Halmstadens Sjukvård','031-090 99 18','fastighet@halmstaden.se','hemsida',      'qualified','pricing',       'Halmstadens Sjukvård AB',    890000,false,'manual',NOW()-'18 days'::interval,NOW()-'16 days'::interval),
  (cid,'Askim Marina',     '031-100 10 19','hamn@askimmarina.se',       'facebook',      'new',     'initial',       'Askim Marina AB',            NULL,  false,NULL,    NOW()-'3 days'::interval, NOW()-'3 days'::interval),
  (cid,'Västra Götalands Gym','031-110 11 20','drift@vggym.se',         'google',        'signed',  'closed_won',    'Västra Götalands Gym AB',    720000,true, 'ai',    NOW()-'165 days'::interval,NOW()-'156 days'::interval);

END $$;


-- ─────────────────────────────────────────────────────────────────
-- 3. CUSTOMERS — signerade avtal (hämtar lead_id automatiskt)
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM public.clients WHERE slug = 'nordic-solar-demo';

  INSERT INTO public.customers
    (client_id, name, lead_id, contract_value, currency, status, source, booking_method, closed_at)
  SELECT
    cid,
    l.full_name,
    l.id,
    l.deal_value,
    'SEK',
    'active',
    l.source,
    l.booking_method,
    l.updated_at
  FROM public.leads l
  WHERE l.client_id = cid
    AND l.status = 'signed'
    AND l.deal_value IS NOT NULL;

END $$;


-- ─────────────────────────────────────────────────────────────────
-- 4. VERIFIERING
-- ─────────────────────────────────────────────────────────────────

SELECT
  'nordic-solar-demo' AS slug,
  (SELECT COUNT(*) FROM public.leads     l JOIN public.clients c ON c.id = l.client_id WHERE c.slug = 'nordic-solar-demo') AS leads,
  (SELECT COUNT(*) FROM public.customers cu JOIN public.clients c ON c.id = cu.client_id WHERE c.slug = 'nordic-solar-demo') AS kunder,
  (SELECT hq_access_key FROM public.clients WHERE slug = 'nordic-solar-demo') AS access_nyckel;
