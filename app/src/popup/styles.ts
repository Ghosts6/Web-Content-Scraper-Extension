/**
 * Style constants for the popup UI
 * Consolidates all inline styles for consistency and maintainability
 */

export const COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4338ca',
  secondary: '#64748b',
  secondaryLight: '#cbd5e1',
  secondaryWeak: '#94a3b8',
  success: '#15803d',
  error: '#dc2626',
  errorWeak: '#ef4444',
  warning: '#f59e0b',
  text: {
    primary: '#1e293b',
    secondary: '#475569',
    tertiary: '#64748b',
    weak: '#94a3b8',
    white: 'white',
  },
  bg: {
    primary: 'white',
    secondary: 'rgba(241, 245, 249, 0.9)',
    tertiary: 'rgba(248, 250, 255, 0.95)',
    overlay: 'rgba(15, 23, 42, 0.85)',
  },
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
};

export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
};

// Common style objects

export const baseButtonStyle = {
  border: 'none',
  borderRadius: RADIUS.md,
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: SPACING.xs,
} as const;

export const primaryButtonStyle = {
  ...baseButtonStyle,
  background: `linear-gradient(90deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 55%, ${COLORS.primaryLight} 100%)`,
  color: COLORS.text.white,
  padding: `9px 16px`,
  boxShadow: `0 3px 12px rgba(99, 102, 241, 0.38)`,
} as const;

export const secondaryButtonStyle = {
  ...baseButtonStyle,
  background: `rgba(99, 102, 241, 0.05)`,
  color: COLORS.primary,
  border: `1px solid rgba(99, 102, 241, 0.22)`,
  padding: `9px 10px`,
} as const;

export const cardStyle = {
  background: COLORS.bg.primary,
  border: `1px solid rgba(203, 213, 225, 0.6)`,
  borderRadius: RADIUS.md,
  padding: `${SPACING.lg} 16px`,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
} as const;

export const errorBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: SPACING.xs,
  padding: `${SPACING.xs} ${SPACING.md}`,
  borderRadius: RADIUS.md,
  background: 'rgba(239, 68, 68, 0.06)',
  border: `1px solid rgba(239, 68, 68, 0.2)`,
  marginBottom: '12px',
  fontSize: '11px',
  color: COLORS.error,
} as const;

export const statusLabelStyle = {
  fontFamily: "'Courier New', monospace",
  fontSize: '10px',
  letterSpacing: '0.02em',
} as const;

// Helper function to apply disabled state
export const getDisabledStyles = (disabled: boolean) => ({
  opacity: disabled ? 0.5 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
  pointerEvents: disabled ? 'none' as const : 'auto' as const,
});
