-- ============================================================
-- MIGRATION: Parkplatz-Koordinaten pro Klettersteig-Route
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.klettersteig_routes
  ADD COLUMN IF NOT EXISTS parking_latitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS parking_longitude NUMERIC;

-- Rax: Preiner Wand Routen → Griesleiten Parkplatz
UPDATE public.klettersteig_routes
SET parking_latitude = 47.6836, parking_longitude = 15.7412
WHERE id IN ('rax-haidsteig', 'rax-koenigsschusswandsteig', 'rax-preinerwandsteig');

-- Rax: Bismarcksteig → Preiner Gscheid
UPDATE public.klettersteig_routes
SET parking_latitude = 47.6759, parking_longitude = 15.7235
WHERE id = 'rax-bismarcksteig';

-- Rax: Höllental Routen → Weichtalhaus
UPDATE public.klettersteig_routes
SET parking_latitude = 47.7473, parking_longitude = 15.7657
WHERE id IN ('rax-wachthuettelkamm', 'rax-gaislochsteig', 'rax-rudolfsteig');

-- Hohe Wand: alle Routen → Parkplatz Hohe Wand
UPDATE public.klettersteig_routes
SET parking_latitude = 47.8279, parking_longitude = 16.0505
WHERE location_id = 'hohe-wand';
