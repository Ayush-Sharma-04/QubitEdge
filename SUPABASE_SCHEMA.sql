
-- QubitEdge — Supabase Database Schema

-- Table: saved_circuits
-- Stores user-saved quantum circuit designs from the /build playground.
-- RLS ensures users can only read/write their own circuits.


CREATE TABLE IF NOT EXISTS public.saved_circuits (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Untitled Circuit',
  payload     JSONB NOT NULL,                  -- CircuitState JSON
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_saved_circuits_user_id ON public.saved_circuits(user_id);

-- Enable Row Level Security
ALTER TABLE public.saved_circuits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own circuits"
  ON public.saved_circuits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own circuits"
  ON public.saved_circuits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own circuits"
  ON public.saved_circuits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own circuits"
  ON public.saved_circuits FOR DELETE
  USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- Table: module_progress
-- Tracks per-user, per-module completion state for the /learn curriculum.
-- RLS ensures users can only read/write their own progress.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.module_progress (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id           INTEGER NOT NULL CHECK (module_id BETWEEN 1 AND 6),
  completed_theory    BOOLEAN DEFAULT FALSE NOT NULL,
  completed_activity  BOOLEAN DEFAULT FALSE NOT NULL,
  assessment_score    INTEGER CHECK (assessment_score BETWEEN 0 AND 100),
  unlocked_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each user has at most one progress record per module
  UNIQUE (user_id, module_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_module_progress_user_id ON public.module_progress(user_id);

-- Enable Row Level Security
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
  ON public.module_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.module_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.module_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);



-- Helper: auto-update updated_at timestamp on row change


CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_saved_circuits_updated
  BEFORE UPDATE ON public.saved_circuits
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_module_progress_updated
  BEFORE UPDATE ON public.module_progress
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
