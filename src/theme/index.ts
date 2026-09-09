/**
 * "Us — Our Story" design system.
 * Warm dusk palette: near-black surfaces, rose accents, blush highlights.
 */
import { Platform } from 'react-native';

export const colors = {
  // Surfaces
  bg: '#0F0C0E',
  bgElevated: '#171317',
  surface: '#1C171B',
  surfaceAlt: '#241D23',
  surfacePressed: '#2C242A',
  border: '#2E262C',
  borderSoft: '#231D22',

  // Text
  text: '#FFFFFF',
  textSoft: '#E7DDE1',
  textMuted: '#A2959C',
  textFaint: '#6E646A',

  // Brand
  pink: '#E98CA3',
  pinkDeep: '#CE6C88',
  pinkPressed: '#B85C77',
  pinkSoft: '#F6D7DE',
  blush: '#FCEEF1',
  blushDeep: '#F7DCE3',

  // Accents
  gold: '#E4C08A',
  overlay: 'rgba(10,7,9,0.62)',
  overlayStrong: 'rgba(10,7,9,0.86)',
  scrim: 'rgba(0,0,0,0.35)',

  white: '#FFFFFF',
  black: '#000000',
  danger: '#E4676B',
  success: '#7FBF9B',
} as const;

export const gradients = {
  brand: ['#EE9AAF', '#CE6C88'] as const,
  dusk: ['#3A2530', '#1A1216'] as const,
  sunset: ['#F0A98F', '#D97E8E', '#7A4A64'] as const,
  scrimDown: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'] as const,
  scrimUp: ['rgba(0,0,0,0.75)', 'rgba(0,0,0,0)'] as const,
  card: ['rgba(233,140,163,0.18)', 'rgba(233,140,163,0.04)'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/**
 * The mockup uses a script face for "Us" and a clean sans for everything else.
 * We stay on system fonts so the app has zero font-bundling requirements;
 * `script` is the closest expressive system face on each platform.
 */
export const fonts = {
  script: Platform.select({ ios: 'Snell Roundhand', android: 'serif' }) as string,
  body: Platform.select({ ios: 'System', android: 'sans-serif' }) as string,
  bodyMedium: Platform.select({ ios: 'System', android: 'sans-serif-medium' }) as string,
};

export const type = {
  display: { fontSize: 44, lineHeight: 52, fontWeight: '300' as const, letterSpacing: 0.5 },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '600' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '500' as const, letterSpacing: 0.3 },
};

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 6 },
  }) as object,
  fab: Platform.select({
    ios: {
      shadowColor: colors.pinkDeep,
      shadowOpacity: 0.5,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 10 },
  }) as object,
};

/** RN 0.87 dropped `StyleSheet.absoluteFillObject` from its types. */
export const absFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

export const theme = { colors, gradients, spacing, radius, type, fonts, shadow };
export type Theme = typeof theme;
