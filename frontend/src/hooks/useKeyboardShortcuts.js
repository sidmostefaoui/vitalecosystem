import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      const shortcut = shortcuts.find(s => 
        s.key === event.key && 
        s.ctrl === event.ctrlKey && 
        s.shift === event.shiftKey
      );
      
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}; 