-- ============================================================
-- MIGRATION: Personal Record Events
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pr_events (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL,
  workout_id    TEXT NOT NULL,
  date          TIMESTAMPTZ NOT NULL,
  metric        TEXT NOT NULL,
  new_value     NUMERIC NOT NULL,
  old_value     NUMERIC NOT NULL,
  diff          NUMERIC NOT NULL,
  diff_percent  NUMERIC NOT NULL,
  weight        NUMERIC NOT NULL,
  reps          NUMERIC NOT NULL,
  volume        NUMERIC NOT NULL,
  estimated_1rm NUMERIC NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS pr_events_user_id_idx
  ON public.pr_events (user_id);

CREATE INDEX IF NOT EXISTS pr_events_exercise_id_idx
  ON public.pr_events (user_id, exercise_id);

ALTER TABLE public.pr_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_events_select"
  ON public.pr_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "pr_events_insert"
  ON public.pr_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pr_events_update"
  ON public.pr_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "pr_events_delete"
  ON public.pr_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
