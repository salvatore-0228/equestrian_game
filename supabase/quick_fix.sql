-- Quick Fix for RLS Issues
-- Run this SQL directly in your Supabase SQL Editor

-- 1. First, ensure all columns exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS horse_id integer DEFAULT 1;
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS rails_down integer DEFAULT 0;
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS consecutive_perfect integer DEFAULT 0;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Anyone can create a player" ON players;
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Anyone can insert scores" ON game_scores;
DROP POLICY IF EXISTS "Anyone can view scores for leaderboard" ON game_scores;

-- 3. Ensure RLS is enabled
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- 4. Create new, simple policies
CREATE POLICY "players_insert" ON players FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "players_select" ON players FOR SELECT TO anon USING (true);
CREATE POLICY "scores_insert" ON game_scores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "scores_select" ON game_scores FOR SELECT TO anon USING (true);

-- 5. Test the fix
INSERT INTO players (name, avatar_id, horse_id) VALUES ('test', 1, 1);
