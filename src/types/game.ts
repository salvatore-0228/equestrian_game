export type GameState = 'menu' | 'avatar-select' | 'playing' | 'level-complete' | 'game-over' | 'leaderboard';

export type JumpOutcome = 'too-early' | 'perfect' | 'too-late';

export type TimingZone = 'early' | 'perfect' | 'late';

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  gravity: number;
  jumpPower: number;
  horseSpeed: number;
}

export interface Horse {
  x: number;
  y: number;
  velocityY: number;
  width: number;
  height: number;
  isJumping: boolean;
  animationState: 'idle' | 'running' | 'jumping' | 'backing-up' | 'slowing';
}

export interface HorseType {
  id: number;
  name: string;
  color: string;
}

export interface Jump {
  x: number;
  y: number;
  width: number;
  height: number;
  cleared: boolean;
}

export interface Level {
  number: number;
  timeLimit: number;
  jumpsRequired: number;
  jumpSpacing: number;
  jumpHeight: number;
  meterSpeed: number;
}

export interface TimingMeterState {
  indicatorPosition: number;
  direction: 'up' | 'down';
  speed: number;
}

export interface GameData {
  playerId: string | null;
  playerName: string;
  avatarId: number;
  horseId: number;
  score: number;
  level: number;
  jumpsCleared: number;
  railsDown: number;
  consecutivePerfect: number;
  timeRemaining: number;
  isGameActive: boolean;
}
