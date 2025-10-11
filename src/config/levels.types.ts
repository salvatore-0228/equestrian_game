export interface LevelConfig {
  version: string;
  description: string;
  defaultLevel: number;
  maxLevel: number;
  levels: Level[];
  difficultySettings: DifficultySettings;
  environmentSettings: EnvironmentSettings;
  progressionRules: ProgressionRules;
  scoring: ScoringConfig;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  timeLimit: number;
  requiredJumps: number;
  meterSpeed: number;
  difficulty: Difficulty;
  environment: Environment;
  timingZones: TimingZones;
  unlockRequirements: UnlockRequirements;
}

export interface TimingZones {
  perfect: number; // Perfect zone percentage (green)
  good: number;    // Good zone percentage (yellow/orange)
  poor: number;    // Poor zone percentage (red)
}

export interface UnlockRequirements {
  previousLevel: number | null;
}

export interface DifficultySettings {
  [key: string]: {
    color: string;
    label: string;
    stars: number[];
  };
}

export interface EnvironmentSettings {
  [key: string]: {
    gradient: string;
    description: string;
  };
}

export interface ProgressionRules {
  timeLimitDecrease: number;
  jumpsIncrease: {
    min: number;
    max: number;
  };
  meterSpeedIncrease: {
    percentage: number;
  };
}

export interface ScoringConfig {
  perfectJump: number;
  tooEarlyPenalty: number;
  tooLatePenalty: number;
  multiplierIncrement: number;
  maxMultiplier: number;
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type Environment = 
  | 'meadow' 
  | 'grassland' 
  | 'hills' 
  | 'autumn' 
  | 'forest' 
  | 'mountain' 
  | 'rocky' 
  | 'slopes' 
  | 'peak' 
  | 'arena';
