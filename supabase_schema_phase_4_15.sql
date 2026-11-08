-- ==============================================================================
-- PHASE 4.15: EVENT-LEVEL PLUS/MINUS (+/-) SNAPSHOTTING ("EUROLEAGUE METHOD")
-- Add on_court array column to scouting_log
-- ==============================================================================

-- 1. Add on_court text array column to scouting_log if it does not already exist
ALTER TABLE scouting_log ADD COLUMN IF NOT EXISTS on_court TEXT[];

-- 2. Verify column definition in information_schema
COMMENT ON COLUMN scouting_log.on_court IS 'Snapshot of the 5 active on-court player numbers for Euroleague-method Plus/Minus tracking';
