// ============================================================
// S.M.I.L.E Design System – Dark Glassmorphism Tokens
// ============================================================

// ── Color Palette ──────────────────────────────────────────
export const colors = {
  // Primary
  primary: "#92CDFD",
  primaryDark: "#003450",
  primaryGlow: "rgba(146,205,253,0.35)",
  primarySubtle: "rgba(146,205,253,0.08)",
  primaryBorder: "rgba(146,205,253,0.4)",
  primaryMuted: "rgba(146,205,253,0.15)",

  // Success / Mint
  success: "#45F0CF",
  successGlow: "rgba(69,240,207,0.35)",
  successSubtle: "rgba(69,240,207,0.08)",
  successBorder: "rgba(69,240,207,0.2)",
  successMuted: "rgba(69,240,207,0.15)",

  // Warning / Amber
  amber: "#F7BC68",
  amberSubtle: "rgba(247,188,104,0.1)",
  amberBorder: "rgba(247,188,104,0.3)",
  amberMuted: "rgba(247,188,104,0.3)",

  // Error / Red
  error: "#FFB4AB",
  errorSubtle: "rgba(255,180,171,0.15)",
  errorBorder: "rgba(255,180,171,0.3)",
  destructive: "#93000A",
  destructiveText: "#FFDAD6",
  destructiveGlow: "rgba(147,0,10,0.4)",

  // Backgrounds
  bg: "#111416",
  surface: "#1D2023",
  surfaceAlt: "#272A2D",
  surfaceHover: "#323538",
  surfaceDim: "rgba(17,20,22,0.8)",
  surfaceOverlay: "rgba(12,14,17,0.5)",

  // Text Hierarchy
  textPrimary: "#E1E2E6",
  textSecondary: "#C1C7CF",
  textTertiary: "#8B9199",
  textDisabled: "#41474E",

  // Glass
  glassBg: "rgba(255,255,255,0.03)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassBorderHover: "rgba(255,255,255,0.15)",
  glassDivider: "rgba(255,255,255,0.06)",
  glassDividerLight: "rgba(255,255,255,0.08)",
  glassInputBg: "rgba(255,255,255,0.04)",
  glassInputBorder: "rgba(255,255,255,0.1)",

  // Misc
  accentBlue: "#5B96C4",
  progressTrack: "#323538",
} as const;

// ── Typography ─────────────────────────────────────────────
export const fonts = {
  heading: "var(--font-public-sans, 'Public Sans')",
  label: "var(--font-space-grotesk, 'Space Grotesk')",
  body: "inherit",
} as const;

// ── Radii ──────────────────────────────────────────────────
export const radii = {
  xs: "6px",
  sm: "8px",
  md: "10px",
  lg: "12px",
  xl: "14px",
  "2xl": "16px",
  "3xl": "20px",
  "4xl": "24px",
  pill: "100px",
} as const;

// ── Shadows ────────────────────────────────────────────────
export const shadows = {
  glow: {
    primary: "0 0 15px rgba(146,205,253,0.3)",
    success: "0 0 15px rgba(69,240,207,0.3)",
    destructive: "0 0 12px rgba(147,0,10,0.4)",
  },
  card: "0 10px 15px rgba(0,0,0,0.2)",
  modal: "0 25px 50px -12px rgba(0,0,0,0.5)",
  elevated: "0 0 40px rgba(69,240,207,0.06), 0 25px 50px -12px rgba(0,0,0,0.5)",
} as const;

// ── Reusable Style Objects ─────────────────────────────────
export const glassCard: React.CSSProperties = {
  background: colors.glassBg,
  border: `1px solid ${colors.glassBorder}`,
  borderRadius: radii["3xl"],
  backdropFilter: "blur(10px)",
};

export const glassCardCompact: React.CSSProperties = {
  ...glassCard,
  borderRadius: radii["2xl"],
};

export const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: radii.lg,
  background: colors.glassInputBg,
  border: `1px solid ${colors.glassInputBorder}`,
  color: colors.textPrimary,
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
};

export const labelBase: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: colors.textSecondary,
  marginBottom: "8px",
  display: "block",
  fontFamily: fonts.label,
};

export const btnPrimary = (enabled = true): React.CSSProperties => ({
  padding: "14px 24px",
  borderRadius: radii.pill,
  background: enabled ? colors.primary : colors.surfaceHover,
  color: enabled ? colors.primaryDark : colors.textDisabled,
  fontFamily: fonts.label,
  fontSize: "14px",
  fontWeight: 600,
  border: "none",
  cursor: enabled ? "pointer" : "not-allowed",
  boxShadow: enabled ? shadows.glow.primary : "none",
});

export const btnSuccess = (enabled = true): React.CSSProperties => ({
  padding: "14px 24px",
  borderRadius: radii.pill,
  background: enabled ? colors.success : colors.surfaceHover,
  color: enabled ? colors.primaryDark : colors.textDisabled,
  fontFamily: fonts.label,
  fontSize: "14px",
  fontWeight: 700,
  border: "none",
  cursor: enabled ? "pointer" : "not-allowed",
  boxShadow: enabled ? shadows.glow.success : "none",
});

export const btnGhost: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: radii.pill,
  background: "transparent",
  border: `1px solid ${colors.glassBorderHover}`,
  color: colors.textSecondary,
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
};

export const btnDestructive = (enabled = true): React.CSSProperties => ({
  padding: "12px",
  borderRadius: radii.pill,
  background: enabled ? colors.destructive : colors.surfaceHover,
  color: enabled ? colors.destructiveText : colors.textDisabled,
  fontSize: "14px",
  fontWeight: 600,
  cursor: enabled ? "pointer" : "not-allowed",
  border: "none",
  fontFamily: fonts.label,
  boxShadow: enabled ? shadows.glow.destructive : "none",
});

// ── Ambient Background ─────────────────────────────────────
export const ambientBg: React.CSSProperties = {
  background: colors.bg,
  backgroundImage:
    "radial-gradient(ellipse at 15% 20%, rgba(91,150,196,0.08) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(69,240,207,0.05) 0%, transparent 50%)",
};

// ── Section Heading ────────────────────────────────────────
export const headingLg: React.CSSProperties = {
  fontFamily: fonts.heading,
  fontSize: "30px",
  fontWeight: 600,
  letterSpacing: "-0.75px",
  color: colors.textPrimary,
};

export const headingMd: React.CSSProperties = {
  fontFamily: fonts.heading,
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-0.5px",
  color: colors.textPrimary,
};

export const headingSm: React.CSSProperties = {
  fontFamily: fonts.heading,
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
};

export const subtitle: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textTertiary,
};

export const sectionLabel: React.CSSProperties = {
  fontFamily: fonts.label,
  fontSize: "11px",
  fontWeight: 600,
  color: colors.textSecondary,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};
