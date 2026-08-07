import type { TextStyle } from 'react-native';

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
  },
  pageTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeights.bold,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeights.semibold,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: fontWeights.regular,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeights.semibold,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
  },
} as const satisfies Record<string, TextStyle>;
