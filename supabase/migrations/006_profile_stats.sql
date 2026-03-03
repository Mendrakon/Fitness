-- Add extended profile fields: weight (kg), height (cm), favorite muscle group
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight        NUMERIC(5, 1),
  ADD COLUMN IF NOT EXISTS height        INTEGER,
  ADD COLUMN IF NOT EXISTS favorite_muscle_group TEXT
    CHECK (favorite_muscle_group IN (
      'Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps',
      'Bauch', 'Beine', 'Gesäß', 'Waden', 'Unterarme'
    ));
