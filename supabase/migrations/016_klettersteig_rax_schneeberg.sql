-- ============================================================
-- MIGRATION: Rax & Schneeberg Klettersteig-Routen
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Rax Routen ────────────────────────────────────────────────────────────────

INSERT INTO public.klettersteig_routes (id, location_id, name, difficulty, latitude, longitude, elevation_gain, description) VALUES
  ('rax-haidsteig',               'rax', 'Haidsteig',               'C/D', 47.6875, 15.7650, 550, 'Anspruchsvoll, alpiner Klassiker'),
  ('rax-koenigsschusswandsteig',  'rax', 'Königsschusswandsteig',   'D/E', 47.6860, 15.7620, 380, 'Sehr schwer, nur für Erfahrene'),
  ('rax-preinerwandsteig',        'rax', 'Preinerwandsteig',        'A/B', 47.6830, 15.7700, 450, 'Moderat, tolle Aussicht'),
  ('rax-bismarcksteig',           'rax', 'Bismarcksteig',           'A',   47.6900, 15.7580, 400, 'Leicht, ideal zum Einstieg'),
  ('rax-wachthuettelkamm',       'rax', 'Wachthüttelkamm',         'B',   47.6850, 15.7630, 480, 'Moderat, abwechslungsreich'),
  ('rax-gaislochsteig',           'rax', 'Gaislochsteig',           'A/B', 47.6880, 15.7710, 420, 'Einsteigerfreundlich'),
  ('rax-rudolfsteig',             'rax', 'Rudolfsteig',             'B',   47.6920, 15.7600, 460, 'Moderat, historischer Steig')
ON CONFLICT (id) DO NOTHING;

-- ── Schneeberg Routen ─────────────────────────────────────────────────────────

INSERT INTO public.klettersteig_routes (id, location_id, name, difficulty, latitude, longitude, elevation_gain, description) VALUES
  ('schneeberg-av-steig',         'schneeberg', 'AV-Steig',         'B/C', 47.7700, 15.8100, 500, 'Mittelschwer, alpin'),
  ('schneeberg-nandlgrat',        'schneeberg', 'Nandlgrat',        'C',   47.7650, 15.8050, 600, 'Anspruchsvoll, exponiert'),
  ('schneeberg-weichtalklamm',    'schneeberg', 'Weichtalklamm',    'A',   47.7720, 15.8150, 350, 'Leicht, durch die Klamm')
ON CONFLICT (id) DO NOTHING;
