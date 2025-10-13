import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Player {
  id: string;
  name: string;
  avatar_id: number;
  horse_id: number;
  created_at: string;
}

export interface GameScore {
  id: string;
  player_id: string;
  score: number;
  level_reached: number;
  jumps_cleared: number;
  rails_down: number;
  consecutive_perfect: number;
  game_duration: number;
  created_at: string;
}
