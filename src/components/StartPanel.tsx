import React from 'react';
import { Play, Trophy } from 'lucide-react';

interface StartPanelProps {
  showUI?: boolean;
  onStart?: () => void;
  onViewLeaderboard?: () => void;
  isLoggedIn?: boolean;
}

export const StartPanel: React.FC<StartPanelProps> = ({ showUI = true, onStart, onViewLeaderboard, isLoggedIn = false }) => {
  return (
    <>
      <div className="animate-slide-down" style={{ animationDelay: '0.5s', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
        <h1 className="text-7xl font-black text-white mb-4 drop-shadow-2xl tracking-tight" style={{ marginTop: '-15rem' }}>
          <span className="inline-block" style={{ fontFamily: "'Press Start 2P', monospace", textShadow: "4px 4px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2)", WebkitTextStroke: '2px rgba(0,0,0,0.2)' }}>
            CECILIA JUMPER
          </span>
        </h1>
        <h2 className="text-8xl font-black text-yellow-300 mb-8 drop-shadow-2xl tracking-tight">
          <span className="inline-block" style={{ fontFamily: "'Press Start 2P', monospace", textShadow: "4px 4px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2)", WebkitTextStroke: '2px rgba(0,0,0,0.2)' }}>
            CLASSIC
          </span>
        </h2>
      </div>

      {/* START button moved to bottom-center - only show if logged in */}
      {isLoggedIn && (
        <div className="fixed left-1/2 transform -translate-x-1/2" style={{ bottom: '6.5rem', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
          <button
            onClick={onStart}
            className="relative group animate-fade-in-up mx-auto block"
            style={{ animationDelay: '1.8s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse-glow"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-3xl py-6 px-16 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 border-4 border-white overflow-hidden">
              <div className="absolute inset-0 animate-shimmer"></div>
              <div className="relative flex items-center justify-center gap-4">
                <Play className="w-10 h-10 fill-current" />
                <span>START GAME</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Login required message - only show if not logged in */}
      {!isLoggedIn && (
        <div className="fixed left-1/2 transform -translate-x-1/2" style={{ bottom: '6.5rem', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
          <div className="bg-gray-800 bg-opacity-90 text-white font-bold text-xl py-6 px-16 rounded-2xl shadow-2xl border-4 border-gray-600 text-center">
            <div className="flex items-center justify-center gap-4">
              <span>Please Sign In to Start Game</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard moved to bottom-center (below START) */}
      <div className="fixed left-1/2 transform -translate-x-1/2" style={{ bottom: '1.5rem', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
        <button
          onClick={onViewLeaderboard}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2 border-2 border-yellow-300"
        >
          <Trophy className="w-6 h-6" />
          <span>LEADERBOARD</span>
        </button>
      </div>

      <div className="fixed bottom-8 right-8 animate-fade-in-up" style={{ animationDelay: '2.5s', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
        <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg backdrop-blur-sm border-2 border-white shadow-lg">
          <p className="text-sm font-semibold">Press SPACE to jump over obstacles!</p>
        </div>
      </div>
    </>
  );
};

export default StartPanel;
