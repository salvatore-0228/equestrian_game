import { useState } from 'react';

interface EmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => void;
}

export const EmailLoginModal = ({ isOpen, onClose, onEmailSubmit }: EmailLoginModalProps) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setIsValid(false);
      return;
    }

    if (!validateEmail(email)) {
      setIsValid(false);
      return;
    }

    onEmailSubmit(email.trim());
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setIsValid(true); // Reset validation on change
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sky-200 bg-opacity-80 rounded-xl shadow-2xl p-12 max-w-2xl w-full mx-4 border-4 border-blue-900 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to Equestrian Game!
          </h2>
          <p className="text-lg text-gray-600">
            Enter your email to save your scores and track your progress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-3">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-6 py-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-lg ${
                isValid ? 'border-gray-300' : 'border-red-500'
              }`}
              placeholder="Enter your email address"
              autoFocus
            />
            {!isValid && (
              <p className="text-red-500 text-sm mt-1">
                Please enter a valid email address
              </p>
            )}
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-lg"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Continue
            </button>
          </div>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Your email will be stored locally and used to save your game scores
        </p>
      </div>
    </div>
  );
};
