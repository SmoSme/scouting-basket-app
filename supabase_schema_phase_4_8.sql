-- ==============================================================================
-- PHASE 4.8: BBA SCOUTING RELATIONAL NORMALIZATION
-- 1. Create normalized scouting_matches table
-- 2. Add foreign key match_id to scouting_log
-- 3. Automatic data backfill & migration from existing scouting_log records
-- 4. Row Level Security (RLS) policies for uninterrupted client access
-- ==============================================================================

-- 1. Create scouting_matches table
CREATE TABLE IF NOT EXISTS scouting_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_name TEXT UNIQUE,
  match_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opponent_name TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'Official' CHECK (match_type IN ('Official', 'Friendly')),
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  is_home BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Alter existing scouting_log table to add match_id foreign key
ALTER TABLE scouting_log 
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES scouting_matches(id) ON DELETE CASCADE;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_scouting_matches_date ON scouting_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_scouting_matches_type ON scouting_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_scouting_log_match_id ON scouting_log(match_id);

-- 3. Backfill & Data Migration Script
-- Scans all existing match names, resolves their date, type, and opponent,
-- inserts them into scouting_matches, and links all scouting_log events.
DO $$
DECLARE
  rec RECORD;
  v_match_id UUID;
  v_date DATE;
  v_type TEXT;
  v_opp TEXT;
  v_is_home BOOLEAN;
  v_meta JSONB;
BEGIN
  FOR rec IN (
    SELECT DISTINCT COALESCE(Match_Name, match_name, nome_partita) AS m_name
    FROM scouting_log
    WHERE COALESCE(Match_Name, match_name, nome_partita) IS NOT NULL
  ) LOOP
    -- Extract any existing MATCH_METADATA config row
    SELECT Zone::jsonb INTO v_meta
    FROM scouting_log
    WHERE COALESCE(Match_Name, match_name, nome_partita) = rec.m_name
      AND (Action = 'MATCH_METADATA' OR Player = 'METADATA')
    ORDER BY id DESC
    LIMIT 1;

    -- Resolve match date
    IF v_meta IS NOT NULL AND v_meta ? 'matchDate' AND v_meta->>'matchDate' ~ '^\d{4}-\d{2}-\d{2}$' THEN
      v_date := (v_meta->>'matchDate')::date;
    ELSE
      SELECT COALESCE(created_at::date, CURRENT_DATE) INTO v_date
      FROM scouting_log
      WHERE COALESCE(Match_Name, match_name, nome_partita) = rec.m_name
      ORDER BY id ASC
      LIMIT 1;
    END IF;

    -- Resolve match type (strictly 'Official' or 'Friendly')
    IF v_meta IS NOT NULL AND v_meta ? 'matchType' AND v_meta->>'matchType' IN ('Official', 'Friendly') THEN
      v_type := v_meta->>'matchType';
    ELSE
      v_type := 'Official';
    END IF;

    -- Resolve home/away and opponent name
    IF rec.m_name ILIKE 'BBA vs%' OR rec.m_name ILIKE 'BBA -%' THEN
      v_is_home := true;
      v_opp := TRIM(REGEXP_REPLACE(rec.m_name, '^BBA\s*(vs|-)\s*', '', 'i'));
    ELSIF rec.m_name ILIKE '%vs BBA' OR rec.m_name ILIKE '%- BBA' THEN
      v_is_home := false;
      v_opp := TRIM(REGEXP_REPLACE(rec.m_name, '\s*(vs|-)\s*BBA$', '', 'i'));
    ELSE
      v_is_home := true;
      v_opp := rec.m_name;
    END IF;

    IF v_opp IS NULL OR v_opp = '' THEN
      v_opp := 'Avversario';
    END IF;

    -- Insert into scouting_matches
    INSERT INTO scouting_matches (
      match_name,
      match_date,
      opponent_name,
      match_type,
      home_score,
      away_score,
      is_home
    )
    VALUES (
      rec.m_name,
      COALESCE(v_date, CURRENT_DATE),
      v_opp,
      v_type,
      0,
      0,
      COALESCE(v_is_home, true)
    )
    ON CONFLICT (match_name) DO UPDATE
    SET match_date = EXCLUDED.match_date,
        match_type = EXCLUDED.match_type
    RETURNING id INTO v_match_id;

    -- Link all matching scouting_log rows to this match_id
    UPDATE scouting_log
    SET match_id = v_match_id
    WHERE COALESCE(Match_Name, match_name, nome_partita) = rec.m_name
      AND (match_id IS NULL OR match_id != v_match_id);

  END LOOP;
END $$;

-- 4. Enable Row Level Security (RLS) and grant open access for anon and authenticated
ALTER TABLE scouting_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read scouting_matches" ON scouting_matches;
CREATE POLICY "Allow public read scouting_matches" ON scouting_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert scouting_matches" ON scouting_matches;
CREATE POLICY "Allow public insert scouting_matches" ON scouting_matches FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update scouting_matches" ON scouting_matches;
CREATE POLICY "Allow public update scouting_matches" ON scouting_matches FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete scouting_matches" ON scouting_matches;
CREATE POLICY "Allow public delete scouting_matches" ON scouting_matches FOR DELETE USING (true);

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION set_scouting_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scouting_matches_updated_at ON scouting_matches;
CREATE TRIGGER trg_scouting_matches_updated_at
BEFORE UPDATE ON scouting_matches
FOR EACH ROW
EXECUTE FUNCTION set_scouting_matches_updated_at();
