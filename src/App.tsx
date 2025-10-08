import { useGameState } from './hooks/useGameState';
import { Menu } from './components/Menu';
import { AvatarSelect } from './components/AvatarSelect';
import { Playing } from './components/Playing';
import { LevelComplete } from './components/LevelComplete';
import { GameOver } from './components/GameOver';
import { Leaderboard } from './components/Leaderboard';
import { JumpOutcome } from './types/game';

function App() {
  const {
    gameState,
    gameData,
    setGameState,
    getLevelConfig,
    startGame,
    addScore,
    nextLevel,
    endGame,
    decrementTime,
    resetGame,
    resetScore,
  } = useGameState();

  const handleJumpOutcome = (outcome: JumpOutcome) => {
    switch (outcome) {
      case 'perfect':
        addScore(100, true, true, false);
        break;
      case 'too-early':
        addScore(0, false, true, true);
        break;
      case 'too-late':
        addScore(50, false, false, false);
        break;
    }
  };

  const currentLevel = getLevelConfig(gameData.level);

  return (
    <>
      {gameState === 'menu' && (
        <Menu
          onStartGame={() => setGameState('avatar-select')}
          onViewLeaderboard={() => setGameState('leaderboard')}
        />
      )}

      {gameState === 'avatar-select' && (
        <AvatarSelect
          onStart={async (playerName, avatarId, horseId) => {
            const ok = await startGame(playerName, avatarId, horseId);
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
          onLevelComplete={() => setGameState('level-complete')}
          onGameOver={() => {
            // fire-and-forget saving the score; endGame handles state and errors
            endGame();
          }}
          
          onTimeDecrement={decrementTime}
          resetScore={resetScore}
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
          score={gameData.score}
          level={gameData.level}
          jumpsCleared={gameData.jumpsCleared}
          onRestart={() => setGameState('avatar-select')}
          onMenu={resetGame}
          onLeaderboard={() => setGameState('leaderboard')}
        />
      )}

      {gameState === 'leaderboard' && (
        <Leaderboard onMenu={resetGame} />
      )}
    </>
  );
}

export default App;
