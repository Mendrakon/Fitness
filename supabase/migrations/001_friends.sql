-- ============================================================
-- MIGRATION: Profiles & Friendships (Social Feature)
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ============================================================
-- 1. PROFILES
--    Speichert öffentliche Nutzer-Daten (username, etc.)
--    Wird automatisch beim Registrieren angelegt.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index für schnelle Username-Suche
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- Row Level Security aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Jeder eingeloggte User darf alle Profile lesen (für Suche)
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Jeder darf nur sein eigenes Profil bearbeiten
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);


-- ============================================================
-- 2. TRIGGER: Profil automatisch bei Registrierung anlegen
--    Username kommt aus user_metadata (raw_user_meta_data)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substr(NEW.id::text, 1, 8)   -- Fallback falls kein Username
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 3. FRIENDSHIPS
--    status: 'pending' | 'accepted' | 'declined'
--    sender_id  = wer die Anfrage geschickt hat
--    receiver_id = wer die Anfrage bekommen hat
-- ============================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Verhindert Selbst-Freundschaft
  CONSTRAINT no_self_friend CHECK (sender_id <> receiver_id)
);

-- Verhindert doppelte Anfragen in beide Richtungen (LEAST/GREATEST nur als Index möglich)
CREATE UNIQUE INDEX IF NOT EXISTS unique_friendship_idx
  ON public.friendships (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));

CREATE INDEX IF NOT EXISTS friendships_sender_idx   ON public.friendships (sender_id);
CREATE INDEX IF NOT EXISTS friendships_receiver_idx ON public.friendships (receiver_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Nutzer sieht nur Freundschaften, an denen er beteiligt ist
CREATE POLICY "friendships_select"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Anfrage schicken: nur als sender_id, nur mit status 'pending'
CREATE POLICY "friendships_insert"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id AND status = 'pending');

-- Status ändern: nur der Empfänger darf annehmen/ablehnen
CREATE POLICY "friendships_update"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Löschen: beide Seiten dürfen die Freundschaft entfernen
CREATE POLICY "friendships_delete"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
