-- Alle eingeloggten Nutzer dürfen Badges anderer lesen
DROP POLICY "Users can read own badges" ON klettersteig_badges;

CREATE POLICY "Authenticated users can read all badges"
  ON klettersteig_badges FOR SELECT
  USING (auth.role() = 'authenticated');
