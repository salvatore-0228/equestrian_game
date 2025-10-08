/*
  # Update Game Schema for New Mechanics

  ## Changes

  1. Updates to `players` table
    - Add `horse_id` column to store selected horse (1-3)

  2. Updates to `game_scores` table
    - Add `rails_down` column to track knocked rails
    - Add `consecutive_perfect` column to track perfect jump streaks

  ## Notes
  - Uses safe column addition checks
  - Maintains backward compatibility
  - Apply this migration when database access is available
*/

-- Add horse_id to players table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'horse_id'
  ) THEN
    ALTER TABLE players ADD COLUMN horse_id integer DEFAULT 1;
  END IF;
END $$;

-- Add rails_down to game_scores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_scores' AND column_name = 'rails_down'
  ) THEN
    ALTER TABLE game_scores ADD COLUMN rails_down integer DEFAULT 0;
  END IF;
END $$;

-- Add consecutive_perfect to game_scores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_scores' AND column_name = 'consecutive_perfect'
  ) THEN
    ALTER TABLE game_scores ADD COLUMN consecutive_perfect integer DEFAULT 0;
  END IF;
END $$;
