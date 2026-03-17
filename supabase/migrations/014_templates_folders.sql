-- ============================================================
-- MIGRATION: Templates & Folders
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Folders
CREATE TABLE IF NOT EXISTS public.folders (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS folders_user_id_idx
  ON public.folders (user_id);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_select"
  ON public.folders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "folders_insert"
  ON public.folders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "folders_update"
  ON public.folders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "folders_delete"
  ON public.folders FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  folder_id       TEXT,
  exercises       JSONB NOT NULL DEFAULT '[]',
  notes           TEXT NOT NULL DEFAULT '',
  last_used       TIMESTAMPTZ,
  source_event_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS templates_user_id_idx
  ON public.templates (user_id);

CREATE INDEX IF NOT EXISTS templates_created_at_idx
  ON public.templates (user_id, created_at DESC);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select"
  ON public.templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "templates_insert"
  ON public.templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_update"
  ON public.templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "templates_delete"
  ON public.templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
