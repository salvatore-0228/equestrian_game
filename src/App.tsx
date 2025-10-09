import { useGameState } from './hooks/useGameState';
import { Menu } from './components/Menu';
import { AvatarSelect } from './components/AvatarSelect';
import { Playing } from './components/Playing';
import { LevelComplete } from './components/LevelComplete';
import { GameOver } from './components/GameOver';
import { Leaderboard } from './components/Leaderboard';
import { UnlockNotification } from './components/UnlockNotification';
import { JumpOutcome } from './types/game';
import { useState } from 'react';

function App() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState<number | null>(null);
  
  const {
    gameState,
    gameData,
    setGameState,
    getLevelConfig,
    startGame,
    addScore,
    nextLevel,
    unlockNewLevel,
    endGame,
    decrementTime,
    resetGame,
    resetConsecutivePerfect,
  } = useGameState();

  const handleJumpOutcome = (outcome: JumpOutcome) => {
    switch (outcome) {
      case 'perfect':
        // Perfect jump: 100 points, counts as perfect and cleared, no rails down
        addScore(100, true, true, false);
        break;
      case 'too-early':
        // Too early: 0 points, not perfect, not cleared, rails down, reset streak
        resetConsecutivePerfect();
        addScore(0, false, false, true);
        break;
      case 'too-late':
        // Too late: 50 points, not perfect, not cleared, no rails down, reset streak
        resetConsecutivePerfect();
        addScore(50, false, false, false);
        break;
    }
  };

  const handleLevelComplete = () => {
    // Unlock the next level and show notification
    const nextLevelNumber = gameData.level + 1;
    if (nextLevelNumber <= 10) { // Assuming max level is 10
      const newUnlockedCount = unlockNewLevel(nextLevelNumber);
      if (newUnlockedCount >= nextLevelNumber) {
        setUnlockedLevel(nextLevelNumber);
        setShowUnlockNotification(true);
      }
    }
    setGameState('level-complete');
  };

  const handleUnlockNotificationClose = () => {
    setShowUnlockNotification(false);
    setUnlockedLevel(null);
  };

  const currentLevel = getLevelConfig(gameData.level);

  return (
    <>
      {gameState === 'menu' && (
        <Menu
          onStartGame={(level) => {
            setSelectedLevel(level || 1);
            setGameState('avatar-select');
          }}
          onViewLeaderboard={() => setGameState('leaderboard')}
          unlockedLevels={gameData.unlockedLevels}
        />
      )}

      {gameState === 'avatar-select' && (
        <AvatarSelect
          onStart={async (playerName, avatarId, horseId) => {
            const ok = await startGame(playerName, avatarId, horseId, selectedLevel);
            if (!ok) {
              // keep user on avatar select if player creation failed
              setGameState('avatar-select');
            }
          }}
          setGameState={setGameState}
          />
        )}

      {gameState === 'playing' && (
        <Playing
        gameData={gameData}
          level={currentLevel}
          onJumpOutcome={handleJumpOutcome}
          onLevelComplete={handleLevelComplete}
          onGameOver={() => {
            // fire-and-forget saving the score; endGame handles state and errors
            endGame();
          }}
          
          onTimeDecrement={decrementTime}
          resetConsecutivePerfect={resetConsecutivePerfect}
          setGameState={setGameState}
        />
      )}

      {gameState === 'level-complete' && (
        <LevelComplete
          level={gameData.level}
          score={gameData.score}
          onNextLevel={nextLevel}
        />
      )}

      {gameState === 'game-over' && (
        <GameOver
          totalScore={gameData.totalScore}
          highestLevelReached={gameData.highestLevelReached}
          currentLevel={gameData.level}
          jumpsCleared={gameData.jumpsCleared}
          onRestart={() => setGameState('avatar-select')}
          onMenu={resetGame}
          onLeaderboard={() => setGameState('leaderboard')}
        />
      )}

      {gameState === 'leaderboard' && (
        <Leaderboard onMenu={resetGame} />
      )}

      {/* Unlock Notification */}
      {unlockedLevel && (
        <UnlockNotification
          unlockedLevel={unlockedLevel}
          isVisible={showUnlockNotification}
          onClose={handleUnlockNotificationClose}
          duration={5000}
        />
      )}
    </>
  );
}

export default App;
