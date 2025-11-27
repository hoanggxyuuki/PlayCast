// 🎨 DARK PROFESSIONAL THEME
export const Colors = {
  // Professional Blue Accent
  primary: '#3b82f6', // Clean Blue
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  primaryGlow: 'rgba(59, 130, 246, 0.15)',

  // Subtle Purple Accent
  secondary: '#8b5cf6', // Soft Purple
  secondaryDark: '#7c3aed',
  secondaryLight: '#a78bfa',
  secondaryGlow: 'rgba(139, 92, 246, 0.15)',

  // Muted Gold Accent
  accent: '#f59e0b', // Amber
  accentDark: '#d97706',
  accentLight: '#fbbf24',
  accentGlow: 'rgba(245, 158, 11, 0.15)',

  // Elegant Purple
  purple: '#a855f7',
  purpleGlow: 'rgba(168, 85, 247, 0.15)',

  // Dark Professional Backgrounds
  background: '#0a0a0a', // Pure dark
  backgroundLight: '#121212',
  backgroundCard: '#1a1a1a',
  backgroundElevated: '#1f1f1f',

  // Subtle Surfaces
  surface: '#242424',
  surfaceLight: '#2a2a2a',
  surfaceGlow: 'rgba(255, 255, 255, 0.02)',

  // Clean Text
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textGlow: 'rgba(255, 255, 255, 0.05)',

  // Professional Status Colors
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Minimal Borders
  border: '#27272a',
  borderLight: '#3f3f46',
  borderGlow: 'rgba(255, 255, 255, 0.05)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.9)',
  overlayLight: 'rgba(0, 0, 0, 0.7)',
  overlayGlow: 'rgba(255, 255, 255, 0.02)',

  // Gradients
  gradientStart: '#3b82f6',
  gradientEnd: '#8b5cf6',
  gradientPink: '#a855f7',

  transparent: 'transparent',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Subtle professional shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 5.46,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 7.49,
    elevation: 10,
  },
  // Subtle accent shadows (keeping names for compatibility)
  neonCyan: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  neonMagenta: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  neonPurple: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  neonGold: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
};

export const Layout = {
  window: {
    width: 0, // Will be set dynamically
    height: 0, // Will be set dynamically
  },
  isSmallDevice: false, // Will be set dynamically
};
