import { RotateCcw, Home, Trophy } from 'lucide-react';

interface GameOverProps {
  score: number;
  level: number;
  jumpsCleared: number;
  onRestart: () => void;
  onMenu: () => void;
  onLeaderboard: () => void;
}

export const GameOver = ({
  score,
  level,
  jumpsCleared,
  onRestart,
  onMenu,
  onLeaderboard,
}: GameOverProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-400 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">Game Over</h2>
        <p className="text-center text-gray-600 mb-6">Better luck next time!</p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Final Score:</span>
            <span className="text-2xl font-bold text-gray-800">{score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Level Reached:</span>
            <span className="text-xl font-semibold text-gray-800">{level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Jumps:</span>
            <span className="text-xl font-semibold text-gray-800">{jumpsCleared}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transform transition hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>

          <button
            onClick={onLeaderboard}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-3 px-6 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transform transition hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </button>

          <button
            onClick={onMenu}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:from-gray-600 hover:to-gray-700 transform transition hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
