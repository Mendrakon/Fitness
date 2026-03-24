-- ============================================================
-- MIGRATION: Rax Klettersteig-Routen mit korrekten Koordinaten
-- Koordinaten basierend auf bergsteigen.com Einstiegspunkte
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Rax Routen einfügen / Koordinaten korrigieren
INSERT INTO public.klettersteig_routes (id, location_id, name, difficulty, latitude, longitude, elevation_gain, description) VALUES
  ('rax-haidsteig',                'rax', 'Haidsteig',                'C/D', 47.6978, 15.7342, 350, 'Klassiker an der Preiner Wand, sehr anspruchsvoll'),
  ('rax-koenigsschusswandsteig',   'rax', 'Königsschusswandsteig',    'D/E', 47.7005, 15.7338, 400, 'Extrem schwer, Preiner Wand'),
  ('rax-preinerwandsteig',         'rax', 'Preinerwandsteig',         'A/B', 47.6984, 15.7397, 300, 'Klassiker, Preiner Wand'),
  ('rax-bismarcksteig',            'rax', 'Bismarcksteig',            'A',   47.6918, 15.7054, 200, 'Leicht, Querung am Predigtstuhl'),
  ('rax-wachthuettelkamm',        'rax', 'Wachthüttelkamm',          'B',   47.7463, 15.7642, 250, 'Moderat, Großes Höllental'),
  ('rax-gaislochsteig',            'rax', 'Gaislochsteig',            'A/B', 47.7261, 15.7497, 350, 'Übergang im Großen Höllental'),
  ('rax-rudolfsteig',              'rax', 'Rudolfsteig',              'B',   47.738,  15.748,  300, 'Gesicherter Steig, Großes Höllental')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  elevation_gain = EXCLUDED.elevation_gain,
  description = EXCLUDED.description;
