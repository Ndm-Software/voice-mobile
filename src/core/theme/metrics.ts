import type { ViewStyle } from 'react-native';

import { palette } from './palette';

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radii = {
  none: 0,
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const sizes = {
  touchTarget: 44,
  inputHeight: 52,
  buttonHeight: 52,
  contentMaxWidth: 420,
  icon: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  iconStrokeWidth: 1.75,
} as const;

export const shadows = {
  none: {} satisfies ViewStyle,
  card: {
    shadowColor: palette.green[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  floating: {
    shadowColor: palette.green[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,
} as const;
