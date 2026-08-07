import { palette } from './palette';
import { radii, shadows, sizes, spacing } from './metrics';
import { typography } from './typography';

export const lightTheme = {
  mode: 'light',
  statusBarStyle: 'dark',
  colors: {
    background: palette.neutral[50],
    surface: palette.white,
    surfaceSoft: palette.neutral[100],
    surfaceMuted: palette.neutral[200],
    primary: palette.green[700],
    primaryPressed: palette.green[800],
    primarySoft: palette.green[50],
    accent: palette.mint[500],
    accentStrong: palette.mint[700],
    accentSoft: palette.mint[100],
    textPrimary: palette.neutral[800],
    textSecondary: palette.neutral[600],
    textMuted: palette.neutral[500],
    textOnPrimary: palette.white,
    border: palette.neutral[300],
    divider: palette.neutral[200],
    disabled: palette.neutral[400],
    success: palette.green[600],
    successSoft: palette.green[50],
    warning: palette.amber[700],
    warningAccent: palette.amber[500],
    warningSoft: palette.amber[50],
    danger: palette.red[700],
    dangerAccent: palette.red[500],
    dangerSoft: palette.red[50],
    overlay: 'rgba(5, 42, 32, 0.48)',
  },
  typography,
  spacing,
  radii,
  sizes,
  shadows,
} as const;

export type AppTheme = typeof lightTheme;
