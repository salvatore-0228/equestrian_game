import { useEffect, useRef, useState } from 'react';
import { GameUI } from './GameUI';
import { GameData, Level, JumpOutcome, GameState } from '../types/game';

interface PlayingProps {
  gameData: GameData;
  level: Level;
  onJumpOutcome: (outcome: JumpOutcome) => void;
  onLevelComplete: () => void;
  onGameOver: () => void;
  onTimeDecrement: () => void;
  resetConsecutivePerfect: () => void;
  setGameState: (state:GameState) => void;
}

export const Playing = ({
  gameData,
  level,
  onJumpOutcome,
  onLevelComplete,
  onGameOver,
  onTimeDecrement,
  resetConsecutivePerfect,
  setGameState
}: PlayingProps) => {
  const jumpAttemptFnRef = useRef<((outcome: JumpOutcome) => void) | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!gameData.isGameActive) return;

    const timer = setInterval(() => {
      onTimeDecrement();
    }, 1000);

    return () => clearInterval(timer);
  }, [gameData.isGameActive, onTimeDecrement]);

  // jumpAttemptFnRef is populated by GameUI via onJumpAttemptReady and will be invoked elsewhere

  return (
    <div className="min-h-screen bg-gradient-to-b to-green-300 flex flex-col items-center justify-center p-4 relative">
      <GameUI
        score={gameData.score}
        level={level}
        timeRemaining={gameData.timeRemaining}
        jumpsCleared={gameData.jumpsCleared}
        jumpsRequired={level.jumpsRequired}
        railsDown={gameData.railsDown}
        isGameActive={gameData.isGameActive}
        onJumpOutcome={onJumpOutcome}
        onJumpCleared={() => {
          setFeedback('Perfect!');
          setTimeout(() => setFeedback(null), 1400);
        }}
        onJumpFailed={(reason) => {
          let msg = 'Miss';
          if (reason === 'good') {
            msg = 'Good!';
          } else if (reason === 'poor') {
            msg = 'Keep Going!';
          }
          setFeedback(msg);
          // Reset consecutive perfect streak on failed attempt
          try {
            resetConsecutivePerfect();
          } catch (e) {}
          setTimeout(() => setFeedback(null), 1400);
        }}
        onLevelComplete={onLevelComplete}
        onGameOver={onGameOver}
        onJumpAttemptReady={(fn) => {
          jumpAttemptFnRef.current = fn;
        }}
        resetConsecutivePerfect={resetConsecutivePerfect}
        setGameState={setGameState}
      />

      {/* TimingMeter is embedded inside GameUI now */}

      {feedback && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className={`text-6xl font-black drop-shadow-2xl animate-bounce ${
            feedback === 'Cleared!' ? 'text-green-400' : 'text-red-400'
          }`} style={{
            textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
            WebkitTextStroke: '2px rgba(0,0,0,0.2)'
          }}>
            {feedback}
          </div>
        </div>
      )}

      {gameData.consecutivePerfect >= 2 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-bold shadow-2xl animate-pulse">
            +{(gameData.consecutivePerfect - 1) * 10}% BONUS!
          </div>
        </div>
      )}
    </div>
  );
};
