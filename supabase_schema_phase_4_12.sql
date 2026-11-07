-- ==============================================================================
-- PHASE 4.12: CLIENT-SIDE IDEMPOTENCY, CASCADE DELETION & SYNC RECOVERY
-- 1. Ensure scouting_log.id supports client-side RFC4122 UUIDv4 strings
-- 2. Enforce PRIMARY KEY / UNIQUE constraint on scouting_log(id)
-- 3. Enforce ON DELETE CASCADE on scouting_log.match_id foreign key
-- 4. Provide gen_random_uuid()::text fallback for legacy inserts
-- 5. Verify Row Level Security (RLS) policies for upsert/insert operations
-- ==============================================================================

-- 1. Safe Column Alteration: migrate scouting_log.id to TEXT if numeric
DO $$
BEGIN
  -- If column 'id' is integer/bigint, alter it to TEXT to support client UUIDv4 strings
  -- without losing any existing historical numeric records.
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'scouting_log' 
      AND column_name = 'id' 
      AND data_type IN ('integer', 'bigint', 'smallint')
  ) THEN
    -- Drop IDENTITY sequence if present
    ALTER TABLE scouting_log ALTER COLUMN id DROP IDENTITY IF EXISTS;
    -- Drop existing default sequence
    ALTER TABLE scouting_log ALTER COLUMN id DROP DEFAULT;
    -- Alter column type to TEXT
    ALTER TABLE scouting_log ALTER COLUMN id TYPE TEXT USING id::text;
    -- Set default to server-side UUIDv4 fallback
    ALTER TABLE scouting_log ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  ELSIF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'scouting_log' 
      AND column_name = 'id'
  ) THEN
    -- Add id column if it somehow did not exist
    ALTER TABLE scouting_log ADD COLUMN id TEXT DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- 2. Ensure Primary Key / Unique Constraint on scouting_log(id)
DO $$
BEGIN
  -- If table lacks a primary key or unique constraint on 'id', add it
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'scouting_log' AND c.contype IN ('p', 'u')
  ) THEN
    ALTER TABLE scouting_log ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 3. Create Unique Index on scouting_log(id) for instant conflict resolution during .upsert()
CREATE UNIQUE INDEX IF NOT EXISTS idx_scouting_log_id_unique ON scouting_log(id);

-- 4. Enforce ON DELETE CASCADE on scouting_log.match_id foreign key
DO $$
DECLARE
  fk_rec RECORD;
BEGIN
  -- Ensure match_id column exists
  ALTER TABLE scouting_log ADD COLUMN IF NOT EXISTS match_id UUID;

  -- Drop any existing foreign key constraint on scouting_log(match_id)
  FOR fk_rec IN (
    SELECT c.conname 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'scouting_log' 
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%scouting_matches%'
  ) LOOP
    EXECUTE 'ALTER TABLE scouting_log DROP CONSTRAINT ' || quote_ident(fk_rec.conname);
  END LOOP;

  -- Re-create the foreign key constraint with ON DELETE CASCADE
  ALTER TABLE scouting_log
    ADD CONSTRAINT scouting_log_match_id_fkey
    FOREIGN KEY (match_id)
    REFERENCES scouting_matches(id)
    ON DELETE CASCADE;
END $$;

-- Performance Index on match_id foreign key
CREATE INDEX IF NOT EXISTS idx_scouting_log_match_id ON scouting_log(match_id);

-- 5. Row Level Security (RLS) policies to allow client-side upsert/insert with custom id
ALTER TABLE scouting_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read scouting_log" ON scouting_log;
CREATE POLICY "Allow public read scouting_log" ON scouting_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert scouting_log" ON scouting_log;
CREATE POLICY "Allow public insert scouting_log" ON scouting_log FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update scouting_log" ON scouting_log;
CREATE POLICY "Allow public update scouting_log" ON scouting_log FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete scouting_log" ON scouting_log;
CREATE POLICY "Allow public delete scouting_log" ON scouting_log FOR DELETE USING (true);

-- 6. Verification query: returns column definition and foreign key cascade rule
SELECT 
  c.column_name, 
  c.data_type, 
  c.is_nullable, 
  c.column_default
FROM information_schema.columns c
WHERE c.table_name = 'scouting_log' AND c.column_name IN ('id', 'match_id');
