// 🎨 PLAYCAST THEME - Purple Gradient Edition
// Modern, premium design inspired by Spotify

// Main gradient colors
export const Gradients = {
  primary: ['#667eea', '#764ba2'],
  secondary: ['#f093fb', '#f5576c'],
  accent: ['#4facfe', '#00f2fe'],
  dark: ['#0f0f23', '#1a1a2e'],
  card: ['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)'],
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
};

export const Colors = {
  // Primary Purple
  primary: '#764ba2',
  primaryLight: '#9b6dbd',
  primaryDark: '#5a3680',
  primaryGlow: 'rgba(118, 75, 162, 0.3)',

  // Secondary Pink
  secondary: '#f093fb',
  secondaryLight: '#f5b0fc',
  secondaryDark: '#d070e0',
  secondaryGlow: 'rgba(240, 147, 251, 0.3)',

  // Accent Cyan
  accent: '#4facfe',
  accentLight: '#7fc4ff',
  accentDark: '#2090e0',
  accentGlow: 'rgba(79, 172, 254, 0.3)',

  // Vibrant highlights
  pink: '#ec4899',
  orange: '#f97316',
  green: '#10b981',
  yellow: '#fbbf24',
  red: '#ef4444',
  cyan: '#22d3ee',

  // Dark Backgrounds
  background: '#0f0f23',
  backgroundLight: '#16162a',
  backgroundCard: '#1e1e3a',
  backgroundElevated: '#252545',

  // Glassmorphism Surfaces
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceLight: 'rgba(255, 255, 255, 0.08)',
  surfaceActive: 'rgba(255, 255, 255, 0.12)',
  surfaceGlow: 'rgba(118, 75, 162, 0.1)',

  // Text
  text: '#ffffff',
  textSecondary: '#a1a1c7',
  textTertiary: '#6b6b8a',
  textMuted: '#4a4a6a',

  // Status
  success: '#10b981',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#4facfe',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  borderActive: 'rgba(118, 75, 162, 0.5)',

  // Overlays
  overlay: 'rgba(15, 15, 35, 0.95)',
  overlayLight: 'rgba(15, 15, 35, 0.8)',
  overlayDark: 'rgba(0, 0, 0, 0.9)',

  // Transparent
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 40,
};

export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

// Modern shadows with glow effect
export const Shadows = {
  sm: {
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowPink: {
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowCyan: {
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Glassmorphism styles
export const Glass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dark: {
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  purple: {
    backgroundColor: 'rgba(118, 75, 162, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(118, 75, 162, 0.3)',
  },
};

// Animation durations
export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Layout helpers
export const Layout = {
  screenPadding: Spacing.lg,
  cardPadding: Spacing.md,
  listItemHeight: 72,
  tabBarHeight: 80,
  headerHeight: 60,
  heroHeight: 200,
};
