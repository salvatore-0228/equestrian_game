-- Add email column to game_scores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_scores' AND column_name = 'email'
  ) THEN
    ALTER TABLE game_scores ADD COLUMN email text;
  END IF;
END $$;

-- Create index on email for better query performance
CREATE INDEX IF NOT EXISTS idx_game_scores_email ON game_scores(email);

-- Update the game_scores table to allow email to be nullable for backward compatibility
-- (existing scores without email will still work)
