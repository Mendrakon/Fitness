-- ============================================================
-- MIGRATION: Klettersteig Performance Tracking
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Klettersteig-Routen (Seed-Daten) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.klettersteig_routes (
  id          TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  difficulty  TEXT NOT NULL,
  latitude    NUMERIC NOT NULL,
  longitude   NUMERIC NOT NULL,
  elevation_gain INTEGER,
  description TEXT
);

ALTER TABLE public.klettersteig_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read routes"
  ON public.klettersteig_routes
  FOR SELECT
  TO authenticated
  USING (true);

-- Hohe Wand Routen Seed-Daten
INSERT INTO public.klettersteig_routes (id, location_id, name, difficulty, latitude, longitude, elevation_gain, description) VALUES
  ('hohe-wand-steirerspur',            'hohe-wand', 'Steirerspur',              'C/D', 47.8295, 16.0385, 280, 'Klassiker, anspruchsvoll'),
  ('hohe-wand-hanselsteig',            'hohe-wand', 'Hanselsteig',              'A/B', 47.8280, 16.0410, 200, 'Einsteigerfreundlich'),
  ('hohe-wand-wildenauersteig',        'hohe-wand', 'Wildenauersteig',          'C',   47.8305, 16.0360, 250, 'Mittelschwer, schöne Aussicht'),
  ('hohe-wand-gebirgsvereinssteig',    'hohe-wand', 'Gebirgsvereinssteig',      'B',   47.8270, 16.0395, 220, 'Moderat'),
  ('hohe-wand-guenther-schlesinger',   'hohe-wand', 'Günther-Schlesinger-Steig','B',   47.8285, 16.0370, 210, 'Moderat, gut gesichert'),
  ('hohe-wand-htl-steig',             'hohe-wand', 'HTL-Steig',                'B/C', 47.8310, 16.0400, 240, 'Mittel bis schwer'),
  ('hohe-wand-hubertussteig',          'hohe-wand', 'Hubertussteig',            'A',   47.8260, 16.0420, 180, 'Leicht'),
  ('hohe-wand-voellerin-steig',        'hohe-wand', 'Völlerin-Steig',           'C',   47.8300, 16.0345, 260, 'Anspruchsvoll'),
  ('hohe-wand-springlessteig',         'hohe-wand', 'Springlessteig',           'A/B', 47.8275, 16.0430, 190, 'Einsteigerfreundlich')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Klettersteig-Sessions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.klettersteig_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id         TEXT NOT NULL REFERENCES public.klettersteig_routes(id),
  start_time       TIMESTAMPTZ NOT NULL,
  end_time         TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  extra_weight_kg  NUMERIC NOT NULL DEFAULT 0,
  weather          JSONB NOT NULL DEFAULT '{"condition":"sunny","temperature":null,"wind":null}'::jsonb,
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_klettersteig_sessions_user_route
  ON public.klettersteig_sessions (user_id, route_id, start_time DESC);

ALTER TABLE public.klettersteig_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own klettersteig sessions"
  ON public.klettersteig_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own klettersteig sessions"
  ON public.klettersteig_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own klettersteig sessions"
  ON public.klettersteig_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own klettersteig sessions"
  ON public.klettersteig_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 3. Klettersteig PR Events ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.klettersteig_pr_events (
  id               TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id         TEXT NOT NULL REFERENCES public.klettersteig_routes(id),
  session_id       UUID NOT NULL REFERENCES public.klettersteig_sessions(id) ON DELETE CASCADE,
  date             TIMESTAMPTZ NOT NULL,
  metric           TEXT NOT NULL,
  new_value        NUMERIC NOT NULL,
  old_value        NUMERIC NOT NULL DEFAULT 0,
  diff             NUMERIC NOT NULL DEFAULT 0,
  diff_percent     NUMERIC NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  extra_weight_kg  NUMERIC NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_klettersteig_pr_events_user_route
  ON public.klettersteig_pr_events (user_id, route_id);

ALTER TABLE public.klettersteig_pr_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own klettersteig PRs"
  ON public.klettersteig_pr_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own klettersteig PRs"
  ON public.klettersteig_pr_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own klettersteig PRs"
  ON public.klettersteig_pr_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 4. Feed Events CHECK constraint erweitern ────────────────────────────────

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
  CHECK (type IN ('pr', 'workout_complete', 'template_share', 'klettersteig_complete'));
