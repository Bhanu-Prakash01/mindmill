import { useEffect } from 'react';

/**
 * Calls the provided callback when the Escape key is pressed.
 * @param {() => void} callback - Function to call on Escape key press
 * @param {boolean} enabled - Whether the listener is active (default: true)
 */
export function useEscapeKey(callback, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [callback, enabled]);
}

export default useEscapeKey;
