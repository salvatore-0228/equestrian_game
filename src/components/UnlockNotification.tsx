import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, Trophy } from 'lucide-react';
import { getLevelConfig, getEnvironmentGradient, getDifficultyColor, getDifficultyLabel } from '../config/levels.utils';

interface UnlockNotificationProps {
  unlockedLevel: number;
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // Auto-close duration in milliseconds
}

export const UnlockNotification: React.FC<UnlockNotificationProps> = ({
  unlockedLevel,
  isVisible,
  onClose,
  duration = 4000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start animation sequence
      setIsAnimating(true);
      
      // Show content after initial animation
      setTimeout(() => setShowContent(true), 300);
      
      // Auto-close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset states when hidden
      setIsAnimating(false);
      setShowContent(false);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setShowContent(false);
    setIsAnimating(false);
    setTimeout(() => onClose(), 300);
  };

  const levelConfig = getLevelConfig(unlockedLevel);
  
  if (!isVisible || !levelConfig) return null;

  const difficultyColor = getDifficultyColor(unlockedLevel);
  const difficultyLabel = getDifficultyLabel(unlockedLevel);
  const environmentGradient = getEnvironmentGradient(unlockedLevel);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          isAnimating ? 'opacity-60' : 'opacity-0'
        }`}
      />

      {/* Main Notification */}
      <div 
        className={`relative transform transition-all duration-500 ease-out ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        {/* Notification Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700 max-w-md mx-4">
          {/* Header with Icon */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              {/* Background Circle */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              
              {/* Floating Stars */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Star className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center animate-bounce">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
            </div>

            <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              LEVEL UNLOCKED!
            </h2>
            <div className={`text-lg font-bold ${difficultyColor}`}>
              {difficultyLabel}
            </div>
          </div>

          {/* Level Preview Card */}
          <div className="relative mb-6">
            <div
              className="w-full h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-gray-600"
              style={{ background: environmentGradient }}
            >
              {/* Environment Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
              
              {/* Level Number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-black text-white drop-shadow-2xl" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    {unlockedLevel}
                  </div>
                  <div className="text-sm font-bold text-white drop-shadow-lg mt-1">
                    LEVEL
                  </div>
                </div>
              </div>

              {/* Unlock Badge */}
              <div className="absolute top-2 right-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Level Info */}
            <div className="mt-3 text-center">
              <h3 className="text-xl font-bold text-white mb-1">{levelConfig.name}</h3>
              <p className="text-sm text-gray-300">{levelConfig.description}</p>
            </div>
          </div>

          {/* Level Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">TIME</div>
              <div className="text-lg font-bold text-white">{levelConfig.timeLimit}s</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">JUMPS</div>
              <div className="text-lg font-bold text-white">{levelConfig.requiredJumps}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">SPEED</div>
              <div className="text-lg font-bold text-white">{levelConfig.meterSpeed}s</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
            >
              CONTINUE
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all font-bold"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Floating Particles Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping ${
                showContent ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnlockNotification;
