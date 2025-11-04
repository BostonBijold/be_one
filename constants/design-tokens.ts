/**
 * Design Tokens - Consolidated spacing, sizing, and styling constants
 * These tokens create a consistent design system across the app
 */

/**
 * SPACING - Used for padding, margin, and gaps
 * Follow the pattern: XS (4px) -> S (8px) -> M (12px) -> L (16px) -> XL (20px) -> 2XL (24px) -> 3XL (32px) -> 4XL (48px)
 */
export const SPACING = {
  XXS: 2,
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  HUGE: 48,
  GIANT: 64,
} as const;

/**
 * FONT SIZES - iOS minimum is 12px for body text
 * Follows Apple's SF Pro Display typographic scale
 */
export const FONT_SIZE = {
  CAPTION: 10,
  SMALL: 12,
  BODY: 14,
  BODY_LARGE: 16,
  SUBHEADING: 18,
  HEADING_SMALL: 20,
  HEADING: 24,
  HEADING_LARGE: 28,
  DISPLAY_SMALL: 32,
  DISPLAY: 36,
  DISPLAY_LARGE: 48,
} as const;

/**
 * BORDER RADIUS - For buttons, cards, modals, and other rounded elements
 */
export const BORDER_RADIUS = {
  NONE: 0,
  SMALL: 4,
  MEDIUM: 6,
  DEFAULT: 8,
  LARGE: 12,
  XL: 16,
  XXL: 20,
  ROUNDED: 24,
  CIRCLE: 50,
} as const;

/**
 * OPACITY - For disabled states, hover states, and layering
 * WCAG AA compliant opacity values
 */
export const OPACITY = {
  TRANSPARENT: 0,
  SUBTLE: 0.1,
  LIGHT: 0.15,
  SOFT: 0.2,
  MEDIUM: 0.3,
  DISABLED: 0.6,
  HOVER: 0.8,
  FULL: 1,
} as const;

/**
 * SHADOWS - iOS shadow configurations
 * Shadow values include both iOS (shadowOffset/shadowOpacity/shadowRadius) and Android (elevation)
 */
export const SHADOWS = {
  NONE: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  SMALL: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  MEDIUM: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  LARGE: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/**
 * DIMENSIONS - Fixed sizes for icons, buttons, and circles
 */
export const DIMENSIONS = {
  ICON_SM: 20,
  ICON_MD: 24,
  ICON_LG: 28,
  ICON_XL: 32,
  BUTTON_HEIGHT: 44,
  CIRCLE_SMALL: 50,
  CIRCLE_MEDIUM: 80,
  CIRCLE_LARGE: 100,
  TIMER_DISPLAY: 340,
  LOGO_SIZE: 96,
} as const;

/**
 * LINE HEIGHT - For text readability
 * Follows standard typographic line height ratios
 */
export const LINE_HEIGHT = {
  TIGHT: 16,
  NORMAL: 20,
  RELAXED: 24,
} as const;

/**
 * TIMING - Animation and delay durations in milliseconds
 */
export const TIMING = {
  INSTANT: 100,
  QUICK: 300,
  NORMAL: 500,
  SLOW: 1000,
  DEFAULT_HABIT_DURATION_MS: 600000, // 10 minutes
} as const;

/**
 * Z_INDEX - Layering order for overlays and modals
 */
export const Z_INDEX = {
  BASE: 0,
  OVERLAY: 10,
  MODAL: 20,
  TOOLTIP: 30,
  MAX: 999,
} as const;

/**
 * SAFE AREA - Safe area padding for notches and dynamic islands
 * Used with useSafeAreaInsets() hook
 */
export const SAFE_AREA = {
  MIN_HORIZONTAL_PADDING: 16,
  MIN_VERTICAL_PADDING: 40,
  MODAL_PADDING_ADJUSTMENT: 16,
} as const;

/**
 * Preset style combinations - commonly used style objects
 */
export const PRESET_STYLES = {
  // Text styles
  captionText: {
    fontSize: FONT_SIZE.CAPTION,
    lineHeight: LINE_HEIGHT.TIGHT,
  },
  bodyText: {
    fontSize: FONT_SIZE.BODY,
    lineHeight: LINE_HEIGHT.NORMAL,
  },
  headingText: {
    fontSize: FONT_SIZE.HEADING,
    lineHeight: LINE_HEIGHT.RELAXED,
  },

  // Container styles
  card: {
    borderRadius: BORDER_RADIUS.LARGE,
    ...SHADOWS.MEDIUM,
    padding: SPACING.LG,
  },
  modal: {
    borderRadius: BORDER_RADIUS.XXL,
    ...SHADOWS.LARGE,
  },
  button: {
    borderRadius: BORDER_RADIUS.DEFAULT,
    height: DIMENSIONS.BUTTON_HEIGHT,
    paddingHorizontal: SPACING.LG,
  },
} as const;

/**
 * Accessibility constants
 * iOS minimum touch target size is 44x44 points
 */
export const ACCESSIBILITY = {
  MIN_TOUCH_TARGET: DIMENSIONS.BUTTON_HEIGHT,
  ICON_BUTTON_SIZE: DIMENSIONS.CIRCLE_SMALL,
} as const;

// Export type for design token keys
export type DesignTokens = {
  SPACING: typeof SPACING;
  FONT_SIZE: typeof FONT_SIZE;
  BORDER_RADIUS: typeof BORDER_RADIUS;
  OPACITY: typeof OPACITY;
  SHADOWS: typeof SHADOWS;
  DIMENSIONS: typeof DIMENSIONS;
  LINE_HEIGHT: typeof LINE_HEIGHT;
  TIMING: typeof TIMING;
  Z_INDEX: typeof Z_INDEX;
  SAFE_AREA: typeof SAFE_AREA;
  PRESET_STYLES: typeof PRESET_STYLES;
  ACCESSIBILITY: typeof ACCESSIBILITY;
};
