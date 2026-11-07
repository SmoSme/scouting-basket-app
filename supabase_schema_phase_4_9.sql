-- ==============================================================================
-- PHASE 4.9: LIVE SCOUTING SCORE SYNCHRONIZATION & RELATIONAL INTEGRITY TRIGGER
-- 1. Automatic PostgreSQL trigger on scouting_log (INSERT, UPDATE, DELETE)
-- 2. Recalculates home_score and away_score in scouting_matches automatically
-- 3. Ensures match_id linking integrity and backfills any unlinked events
-- ==============================================================================

-- 1. Ensure foreign key constraint and index exist
ALTER TABLE scouting_log 
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES scouting_matches(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scouting_log_match_id ON scouting_log(match_id);

-- 2. Backfill any unlinked scouting_log rows using match_name
UPDATE scouting_log sl
SET match_id = sm.id
FROM scouting_matches sm
WHERE sl.match_id IS NULL
  AND COALESCE(sl.Match_Name, sl.match_name, sl.nome_partita) = sm.match_name;

-- 3. Function to recalculate home_score and away_score for a scouting_matches row
CREATE OR REPLACE FUNCTION sync_scouting_matches_scores()
RETURNS TRIGGER AS $$
DECLARE
  v_match_id UUID;
  v_match_name TEXT;
  v_bba_pts INT;
  v_opp_pts INT;
BEGIN
  -- Determine the affected match_id
  IF TG_OP = 'DELETE' THEN
    v_match_id := OLD.match_id;
    v_match_name := COALESCE(OLD.Match_Name, OLD.match_name, OLD.nome_partita);
  ELSE
    v_match_id := NEW.match_id;
    v_match_name := COALESCE(NEW.Match_Name, NEW.match_name, NEW.nome_partita);
  END IF;

  -- Fallback to look up match_id if it was null on the event
  IF v_match_id IS NULL AND v_match_name IS NOT NULL THEN
    SELECT id INTO v_match_id
    FROM scouting_matches
    WHERE match_name = v_match_name
    LIMIT 1;
    
    -- If event has no match_id, attach it now
    IF v_match_id IS NOT NULL AND TG_OP <> 'DELETE' THEN
      NEW.match_id := v_match_id;
    END IF;
  END IF;

  -- If still no match_id found, exit gracefully
  IF v_match_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Calculate BBA Team points for this match
  -- BBA points: 2PT Made (+2), 3PT Made (+3), FT Made (+1)
  -- Filter out Opponent actions, opponent number/player
  SELECT COALESCE(SUM(
    CASE 
      WHEN (
        COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
        OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
        OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
        OR COALESCE(Action, action, Azione, azione, '') ILIKE 'OPP_%'
        OR COALESCE(Action, action, Azione, azione, '') ILIKE 'Opponent%'
      ) THEN 0
      WHEN COALESCE(Action, action, Azione, azione, '') IN ('2PT Made', '2PT Fatto') THEN 2
      WHEN COALESCE(Action, action, Azione, azione, '') IN ('3PT Made', '3PT Fatto') THEN 3
      WHEN COALESCE(Action, action, Azione, azione, '') IN ('FT Made', 'TL Fatto') THEN 1
      ELSE 0
    END
  ), 0)
  INTO v_bba_pts
  FROM scouting_log
  WHERE match_id = v_match_id;

  -- Calculate Opponent points for this match
  -- Opponent points: OPP_2PT_MADE (+2), OPP_3PT_MADE (+3), OPP_FT_MADE (+1),
  -- or parsed "Opponent Scored +X"
  SELECT COALESCE(SUM(
    CASE 
      WHEN COALESCE(Action, action, Azione, azione, '') = 'OPP_2PT_MADE' THEN 2
      WHEN COALESCE(Action, action, Azione, azione, '') = 'OPP_3PT_MADE' THEN 3
      WHEN COALESCE(Action, action, Azione, azione, '') IN ('OPP_FT_MADE', 'OPP_1PT_MADE') THEN 1
      WHEN COALESCE(Action, action, Azione, azione, '') ~* 'Opponent Scored \+([0-9]+)' THEN 
        (SUBSTRING(COALESCE(Action, action, Azione, azione, '') FROM 'Opponent Scored \+([0-9]+)'))::INT
      WHEN (
        COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
        OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
        OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
      ) AND COALESCE(Action, action, Azione, azione, '') ~* '\+3' THEN 3
      WHEN (
        COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
        OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
        OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
      ) AND COALESCE(Action, action, Azione, azione, '') ~* '\+2' THEN 2
      WHEN (
        COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
        OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
        OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
      ) AND COALESCE(Action, action, Azione, azione, '') ~* '\+1' THEN 1
      ELSE 0
    END
  ), 0)
  INTO v_opp_pts
  FROM scouting_log
  WHERE match_id = v_match_id;

  -- Synchronize scores into scouting_matches
  UPDATE scouting_matches
  SET home_score = v_bba_pts,
      away_score = v_opp_pts,
      updated_at = NOW()
  WHERE id = v_match_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on scouting_log for INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trg_sync_scouting_matches_scores ON scouting_log;
CREATE TRIGGER trg_sync_scouting_matches_scores
AFTER INSERT OR UPDATE OR DELETE ON scouting_log
FOR EACH ROW
EXECUTE FUNCTION sync_scouting_matches_scores();

-- 5. Recalculate scores for all existing matches to backfill historical scores
DO $$
DECLARE
  m RECORD;
  v_bba INT;
  v_opp INT;
BEGIN
  FOR m IN SELECT id FROM scouting_matches LOOP
    SELECT COALESCE(SUM(
      CASE 
        WHEN (
          COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
          OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
          OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
          OR COALESCE(Action, action, Azione, azione, '') ILIKE 'OPP_%'
          OR COALESCE(Action, action, Azione, azione, '') ILIKE 'Opponent%'
        ) THEN 0
        WHEN COALESCE(Action, action, Azione, azione, '') IN ('2PT Made', '2PT Fatto') THEN 2
        WHEN COALESCE(Action, action, Azione, azione, '') IN ('3PT Made', '3PT Fatto') THEN 3
        WHEN COALESCE(Action, action, Azione, azione, '') IN ('FT Made', 'TL Fatto') THEN 1
        ELSE 0
      END
    ), 0)
    INTO v_bba
    FROM scouting_log
    WHERE match_id = m.id;

    SELECT COALESCE(SUM(
      CASE 
        WHEN COALESCE(Action, action, Azione, azione, '') = 'OPP_2PT_MADE' THEN 2
        WHEN COALESCE(Action, action, Azione, azione, '') = 'OPP_3PT_MADE' THEN 3
        WHEN COALESCE(Action, action, Azione, azione, '') IN ('OPP_FT_MADE', 'OPP_1PT_MADE') THEN 1
        WHEN COALESCE(Action, action, Azione, azione, '') ~* 'Opponent Scored \+([0-9]+)' THEN 
          (SUBSTRING(COALESCE(Action, action, Azione, azione, '') FROM 'Opponent Scored \+([0-9]+)'))::INT
        WHEN (
          COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
          OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
          OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
        ) AND COALESCE(Action, action, Azione, azione, '') ~* '\+3' THEN 3
        WHEN (
          COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
          OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
          OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
        ) AND COALESCE(Action, action, Azione, azione, '') ~* '\+2' THEN 2
        WHEN (
          COALESCE(Category, category, Categoria, categoria, '') ILIKE '%opponent%' 
          OR COALESCE(Number, number, Numero, numero, '') = 'OPP'
          OR COALESCE(Player, player, Giocatore, giocatore, '') ILIKE '%opponent%'
        ) AND COALESCE(Action, action, Azione, azione, '') ~* '\+1' THEN 1
        ELSE 0
      END
    ), 0)
    INTO v_opp
    FROM scouting_log
    WHERE match_id = m.id;

    -- Only update if there are points recorded in scouting_log
    IF v_bba > 0 OR v_opp > 0 THEN
      UPDATE scouting_matches
      SET home_score = v_bba,
          away_score = v_opp,
          updated_at = NOW()
      WHERE id = m.id;
    END IF;
  END LOOP;
END $$;
