import React, { useState, useEffect } from "react";
import defaultGirl from "../assets/characters/default_girl.jpg";
import blondeGirl from "../assets/characters/blonde.jpg";
import brownGirl from "../assets/characters/brown.jpg";
import asianGirl from "../assets/characters/asian.jpg";
import boy from "../assets/characters/boy.jpg";
import tempGif from "../assets/temp.gif";
import horse1 from "../assets/horses/horse1.png";
import horse2 from "../assets/horses/horse2.png";
import horse3 from "../assets/horses/horse3.png";
import { GameState } from "../types/game";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface AvatarSelectProps {
  onStart: (
    playerName: string,
    avatarId: number,
    horseId: number
  ) => void | Promise<any>;
  setGameState: (state: GameState) => void;
}

const AVATARS = [
  {
    id: 1,
    name: "Brown Hair",
    description: "Girl with brown hair",
    asset: defaultGirl,
  },
  {
    id: 2,
    name: "Blonde Hair",
    description: "Girl with blonde hair",
    asset: blondeGirl,
  },
  {
    id: 3,
    name: "Brown Skin",
    description: "Girl with brown skin",
    asset: brownGirl,
  },
  {
    id: 4,
    name: "Golden Skin",
    description: "Girl with golden skin",
    asset: asianGirl,
  },
  { id: 5, name: "Boy", description: "Boy with brown hair", asset: boy },
];

const HORSES = [
  { id: 1, name: "Grey", color: "#9CA3AF", asset: horse1 },
  { id: 2, name: "Black", color: "#1F2937", asset: horse2 },
  { id: 3, name: "Brown", color: "#92400E", asset: horse3 },
];

export const AvatarSelect = ({ onStart, setGameState }: AvatarSelectProps) => {
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [selectedHorse, setSelectedHorse] = useState(1);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [horseSlideDirection, setHorseSlideDirection] = useState<"left" | "right" | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = "Player";
    onStart(name, selectedAvatar, selectedHorse);
  };

  const onClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGameState('menu');
  };

  return (
    <div className="h-full bg-[#072d2a] items-center justify-center p-6 relative">
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-500 text-white hover:bg-gray-300 transition-all shadow-md absolute"
      >
        <ArrowLeft size={20} />
        <span>BACK</span>
      </button>
      <div className="flex flex-col w-[70%] h-full rounded-3xl overflow-hidden p-8 m-auto">
        <div className="text-center mt-8 pt-8">
          <h1
            className="text-6xl md:text-7xl lg:text-7xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            CECILIA
          </h1>
          <h1
            className="text-5xl md:text-7xl font-black text-yellow-200"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            JUMPER CLASSIC
          </h1>
        </div>

        <div className="flex flex-1 flex-row gap-[3dvw] items-center">
          {/* Avatar panel */}
          <div className="w-[15dvw] relative">
            <div className="bg-red-700 text-lg text-white font-bold py-3 px-4 rounded-lg text-center mb-3">
              CHOOSE AVATAR
            </div>
            <div className="bg-transparent rounded-lg border-4 border-red-600 shadow-inner backdrop-blur-sm relative">
              <div className="w-full h-[40dvh] bg-white/30 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="relative w-full h-full overflow-hidden bg-transparent">
                  <div 
                    className={`w-full h-full transition-transform duration-300 ease-in-out ${
                      slideDirection === "left" ? "-translate-x-full" :
                      slideDirection === "right" ? "translate-x-full" : ""
                    }`}
                    onTransitionEnd={() => setSlideDirection(null)}
                  >
                    <img
                      src={AVATARS.find((a) => a.id === selectedAvatar)!.asset}
                      alt="selected"
                      className="w-full h-full object-cover pixelated"
                    />
                  </div>
                </div>
              </div>

              {/* Nav buttons moved outside the overflow-hidden area so they aren't clipped */}
              <button
                type="button"
                onClick={() => {
                  setSlideDirection("right");
                  setTimeout(() => {
                    setSelectedAvatar((s) => Math.max(1, s - 1));
                  }, 150);
                }}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white w-12 h-12 rounded-lg flex items-center justify-center border-2 border-red-600 text-red-600 shadow-lg hover:bg-red-600 hover:text-white active:scale-95 active:shadow-inner active:bg-red-700 transition-all duration-200"
                aria-label="previous avatar"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSlideDirection("left");
                  setTimeout(() => {
                    setSelectedAvatar((s) => Math.min(AVATARS.length, s + 1));
                  }, 150);
                }}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white w-12 h-12 rounded-lg flex items-center justify-center border-2 border-red-600 text-red-600 shadow-lg hover:bg-red-600 hover:text-white active:scale-95 active:shadow-inner active:bg-red-700 transition-all duration-200"
                aria-label="next avatar"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Horse panel */}
          <div className="w-[30dvw]">
            <div className="w-full h-full">
              <div className="bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-center mb-3">
                CHOOSE HORSE
              </div>
              <div className="bg-transparent rounded-lg border-4 border-red-600 shadow-inner backdrop-blur-sm relative">
                <div className="flex h-[40dvh] items-center justify-center bg-white/30">
                  <div className="relative w-full h-full overflow-hidden bg-transparent">
                    <div 
                      className={`w-full h-full flex items-center justify-center transition-transform duration-300 ease-in-out ${
                        horseSlideDirection === "left" ? "-translate-x-full" :
                        horseSlideDirection === "right" ? "translate-x-full" : ""
                      }`}
                      onTransitionEnd={() => setHorseSlideDirection(null)}
                    >
                      <img
                        src={HORSES.find((h) => h.id === selectedHorse)!.asset}
                        alt={`Horse ${selectedHorse}`}
                        className="w-full h-full object-cover pixelated"
                      />
                    </div>
                  </div>
                </div>

                {/* Nav buttons moved outside the overflow-hidden area so they aren't clipped */}
                <button
                  type="button"
                  onClick={() => {
                    setHorseSlideDirection("right");
                    setTimeout(() => {
                      setSelectedHorse((s) => Math.max(1, s - 1));
                    }, 150);
                  }}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white w-12 h-12 rounded-lg flex items-center justify-center border-2 border-red-600 text-red-600 shadow-lg hover:bg-red-600 hover:text-white active:scale-95 active:shadow-inner active:bg-red-700 transition-all duration-200"
                  aria-label="previous horse"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHorseSlideDirection("left");
                    setTimeout(() => {
                      setSelectedHorse((s) => Math.min(HORSES.length, s + 1));
                    }, 150);
                  }}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white w-12 h-12 rounded-lg flex items-center justify-center border-4 border-red-600 text-red-600 shadow-lg hover:bg-red-600 hover:text-white active:scale-95 active:shadow-inner active:bg-red-700 transition-all duration-200"
                  aria-label="next horse"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Animated preview and start button */}
          <div className="col-span-3 flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-center">
              <div className="w-72 h-72 bg-transparent flex items-center justify-center">
                <img
                  src={tempGif}
                  alt="animated rider"
                  className="w-64 h-auto object-contain"
                />
              </div>
            </div>

            <div className="w-full flex items-end justify-center mt-4">
              <button
                onClick={() => handleSubmit()}
                className="bg-red-700 text-white font-black py-4 px-8 rounded-2xl text-xl border-4 border-red hover:scale-105 transition-transform"
              >
                TAP TO RIDE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
