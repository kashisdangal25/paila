import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'forest';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeColors = {
  light: {
    bg: 'bg-stone-50',
    bgSecondary: 'bg-white',
    text: 'text-stone-800',
    textSecondary: 'text-stone-600',
    textMuted: 'text-stone-400',
    border: 'border-stone-200',
    card: 'bg-white',
    accent: 'forest-600',
    accentBg: 'bg-forest-50',
  },
  dark: {
    bg: 'bg-stone-900',
    bgSecondary: 'bg-stone-800',
    text: 'text-stone-100',
    textSecondary: 'text-stone-300',
    textMuted: 'text-stone-500',
    border: 'border-stone-700',
    card: 'bg-stone-800',
    accent: 'forest-400',
    accentBg: 'bg-forest-900/30',
  },
  forest: {
    bg: 'bg-forest-900',
    bgSecondary: 'bg-forest-800',
    text: 'text-forest-50',
    textSecondary: 'text-forest-200',
    textMuted: 'text-forest-400',
    border: 'border-forest-700',
    card: 'bg-forest-800',
    accent: 'forest-300',
    accentBg: 'bg-forest-700/50',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('paila-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'forest') {
      return stored;
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('paila-theme', theme);

    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'forest');
    root.classList.add(theme);

    if (theme === 'dark' || theme === 'forest') {
      root.style.colorScheme = 'dark';
    } else {
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const resolvedTheme = theme === 'forest' ? 'dark' : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeColors() {
  const { theme } = useTheme();
  return themeColors[theme];
}

export { themeColors };
