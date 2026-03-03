-- ============================================================
-- MIGRATION: Realtime für friendships aktivieren
-- Ohne das werden postgres_changes Events nicht ausgelöst
-- und die Echtzeit-Subscriptions im Client bleiben stumm.
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
