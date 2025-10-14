// Email session storage utilities
const EMAIL_SESSION_KEY = 'equestrian_game_email';

export const getStoredEmail = (): string | null => {
  try {
    return sessionStorage.getItem(EMAIL_SESSION_KEY);
  } catch (error) {
    console.error('Error reading email from session storage:', error);
    return null;
  }
};

export const storeEmail = (email: string): void => {
  try {
    sessionStorage.setItem(EMAIL_SESSION_KEY, email);
  } catch (error) {
    console.error('Error storing email in session storage:', error);
  }
};

export const clearStoredEmail = (): void => {
  try {
    sessionStorage.removeItem(EMAIL_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing email from session storage:', error);
  }
};

// Clear email when browser is closed/refreshed
export const setupEmailCleanup = (): (() => void) => {
  // Clear email on page unload (browser close/refresh)
  const handleBeforeUnload = () => {
    clearStoredEmail();
  };

  // Clear email on page visibility change (tab close)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      clearStoredEmail();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};
