-- ============================================================
-- Shaurya Taneja Hiring Platform — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
  CREATE TYPE pipeline_stage AS ENUM ('Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE round_status AS ENUM ('scheduled', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS job_descriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role_title  TEXT NOT NULL,
  department  TEXT,
  location    TEXT,
  employment_type TEXT,
  experience_level TEXT,
  raw_input   JSONB,
  generated_jd TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS candidates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  location        TEXT,
  current_title   TEXT,
  current_company TEXT,
  linkedin_url    TEXT,
  resume_url      TEXT,
  resume_text     TEXT,
  jd_id           UUID REFERENCES job_descriptions(id),
  pipeline_stage  pipeline_stage NOT NULL DEFAULT 'Applied',
  fit_score       INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
  ai_summary      TEXT,
  ai_strengths    TEXT[],
  ai_concerns     TEXT[],
  notes           TEXT,
  tags            TEXT[],
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS interview_rounds (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  round_number    INTEGER NOT NULL,
  round_name      TEXT NOT NULL,
  interview_date  TIMESTAMPTZ,
  interviewer     TEXT NOT NULL DEFAULT 'Shaurya Taneja',
  status          round_status NOT NULL DEFAULT 'scheduled',
  total_score     INTEGER,
  max_score       INTEGER NOT NULL DEFAULT 60,
  ai_recommendation TEXT,
  ai_summary      TEXT,
  next_steps      TEXT,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS scorecard_criteria (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT NOT NULL,
  description TEXT,
  max_score   INTEGER NOT NULL DEFAULT 10,
  category    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS scorecard_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  round_id        UUID NOT NULL REFERENCES interview_rounds(id) ON DELETE CASCADE,
  criterion_id    UUID NOT NULL REFERENCES scorecard_criteria(id),
  score           INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10),
  notes           TEXT,
  UNIQUE(round_id, criterion_id)
);

CREATE TABLE IF NOT EXISTS candidate_activity (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  activity_type   TEXT NOT NULL,
  description     TEXT NOT NULL,
  metadata        JSONB
);

-- ============================================================
-- updated_at triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON candidates;
CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_job_descriptions_updated_at ON job_descriptions;
CREATE TRIGGER trg_job_descriptions_updated_at
  BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_interview_rounds_updated_at ON interview_rounds;
CREATE TRIGGER trg_interview_rounds_updated_at
  BEFORE UPDATE ON interview_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_scorecard_scores_updated_at ON scorecard_scores;
CREATE TRIGGER trg_scorecard_scores_updated_at
  BEFORE UPDATE ON scorecard_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security — open "Allow all" policies (internal tool)
-- ============================================================

ALTER TABLE job_descriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_rounds     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_criteria   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_activity   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON job_descriptions;
DROP POLICY IF EXISTS "Allow all" ON candidates;
DROP POLICY IF EXISTS "Allow all" ON interview_rounds;
DROP POLICY IF EXISTS "Allow all" ON scorecard_criteria;
DROP POLICY IF EXISTS "Allow all" ON scorecard_scores;
DROP POLICY IF EXISTS "Allow all" ON candidate_activity;

CREATE POLICY "Allow all" ON job_descriptions     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON candidates           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON interview_rounds     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON scorecard_criteria   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON scorecard_scores     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON candidate_activity   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: 6 scorecard criteria
-- ============================================================

INSERT INTO scorecard_criteria (name, description, max_score, category, sort_order)
SELECT * FROM (VALUES
  ('Communication',       'Clarity, articulation, and active listening skills',                                    10, 'Soft Skills', 1),
  ('Cultural Fit',        'Alignment with brand values, aesthetic sensibility, and team dynamics',                 10, 'Soft Skills', 2),
  ('Relevant Experience', 'Depth and quality of experience relevant to the role',                                  10, 'Experience',  3),
  ('Problem Solving',     'Analytical thinking, creativity, and approach to challenges',                           10, 'Cognitive',   4),
  ('Motivation & Drive',  'Enthusiasm for the role, brand, and growth potential',                                   10, 'Soft Skills', 5),
  ('Role-Specific Skills','Technical or functional skills directly required for the position',                     10, 'Technical',   6)
) AS v(name, description, max_score, category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM scorecard_criteria LIMIT 1);

-- ============================================================
-- Seed: Jiya Agarwal (first candidate)
-- ============================================================

DO $$
DECLARE
  v_candidate_id  UUID;
  v_round1_id     UUID;
  v_round2_id     UUID;
  v_crit          RECORD;
  v_scores        INT[] := ARRAY[9, 9, 8, 8, 9, 7]; -- sums to 50
  v_idx           INT := 0;
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM candidates WHERE full_name = 'Jiya Agarwal') THEN
    RETURN;
  END IF;

  -- Insert candidate
  INSERT INTO candidates (
    full_name, location, pipeline_stage, fit_score, ai_summary, notes, is_active
  ) VALUES (
    'Jiya Agarwal',
    'New Delhi',
    'Interviewed',
    83,
    'Strong candidate currently in Round 2 closing conversation. Scored 50/60 in Round 1.',
    'Round 2 in progress — closing conversation. First candidate on the platform.',
    TRUE
  ) RETURNING id INTO v_candidate_id;

  -- Round 1 — completed, score 50/60
  INSERT INTO interview_rounds (
    candidate_id, round_number, round_name, status, total_score, max_score, interviewer
  ) VALUES (
    v_candidate_id, 1, 'Round 1 — Initial Interview', 'completed', 50, 60, 'Shaurya Taneja'
  ) RETURNING id INTO v_round1_id;

  -- Scores for Round 1
  FOR v_crit IN
    SELECT id FROM scorecard_criteria WHERE is_active = TRUE ORDER BY sort_order
  LOOP
    v_idx := v_idx + 1;
    INSERT INTO scorecard_scores (round_id, criterion_id, score)
    VALUES (v_round1_id, v_crit.id, v_scores[v_idx]);
  END LOOP;

  -- Round 2 — in progress
  INSERT INTO interview_rounds (
    candidate_id, round_number, round_name, status, max_score, interviewer
  ) VALUES (
    v_candidate_id, 2, 'Round 2 — Closing Conversation', 'in_progress', 60, 'Shaurya Taneja'
  ) RETURNING id INTO v_round2_id;

  -- Activity logs
  INSERT INTO candidate_activity (candidate_id, activity_type, description, metadata)
  VALUES
    (v_candidate_id, 'candidate_created',   'Candidate profile created. First candidate on the platform.',    '{}'),
    (v_candidate_id, 'stage_change',        'Moved to Interviewed after completing Round 1 (50/60).',
      jsonb_build_object('from', 'Applied', 'to', 'Interviewed', 'round_score', 50));
END $$;
