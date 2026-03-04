-- ============================================================
-- MIGRATION: Workouts
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workouts (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  template_id  TEXT,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ,
  exercises    JSONB NOT NULL DEFAULT '[]',
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS workouts_user_id_idx
  ON public.workouts (user_id);

CREATE INDEX IF NOT EXISTS workouts_start_time_idx
  ON public.workouts (user_id, start_time DESC);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts_select"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "workouts_insert"
  ON public.workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_update"
  ON public.workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "workouts_delete"
  ON public.workouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
