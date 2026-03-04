-- ============================================================
-- MIGRATION: Feed – Template Share Event Type
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop all CHECK constraints on feed_events.type (regardless of auto-generated name)
-- then recreate with the new 'template_share' value included.
DO $$
DECLARE
  cname TEXT;
BEGIN
  FOR cname IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.feed_events'::regclass
      AND contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.feed_events DROP CONSTRAINT IF EXISTS %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.feed_events
  ADD CONSTRAINT feed_events_type_check
  CHECK (type IN ('pr', 'workout_complete', 'template_share'));
