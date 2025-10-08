/*
  # Equestrian Jumping Game Database Schema

  ## Overview
  Creates tables for storing player scores and game sessions for the equestrian jumping game.

  ## New Tables
  
  ### `players`
  - `id` (uuid, primary key) - Unique player identifier
  - `name` (text) - Player's chosen name
  - `avatar_id` (integer) - Selected avatar identifier
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `game_scores`
  - `id` (uuid, primary key) - Unique score record identifier
  - `player_id` (uuid, foreign key) - Reference to player
  - `score` (integer) - Total points earned
  - `level_reached` (integer) - Highest level completed
  - `jumps_cleared` (integer) - Total successful jumps
  - `game_duration` (integer) - Time played in seconds
  - `created_at` (timestamptz) - When the game was played
  
  ## Security
  - Enable RLS on both tables
  - Players can insert their own scores
  - Anyone can view the leaderboard (top scores)
  - Players can view their own data
*/

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_id integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create game scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  level_reached integer DEFAULT 1,
  jumps_cleared integer DEFAULT 0,
  game_duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Players policies
CREATE POLICY "Anyone can create a player"
  ON players FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  TO anon
  USING (true);

-- Game scores policies
CREATE POLICY "Anyone can insert scores"
  ON game_scores FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view scores for leaderboard"
  ON game_scores FOR SELECT
  TO anon
  USING (true);

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created ON game_scores(created_at DESC);