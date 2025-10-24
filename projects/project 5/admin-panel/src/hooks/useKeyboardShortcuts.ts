import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  
  const shortcuts: ShortcutConfig[] = [
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
    },
    {
      key: 'd',
      altKey: true,
      action: () => navigate('/dashboard'),
      description: 'Go to dashboard',
    },
    {
      key: 'u',
      altKey: true,
      action: () => navigate('/users'),
      description: 'Go to users',
    },
    {
      key: 'o',
      altKey: true,
      action: () => navigate('/orders'),
      description: 'Go to orders',
    },
    {
      key: 't',
      altKey: true,
      action: () => navigate('/tasks'),
      description: 'Go to tasks',
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals, clear focus, etc.
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }
      },
      description: 'Clear focus/close modals',
    },
  ];
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Exception for search shortcut
        if (event.key !== '/') {
          return;
        }
      }
      
      const shortcut = shortcuts.find(s => 
        s.key === event.key &&
        !!s.ctrlKey === event.ctrlKey &&
        !!s.altKey === event.altKey &&
        !!s.shiftKey === event.shiftKey
      );
      
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  return { shortcuts };
};