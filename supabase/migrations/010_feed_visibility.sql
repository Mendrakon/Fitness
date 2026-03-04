-- ============================================================
-- MIGRATION: Feed Visibility (nur nötig wenn 009 ohne visibility lief)
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.feed_events
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'global'
    CHECK (visibility IN ('global', 'friends'));

CREATE INDEX IF NOT EXISTS feed_events_visibility_idx ON public.feed_events (visibility);

DROP POLICY IF EXISTS "feed_events_select" ON public.feed_events;
CREATE POLICY "feed_events_select"
  ON public.feed_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR visibility = 'global'
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted'
          AND (
            (sender_id   = auth.uid() AND receiver_id = feed_events.user_id)
            OR (receiver_id = auth.uid() AND sender_id   = feed_events.user_id)
          )
      )
    )
  );
