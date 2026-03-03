-- ============================================================
-- MIGRATION: Push Subscriptions
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Jeder darf nur seine eigenen Subscriptions sehen/verwalten
CREATE POLICY "push_subs_select"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "push_subs_insert"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subs_delete"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Die API-Route /api/push/notify braucht service_role → kein RLS-Bypass nötig,
-- da der Service-Role-Key alle Policies umgeht.


-- ============================================================
-- SUPABASE WEBHOOK SETUP (manuell im Dashboard)
-- ============================================================
--
-- Damit Push-Notifications auch dann ankommen, wenn die App
-- geschlossen ist, muss ein Database Webhook eingerichtet werden:
--
-- 1. Supabase Dashboard → Database → Webhooks → "Create a new hook"
-- 2. Name:        "friend-request-push"
-- 3. Table:       public.friendships
-- 4. Events:      INSERT
-- 5. Type:        HTTP Request
-- 6. URL:         https://DEINE-APP.vercel.app/api/push/notify
-- 7. Headers:
--      Content-Type: application/json
--      x-webhook-secret: (Wert aus PUSH_WEBHOOK_SECRET in .env.local)
-- 8. Speichern
--
-- ============================================================
