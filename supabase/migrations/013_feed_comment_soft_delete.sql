-- ============================================================
-- MIGRATION: Feed Comment Soft Delete
-- Ausführen in: Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE public.feed_comments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "feed_comments_update" ON public.feed_comments;
CREATE POLICY "feed_comments_update"
  ON public.feed_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
