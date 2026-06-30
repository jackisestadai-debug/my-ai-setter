-- =====================================================================
-- Glow Studio demo-klient — migration
-- =====================================================================
-- INSTRUKTIONER:
--   1. Öppna Supabase SQL-editor (supabase.com → ditt projekt → SQL editor)
--   2. Kör detta script i sin helhet (ctrl+enter / cmd+enter)
--   3. Kontrollera att inga error dyker upp
--
-- SÄKERHET: Påverkar INTE slug='owner' (Rekvo). Alla inserts är
-- isolerade på klinik-demo:s client_id via CTE.
-- =====================================================================


-- 1. Lägg till hq_access_key-kolumn om den inte finns
--    (nullable → befintliga klienter påverkas inte alls)
alter table public.clients
  add column if not exists hq_access_key text;


-- 2. Infoga klinik-demo klienten
--    ON CONFLICT gör inget om raden redan finns
insert into public.clients (
  name,
  slug,
  system_prompt,
  voice_samples,
  active_rules,
  business_context,
  is_active,
  timezone,
  hq_access_key
)
select
  'Glow Studio',
  'klinik-demo',
  $PROMPT$Du är Ella — AI-receptionist på Glow Studio, en premiumklinik för estetiska behandlingar i Stockholm (Östergatan 21). Du svarar via Instagram DM.

PERSONLIGHET: Varm, professionell och hjälpsam. Naturlig och avslappnad i tonen — som en riktigt duktig receptionist som genuint bryr sig om patienten. Inga konstiga formella fraser.

KLINIKINFO:
• Öppettider: Mån–fre 08:00–18:00
• Adress: Östergatan 21, Stockholm
• Bokningar: Svara i chatten, ring 08-123 45 67 eller maila info@glowstudio.se

BEHANDLINGAR & PRISER:
• Botox — fr 2 500 kr. Håller 4–6 månader. Tar 20–30 min. Behandlar panna, ögonbryn, kråksparkar.
• Fillers (läppar, kinder, käke) — fr 3 500 kr. Håller 9–18 månader beroende på produkt och område.
• Laser/IPL — fr 1 800 kr/session. Effektiv mot pigment, ytliga blodkärl och ojämn hudton.
• Ansiktsbehandling — fr 1 200 kr. 60–90 min djuprengöring, peeling och mask.
• Microneedling — fr 2 200 kr. Stimulerar kollagen, effektiv mot ärr, förstorade porer och slapp hud.
• Brow & lash design — fr 800 kr. Formgivning, tinting och laminering.
• Permanent makeup (läppar, ögonbryn, eyeliner) — fr 3 000 kr. Håller 1–3 år.

LEDIGTTIDER (använd dessa):
• Nästa vecka: tisdag 10:00, onsdag 14:30, torsdag 09:00, fredag 11:00
• Denna vecka: imorgon 11:00 eller fredag 15:00 (om det är tidigt i veckan)

BOKNINGSFLÖDE:
1. Fråga vilken behandling
2. Erbjud 2-3 konkreta tider
3. Be om namn + telefon för bekräftelse
4. Bekräfta varmt och kort

SVARSREGLER:
• Max 2-3 meningar. Kortare är bättre.
• Alltid på svenska.
• Avsluta alltid med en fråga eller nästa steg.
• Ge aldrig vaga svar — var specifik och hjälpsam.
• Uppge alltid tydliga priser.$PROMPT$,
  '',
  'Svara alltid på svenska. Max 2-3 meningar per svar. Var konkret och varm.',
  'Glow Studio är en premiumklinik för estetiska behandlingar på Östergatan 21 i Stockholm. Vi erbjuder botox, fillers, laser, ansiktsbehandlingar, microneedling, brow- och lashdesign samt permanent makeup.',
  true,
  'Europe/Stockholm',
  'glow-hq-2025'
where not exists (
  select 1 from public.clients where slug = 'klinik-demo'
);


-- 3. Demo-data: leads, kunder och betalningar (6 månaders historik)
--    Allt via CTE så client_id alltid är korrekt
do $$
declare
  v_client_id uuid;
  v_lead_ids uuid[] := array[]::uuid[];
  v_lid uuid;
  names text[] := array[
    'Anna Lindqvist','Maria Svensson','Sofia Bergström','Emma Johansson',
    'Maja Karlsson','Isabelle Eriksson','Klara Nilsson','Hanna Persson',
    'Julia Anderson','Linn Gustafsson','Sara Magnusson','Elin Olsson',
    'Frida Larsson','Ida Håkansson','Josefin Pettersson','Therese Lindgren',
    'Rebecca Sandberg','Camilla Ekstrom','Johanna Holm','Nina Björk',
    'Alexandra Åberg','Matilda Nyberg','Amanda Söderberg','Felicia Strand',
    'Elsa Wallin','Petra Lindberg','Cecilia Karlsson','Monica Eriksson',
    'Karin Svensson','Lisa Persson','Helena Gustafsson','Charlotte Olsson',
    'Susanne Johansson','Annika Magnusson','Marianne Larsson','Eva Nilsson',
    'Birgitta Andersson','Kristina Bergström','Ulrika Lindqvist','Ingela Strand',
    'Pernilla Wallin','Åsa Holm','Gunilla Sandberg','Lena Ekstrom','Britt Nyberg'
  ];
  treatments text[] := array[
    'botox','fillers','laser','ansiktsbehandling','microneedling',
    'brow-och-lash','permanent-makeup','botox','fillers','botox'
  ];
  statuses text[] := array[
    'engaged','engaged','booked','new','lost','engaged','booked',
    'new','engaged','lost','new','engaged'
  ];
  n integer;
  i integer;
  months_ago integer;
  lead_date timestamp with time zone;
  treatment text;
  status text;
  stage text;
begin
  -- Hämta klinik-demo client_id
  select id into v_client_id from public.clients where slug = 'klinik-demo';
  if v_client_id is null then
    raise notice 'klinik-demo client saknas — avbryter';
    return;
  end if;

  -- Skippa om vi redan har demo-data
  select count(*) into n from public.leads where client_id = v_client_id;
  if n > 5 then
    raise notice 'Demo-data finns redan (% leads) — skippar', n;
    return;
  end if;

  -- Skapa leads fördelade över 6 månader
  for i in 1..45 loop
    months_ago := ((i - 1) / 8); -- 8 leads per månad ungefär
    lead_date := now() - (months_ago * interval '30 days') - (random() * interval '25 days');
    treatment := treatments[1 + (i % array_length(treatments, 1))];
    status := statuses[1 + (i % array_length(statuses, 1))];

    -- Välj stage baserat på status
    stage := case
      when status = 'booked' then 'book'
      when status = 'engaged' then case when i % 3 = 0 then 'goals' when i % 3 = 1 then 'opener' else 'current_situation' end
      else 'opener'
    end;

    insert into public.leads (
      client_id, full_name, ig_username, status, stage,
      source, src_channel, first_contact_at, last_message_at, created_at, updated_at,
      ai_paused, screened, ai_booked,
      stage_data
    ) values (
      v_client_id,
      names[1 + ((i - 1) % array_length(names, 1))],
      lower(regexp_replace(names[1 + ((i - 1) % array_length(names, 1))], '[^a-zA-ZåäöÅÄÖ]', '', 'g')) || (100 + i)::text,
      status,
      stage,
      'instagram',
      'instagram',
      lead_date,
      lead_date + (random() * interval '3 days'),
      lead_date,
      lead_date,
      (status = 'lost'),
      (status in ('booked', 'engaged')),
      (status = 'booked' and i % 2 = 0),
      jsonb_build_object('behandling_intresse', treatment)
    )
    returning id into v_lid;

    v_lead_ids := v_lead_ids || v_lid;
  end loop;

  -- Skapa kunder (de som konverterade)
  for i in 1..12 loop
    v_lid := v_lead_ids[i * 3]; -- var tredje lead
    treatment := treatments[1 + (i % array_length(treatments, 1))];

    insert into public.customers (
      client_id, lead_id, name,
      contract_value, currency,
      closed_at, status, source, booking_method,
      closer
    )
    select
      v_client_id,
      v_lid,
      l.full_name,
      case treatment
        when 'botox' then 2500 + (random() * 1500)::int
        when 'fillers' then 3500 + (random() * 2000)::int
        when 'laser' then 1800 + (random() * 1200)::int
        when 'permanent-makeup' then 3000 + (random() * 2000)::int
        else 2200 + (random() * 1500)::int
      end,
      'SEK',
      now() - ((6 - i) * interval '15 days'),
      'active',
      'instagram',
      'ai',
      'Ella'
    from public.leads l where l.id = v_lid;
  end loop;

  raise notice 'Demo-data skapad: 45 leads, 12 kunder';
end;
$$;


-- 4. Verifiering
select
  'klinik-demo' as slug,
  (select count(*) from public.leads l join public.clients c on c.id = l.client_id where c.slug = 'klinik-demo') as leads,
  (select count(*) from public.customers cu join public.clients c on c.id = cu.client_id where c.slug = 'klinik-demo') as kunder,
  (select hq_access_key from public.clients where slug = 'klinik-demo') as access_nyckel;
