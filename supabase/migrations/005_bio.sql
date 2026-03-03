-- ============================================================
-- MIGRATION: Bio-Feld für Profile
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;
