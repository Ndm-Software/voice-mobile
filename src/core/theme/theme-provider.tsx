import { createContext, type PropsWithChildren, useContext } from 'react';

import { lightTheme, type AppTheme } from './theme';

const ThemeContext = createContext<AppTheme | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme, ThemeProvider içinde kullanılmalıdır.');
  }

  return theme;
}
