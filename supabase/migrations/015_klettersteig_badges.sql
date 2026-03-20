CREATE TABLE klettersteig_badges (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id UUID REFERENCES klettersteig_sessions(id)
);

ALTER TABLE klettersteig_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON klettersteig_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON klettersteig_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX klettersteig_badges_user_badge
  ON klettersteig_badges(user_id, badge_id);
