-- Add email column to players table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'email'
  ) THEN
    ALTER TABLE players ADD COLUMN email text;
  END IF;
END $$;

-- Create index on email for better query performance
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);

-- Update the players table to allow email to be nullable for backward compatibility
-- (existing players without email will still work)
