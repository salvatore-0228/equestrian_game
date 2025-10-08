import { useState } from "react";
import { X } from "lucide-react";

interface EndModalProps {
  onOpen?: () => void;
  onClose?: () => void;
}

export const EndModal = ({ onOpen, onClose }: EndModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setIsOpen(true);
    try {
      onOpen?.();
    } catch (e) {}
  };

  const close = () => {
    setIsOpen(false);
    try {
      onClose?.();
    } catch (e) {}
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={open}
        className="fixed top-4 right-4 w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors duration-200 z-50"
        aria-label="End game"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="flex flex-col gap-4 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          {/* Modal Content */}
          <div className="text-5xl text-white">CECILIA</div>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center gap-8">
              {/* Title */}
              <h2 className="text-red-600 text-4xl font-bold text-center pixel-font translate-y-[50%]">
                DO YOU WANT TO LEAVE THE GAME?
              </h2>

              {/* Buttons container */}
              <div className="flex gap-4 justify-center translate-y-[100%]">
                <button
                  onClick={() => {
                    close();
                  }}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-xl transition-colors duration-200 min-w-[200px] pixel-font"
                >
                  BACK TO GAME
                </button>
                <button
                  onClick={() => {
                    close();
                    // Try to close the window
                    try {
                      window.close();
                      // If window.close() doesn't work (most browsers), show a message
                      setTimeout(() => {
                        alert(
                          "Please close your browser window to exit the game completely."
                        );
                      }, 100);
                    } catch (e) {
                      alert(
                        "Please close your browser window to exit the game completely."
                      );
                    }
                  }}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-xl transition-colors duration-200 min-w-[200px] pixel-font"
                >
                  YES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
