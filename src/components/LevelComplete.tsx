import { ArrowRight, Trophy } from 'lucide-react';

interface LevelCompleteProps {
  level: number;
  score: number;
  onNextLevel: () => void;
}

export const LevelComplete = ({ level, score, onNextLevel }: LevelCompleteProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-bounce-in">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Level Complete!</h2>
          <p className="text-gray-600">Excellent riding!</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Level Completed:</span>
            <span className="text-2xl font-bold text-gray-800">{level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Current Score:</span>
            <span className="text-2xl font-bold text-gray-800">{score}</span>
          </div>
        </div>

        <button
          onClick={onNextLevel}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transform transition hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          Next Level
          <ArrowRight className="w-6 h-6" />
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Get ready for a tougher challenge!
        </p>
      </div>
    </div>
  );
};
