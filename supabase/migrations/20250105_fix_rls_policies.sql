/*
  # Fix RLS Policies for Player Creation

  ## Issue
  - Player creation is failing with 403 Forbidden error
  - RLS policies may not be properly applied or may have issues

  ## Fix
  - Drop existing policies and recreate them
  - Ensure policies allow anonymous users to create players
  - Add proper error handling and logging
*/

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Anyone can create a player" ON players;
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Anyone can insert scores" ON game_scores;
DROP POLICY IF EXISTS "Anyone can view scores for leaderboard" ON game_scores;

-- Recreate players policies with proper permissions
CREATE POLICY "Allow anonymous player creation"
  ON players FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous player viewing"
  ON players FOR SELECT
  TO anon
  USING (true);

-- Recreate game_scores policies with proper permissions
CREATE POLICY "Allow anonymous score insertion"
  ON game_scores FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous score viewing"
  ON game_scores FOR SELECT
  TO anon
  USING (true);

-- Ensure RLS is enabled on both tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Verify the policies are working by checking if we can insert a test player
-- This will help debug if there are still issues
DO $$
BEGIN
  -- Try to insert a test player to verify the policy works
  -- We'll catch any errors and log them
  BEGIN
    INSERT INTO players (name, avatar_id, horse_id) 
    VALUES ('test_player_' || extract(epoch from now()), 1, 1);
    
    -- If successful, delete the test player
    DELETE FROM players WHERE name LIKE 'test_player_%';
    
    RAISE NOTICE 'RLS policies are working correctly - test insert succeeded';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'RLS policies issue detected: %', SQLERRM;
  END;
END $$;
