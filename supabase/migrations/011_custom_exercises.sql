-- ============================================================
-- MIGRATION: Custom Exercises
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.custom_exercises (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment    TEXT NOT NULL DEFAULT '',
  pinned_note  TEXT,
  rest_work    INTEGER,
  rest_warmup  INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS custom_exercises_user_id_idx
  ON public.custom_exercises (user_id);

ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_exercises_select"
  ON public.custom_exercises FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "custom_exercises_insert"
  ON public.custom_exercises FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_exercises_update"
  ON public.custom_exercises FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "custom_exercises_delete"
  ON public.custom_exercises FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
