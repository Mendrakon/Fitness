-- ============================================================
-- MIGRATION: Activity Feed
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. FEED EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feed_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('pr', 'workout_complete')),
  visibility TEXT NOT NULL DEFAULT 'global' CHECK (visibility IN ('global', 'friends')),
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS feed_events_user_id_idx    ON public.feed_events (user_id);
CREATE INDEX IF NOT EXISTS feed_events_created_at_idx ON public.feed_events (created_at DESC);
CREATE INDEX IF NOT EXISTS feed_events_visibility_idx ON public.feed_events (visibility);

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "feed_events_insert" ON public.feed_events;
CREATE POLICY "feed_events_insert"
  ON public.feed_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_events_delete" ON public.feed_events;
CREATE POLICY "feed_events_delete"
  ON public.feed_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. FEED REACTIONS (Likes)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.feed_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS feed_reactions_event_id_idx ON public.feed_reactions (event_id);

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_reactions_select" ON public.feed_reactions;
CREATE POLICY "feed_reactions_select"
  ON public.feed_reactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "feed_reactions_insert" ON public.feed_reactions;
CREATE POLICY "feed_reactions_insert"
  ON public.feed_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_reactions_delete" ON public.feed_reactions;
CREATE POLICY "feed_reactions_delete"
  ON public.feed_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 3. FEED COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feed_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.feed_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS feed_comments_event_id_idx ON public.feed_comments (event_id);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_comments_select" ON public.feed_comments;
CREATE POLICY "feed_comments_select"
  ON public.feed_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "feed_comments_insert" ON public.feed_comments;
CREATE POLICY "feed_comments_insert"
  ON public.feed_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_comments_delete" ON public.feed_comments;
CREATE POLICY "feed_comments_delete"
  ON public.feed_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Falls visibility-Spalte noch fehlt (Upgrade von alter Version):
ALTER TABLE public.feed_events
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'global'
    CHECK (visibility IN ('global', 'friends'));
