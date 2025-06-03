// src/components/ThemeToggleButton.tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext'; // Adjust path if needed
import { Sun, Moon, Laptop } from 'lucide-react'; // Icons for themes
import { useEffect, useState } from 'react';

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  // Use a local state to manage the button's icon/aria-label based on the effective theme,
  // especially when 'system' is selected, to show what 'system' resolves to.
  const [currentEffectiveTheme, setCurrentEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // This effect runs on mount and when theme changes to determine the initial effective theme.
    if (typeof window !== 'undefined') {
      if (theme === 'system') {
        setCurrentEffectiveTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        setCurrentEffectiveTheme(theme);
      }
    }
  }, [theme]);

  // Effect to update icon if system theme changes while 'system' is selected
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setCurrentEffectiveTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]); // Rerun if theme changes to/from 'system'

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else { // theme === 'system'
      setTheme('light');
    }
  };

  const getNextThemeName = (currentSelectedTheme: typeof theme) => {
     if (currentSelectedTheme === 'light') return 'Dark'; // Next is Dark mode
     if (currentSelectedTheme === 'dark') return 'System'; // Next is System mode
     return 'Light'; // Next is Light mode (from System)
  };

  const getTitleAndAriaLabel = () => {
    // The title/aria-label should reflect what activating the button *will do*
    const nextThemeState = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    let actionDescription = '';
    if (nextThemeState === 'light') actionDescription = 'Light Mode';
    else if (nextThemeState === 'dark') actionDescription = 'Dark Mode';
    else actionDescription = 'System Preference';
    return `Switch to ${actionDescription}`;
  };


  const renderIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-5 w-5 text-amber-500" />;
    }
    if (theme === 'dark') {
      return <Moon className="h-5 w-5 text-slate-300" />; // Moon shown when dark is explicitly selected
    }
    // theme === 'system'
    if (currentEffectiveTheme === 'dark') {
      return <Laptop className="h-5 w-5 text-slate-300" />; // System is active, and it's currently dark
    }
    return <Laptop className="h-5 w-5 text-slate-600" />; // System is active, and it's currently light
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
      aria-label={getTitleAndAriaLabel()}
      title={getTitleAndAriaLabel()}
    >
      {renderIcon()}
      <span className="sr-only">{`Current theme setting: ${theme}. Effective theme: ${currentEffectiveTheme}. ${getTitleAndAriaLabel()}`}</span>
    </button>
  );
}
