// Smart Message Audio Player – Design System
export const Colors = {
  // Base surfaces
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#1C2128',
  surfaceBorder: '#30363D',

  // Brand / Accent
  primary: '#00B4D8',
  primaryDim: '#0077A8',
  accent: '#7C3AED',
  accentDim: '#5B21B6',

  // Semantic
  success: '#22C55E',
  successDim: '#166534',
  warning: '#F59E0B',
  warningDim: '#92400E',
  error: '#EF4444',
  errorDim: '#7F1D1D',
  info: '#3B82F6',

  // Text
  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  textDisabled: '#484F58',
  textOnAccent: '#FFFFFF',

  // Status specific
  connected: '#22C55E',
  disconnected: '#EF4444',
  connecting: '#F59E0B',

  // Cards
  cardBg: '#161B22',
  cardBorder: '#21262D',
  cardShadow: '#010409',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
