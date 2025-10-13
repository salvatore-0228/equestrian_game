import { useEffect, useState, useRef } from 'react';
import { JumpOutcome } from '../types/game';
import { getTimingZones, getLevelConfig } from '../config/levels.utils';

interface TimingMeterProps {
  onJumpAttempt: (val: JumpOutcome) => void;
  isActive: boolean;
  distanceToFence: number;
  disabled?: boolean;
  level: number;
}

export const TimingMeter = ({ onJumpAttempt, isActive, distanceToFence, disabled = false, level }: TimingMeterProps) => {
  const [indicatorPosition, setIndicatorPosition] = useState(0); // Start at left edge
  const [afterimagePosition, setAfterimagePosition] = useState<number | null>(null); // Afterimage position
  const [isVisible, setIsVisible] = useState(false); // Visibility state for animation
  const directionRef = useRef<'left' | 'right'>('right');
  const intervalRef = useRef<number | null>(null);

  // Generate zones with level-based perfect/good zones and random red zones
  const generateMixedZones = () => {
    // Get level-based zone configuration
    const timingZones = getTimingZones(level);
    
    // Level-based zone sizes (from levels.json)
    const perfectZone = timingZones.perfect;
    const goodZone = timingZones.good;
    
    // Random red zones (poor zones) - increased minimum due to larger bar size
    const minRedZone = 12; // Increased minimum for larger bar
    const maxRedZone = 50; // Increased maximum for larger bar
    const leftRedZone = minRedZone + Math.random() * (maxRedZone - minRedZone);
    const rightRedZone = minRedZone + Math.random() * (maxRedZone - minRedZone);
    
    // Random left yellow zone (minimum 3% of goodZone, maximum 70% of goodZone)
    const minLeftYellow = Math.max(3, goodZone * 0.3);
    const maxLeftYellow = goodZone * 0.7;
    const leftYellow = minLeftYellow + Math.random() * (maxLeftYellow - minLeftYellow);
    const rightYellow = goodZone - leftYellow;
    
    // Calculate remaining space after allocating all zones
    const usedSpaceWithYellow = perfectZone + leftYellow + rightYellow + leftRedZone + rightRedZone;
    const remainingSpace = 100 - usedSpaceWithYellow;
    
    if (remainingSpace > 0) {
      const leftExtra = Math.random() * remainingSpace;
      const rightExtra = remainingSpace - leftExtra;
      return {
        leftRed: leftRedZone + leftExtra,
        leftYellow: leftYellow,
        green: perfectZone,
        rightYellow: rightYellow,
        rightRed: rightRedZone + rightExtra
      };
    } else {
      // If we've used too much space, scale down red zones proportionally
      const scaleFactor = (100 - perfectZone - goodZone) / (leftRedZone + rightRedZone);
      return {
        leftRed: leftRedZone * scaleFactor,
        leftYellow: leftYellow,
        green: perfectZone,
        rightYellow: rightYellow,
        rightRed: rightRedZone * scaleFactor
      };
    }
  };

  // Generate zones once when component mounts or level changes
  const [zones, setZones] = useState(() => generateMixedZones());
  
  // Distance-based visibility logic
  // Show timing meter when distance to fence is 300 or less, hide when distance is -100 or less
  const shouldShowMeter = distanceToFence <= 300 && distanceToFence > -100;
  const isMeterActive = isActive && shouldShowMeter && !disabled;

  // Handle visibility with animation
  useEffect(() => {
    if (shouldShowMeter && isActive) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow fade-out animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match fade-out animation duration
      return () => clearTimeout(timer);
    }
  }, [shouldShowMeter, isActive]);
  
  // Regenerate zones when level changes
  useEffect(() => {
    setZones(generateMixedZones());
    setAfterimagePosition(null); // Clear afterimage when level changes
  }, [level]);

  // Regenerate zones whenever timing bar becomes visible (for random red zones each time)
  useEffect(() => {
    if (shouldShowMeter && isActive) {
      setZones(generateMixedZones());
    } else {
      setAfterimagePosition(null); // Clear afterimage when timing bar is hidden
    }
  }, [shouldShowMeter, isActive]);
  
  // Calculate zone positions
  const LEFT_RED_WIDTH = zones.leftRed;
  const LEFT_YELLOW_WIDTH = zones.leftYellow;
  const GREEN_WIDTH = zones.green;
  const RIGHT_YELLOW_WIDTH = zones.rightYellow;
  const RIGHT_RED_WIDTH = zones.rightRed;

  // Zone boundaries
  const LEFT_RED_END = LEFT_RED_WIDTH;
  const LEFT_YELLOW_END = LEFT_RED_END + LEFT_YELLOW_WIDTH;
  const GREEN_START = LEFT_YELLOW_END;
  const GREEN_END = GREEN_START + GREEN_WIDTH;
  const RIGHT_YELLOW_END = GREEN_END + RIGHT_YELLOW_WIDTH;
 
  // Animation setup
  useEffect(() => {
    if (!isMeterActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Get level-based speed from configuration
    const levelConfig = getLevelConfig(level);
    const speed = levelConfig?.meterSpeed || 2.0; // Default to 2.0 if level not found

    // Start the indicator animation
    intervalRef.current = window.setInterval(() => {
      setIndicatorPosition(prev => {
        let newPos = prev + (directionRef.current === 'right' ? speed : -speed);

        // Bounce off edges
        if (newPos >= 100) {
          newPos = 100;
          directionRef.current = 'left';
        } else if (newPos <= 0) {
          newPos = 0;
          directionRef.current = 'right';
        }

        return newPos;
      });
    }, 15); // 20 FPS

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMeterActive]);

  // Reset indicator when becoming active
  useEffect(() => {
    if (isMeterActive) {
      setIndicatorPosition(0);
      directionRef.current = 'right';
    }
  }, [isMeterActive]);

  const handleClick = () => {
    if (!isMeterActive || disabled) return;

    // Set afterimage at current indicator position
    setAfterimagePosition(indicatorPosition);

    // Clear afterimage after 2 seconds
    setTimeout(() => {
      setAfterimagePosition(null);
    }, 2000);

    let outcome: JumpOutcome;

    // Determine outcome based on indicator position
    if (indicatorPosition >= GREEN_START && indicatorPosition <= GREEN_END) {
      outcome = 'perfect';
    } else if (
      (indicatorPosition >= LEFT_RED_END && indicatorPosition < GREEN_START) ||
      (indicatorPosition > GREEN_END && indicatorPosition <= RIGHT_YELLOW_END)
    ) {
      outcome = 'good';
    } else {
      outcome = 'poor';
    }
    // onJumpAttempt (true);
    onJumpAttempt(outcome);
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${shouldShowMeter ? 'animate-fade-in' : 'animate-fade-out'}`}>
      <div className="text-white font-bold text-xl drop-shadow-lg">TIMING</div>
      
       <button
         onClick={handleClick}
         className="relative w-[500px] h-16 bg-gray-800 rounded-lg border-4 border-gray-700 hover:border-yellow-400 shadow-2xl overflow-hidden transition-colors focus:outline-none focus:border-yellow-400"
       >
        {/* Left Red Zone */}
        <div
          className="absolute top-0 bottom-0 bg-red-600"
          style={{ 
            left: '0%', 
            width: `${LEFT_RED_WIDTH}%`
          }}
        />

        {/* Left Yellow Zone */}
        <div
          className="absolute top-0 bottom-0 bg-yellow-500"
          style={{ 
            left: `${LEFT_RED_END}%`, 
            width: `${LEFT_YELLOW_WIDTH}%`
          }}
        />

        {/* Green Zone (Perfect) */}
        <div
          className="absolute top-0 bottom-0 bg-green-500"
          style={{ 
            left: `${GREEN_START}%`, 
            width: `${GREEN_WIDTH}%`
          }}
        />

        {/* Right Yellow Zone */}
        <div
          className="absolute top-0 bottom-0 bg-yellow-500"
          style={{ 
            left: `${GREEN_END}%`, 
            width: `${RIGHT_YELLOW_WIDTH}%`
          }}
        />

        {/* Right Red Zone */}
        <div
          className="absolute top-0 bottom-0 bg-red-600"
          style={{ 
            left: `${RIGHT_YELLOW_END}%`, 
            width: `${RIGHT_RED_WIDTH}%`
          }}
        />

        {/* Moving Indicator */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-yellow-300 shadow-lg"
          style={{
            left: `${indicatorPosition}%`,
            transform: 'translateX(-50%)',
            willChange: 'left',
          }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-200 rotate-45 shadow-xl"></div>
        </div>

        {/* Afterimage Indicator */}
        {afterimagePosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-3 bg-blue-800 opacity-60 shadow-lg"
            style={{
              left: `${afterimagePosition}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-700 rotate-45 shadow-xl"></div>
          </div>
        )}
      </button>

      <div className="text-white font-bold text-sm drop-shadow-lg">TAP TO JUMP</div>
    </div>
  );
};
