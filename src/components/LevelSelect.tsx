import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Check, Star, Clock, Zap, Lock } from 'lucide-react';
import { getLevelConfig, getEnvironmentGradient } from '../config/levels.utils';

interface LevelSelectProps {
  currentLevel?: number;
  maxLevel?: number;
  unlockedLevels?: number; // Number of levels unlocked (default: 1)
  onSelect: (level: number) => void;
  onCancel?: () => void;
}

// Get level configuration from the JSON config
const getLevelPreview = (levelNum: number) => {
  const levelConfig = getLevelConfig(levelNum);
  if (!levelConfig) {
    // Fallback for invalid levels
    return {
      number: levelNum,
      timeLimit: 60,
      jumpsRequired: 10,
      meterSpeed: 2.0,
      difficulty: 'beginner',
      environment: 'meadow'
    };
  }

  return {
    number: levelConfig.id,
    timeLimit: levelConfig.timeLimit,
    jumpsRequired: levelConfig.requiredJumps,
    meterSpeed: levelConfig.meterSpeed,
    difficulty: levelConfig.difficulty,
    environment: levelConfig.environment,
    name: levelConfig.name,
    description: levelConfig.description
  };
};


export const LevelSelect: React.FC<LevelSelectProps> = ({ 
  currentLevel = 1, 
  maxLevel = 5, 
  unlockedLevels = 1, 
  onSelect, 
  onCancel 
}) => {
  const [carouselIndex, setCarouselIndex] = useState<number>(currentLevel - 1); // Index for carousel position
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null); // No level selected initially

  // Helper function to check if a level is unlocked
  const isLevelUnlocked = (level: number) => level <= unlockedLevels;

  const prev = () => {
    setCarouselIndex((prevIndex) => Math.max(0, prevIndex - 1));
    setSelectedLevel(null); // Clear selection when navigating
  };
  
  const next = () => {
    setCarouselIndex((prevIndex) => Math.min(maxLevel - 3, prevIndex + 1));
    setSelectedLevel(null); // Clear selection when navigating
  };

  // Generate levels for carousel (always show 3 at once)
  const getVisibleLevels = () => {
    const levels = [];
    for (let i = carouselIndex; i < carouselIndex + 3 && i < maxLevel; i++) {
      levels.push(i + 1);
    }
    return levels;
  };

  const visibleLevels = getVisibleLevels();
  const cfg = getLevelPreview(selectedLevel || visibleLevels[1] || 1); // Use selected level or center level for stats

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-3xl p-8 w-full max-w-6xl mx-4 shadow-2xl border border-gray-700/50">
        {/* Close Button */}
        <div className="flex justify-end mb-6">
          <button 
            onClick={onCancel} 
            aria-label="close" 
            className="p-3 rounded-full bg-gray-700/80 hover:bg-gray-600/80 transition-colors text-white backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Level Stats at Top */}
        <div className="bg-gray-800/60 rounded-2xl p-6 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Clock className="w-8 h-8 text-blue-400 mb-2" />
              <div className="text-sm text-gray-400 mb-1">TIME LIMIT</div>
              <div className="text-2xl font-bold text-white">{cfg.timeLimit}s</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 text-yellow-400 mb-2" />
              <div className="text-sm text-gray-400 mb-1">JUMPS REQUIRED</div>
              <div className="text-2xl font-bold text-white">{cfg.jumpsRequired}</div>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-8 h-8 text-purple-400 mb-2" />
              <div className="text-sm text-gray-400 mb-1">METER SPEED</div>
              <div className="text-2xl font-bold text-white">{cfg.meterSpeed}</div>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {/* Left Arrow */}
          <button 
            onClick={prev} 
            disabled={carouselIndex <= 0}
            className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform hover:scale-110 shadow-lg"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          {/* Level Cards */}
          <div className="flex gap-4 items-center">
            {visibleLevels.map((level, index) => {
              const isSelected = level === selectedLevel;
              const isCenter = index === 1; // Always center the middle card
              const isUnlocked = isLevelUnlocked(level);
              
              return (
                <div
                  key={level}
                  className={`relative transition-all duration-500 transform ${
                    isSelected ? 'scale-110 z-10' : 'scale-100'
                  } ${isCenter ? 'z-20' : ''}`}
                >
                  <div
                    className={`w-64 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 transition-all duration-300 ${
                      isUnlocked 
                        ? 'cursor-pointer hover:shadow-3xl' 
                        : 'cursor-not-allowed opacity-60'
                    }`}
                    style={{
                      background: getEnvironmentGradient(level),
                      borderColor: isSelected ? '#3B82F6' : isUnlocked ? '#6B7280' : '#4B5563'
                    }}
                    onClick={() => isUnlocked && setSelectedLevel(level)}
                  >
                    {/* Environment Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                    
                    {/* Level Number - Centered (always visible, behind lock if locked) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-8xl font-black drop-shadow-2xl ${isUnlocked ? 'text-white' : 'text-gray-500'}`} style={{ fontFamily: "'Press Start 2P', monospace" }}>
                          {level}
                        </div>
                        <div className={`text-lg font-bold drop-shadow-lg mt-2 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                          LEVEL
                        </div>
                      </div>
                    </div>

                    {/* Locked Level Overlay - Lock icon on top of level number */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4 drop-shadow-2xl" />
                          <div className="text-lg font-bold text-gray-300 drop-shadow-lg">
                            LOCKED
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Difficulty Stars */}
                    <div className="absolute top-4 left-4 flex gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(level / 2)) }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 fill-current drop-shadow-lg ${isUnlocked ? 'text-yellow-400' : 'text-gray-500'}`} />
                      ))}
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && isUnlocked && (
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Lock Icon for locked levels */}
                    {!isUnlocked && (
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={next} 
            disabled={carouselIndex >= maxLevel - 3}
            className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform hover:scale-110 shadow-lg"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: maxLevel }, (_, i) => i + 1).map((levelNum) => {
            const isInCurrentView = levelNum >= carouselIndex + 1 && levelNum <= carouselIndex + 3;
            const isSelected = levelNum === selectedLevel;
            const isUnlocked = isLevelUnlocked(levelNum);
            
            return (
              <button
                key={levelNum}
                onClick={() => {
                  // Only allow navigation to unlocked levels
                  if (isUnlocked) {
                    const targetIndex = Math.max(0, Math.min(maxLevel - 3, levelNum - 1));
                    setCarouselIndex(targetIndex);
                    setSelectedLevel(null); // Clear selection when navigating
                  }
                }}
                disabled={!isUnlocked}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'bg-blue-500 scale-125 shadow-lg'
                    : isInCurrentView
                    ? isUnlocked 
                      ? 'bg-gray-400 hover:bg-gray-300' 
                      : 'bg-gray-500'
                    : isUnlocked
                    ? 'bg-gray-600 hover:bg-gray-500'
                    : 'bg-gray-700'
                } ${!isUnlocked ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-label={`Go to level ${levelNum}${!isUnlocked ? ' (locked)' : ''}`}
              />
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => selectedLevel && onSelect(selectedLevel)}
            disabled={!selectedLevel}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform shadow-lg ${
              selectedLevel
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-6 h-6" />
            {selectedLevel ? `START LEVEL ${selectedLevel}` : 'SELECT A LEVEL'}
          </button>
          <button 
            onClick={onCancel} 
            className="px-8 py-4 rounded-2xl border-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all font-bold text-lg"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;
