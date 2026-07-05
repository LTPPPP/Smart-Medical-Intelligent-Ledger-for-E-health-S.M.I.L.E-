// ============================================================
// S.M.I.L.E – Shared Glass UI Primitives
// ============================================================
"use client";

import { forwardRef, type ReactNode, type CSSProperties } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { colors, fonts, radii, glassCard as glassBase, shadows } from "@/styles/tokens";

// ── GlassCard ──────────────────────────────────────────────
interface GlassCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  variant?: "default" | "success" | "primary" | "amber" | "error";
  compact?: boolean;
  hover?: boolean;
}

const VARIANT_MAP = {
  default: { bg: glassBase.background, border: glassBase.border },
  success: { bg: "rgba(56, 189, 248,0.04)", border: `1px solid ${colors.successBorder}` },
  primary: { bg: colors.primarySubtle, border: `1px solid ${colors.primaryBorder}` },
  amber: { bg: colors.amberSubtle, border: `1px solid ${colors.amberBorder}` },
  error: { bg: colors.errorSubtle, border: `1px solid ${colors.errorBorder}` },
};

export function GlassCard({
  children,
  style,
  className,
  variant = "default",
  compact,
  hover,
}: GlassCardProps) {
  const v = VARIANT_MAP[variant];
  return (
    <div
      className={className}
      style={{
        background: v.bg,
        border: v.border,
        borderRadius: compact ? radii["2xl"] : radii["3xl"],
        backdropFilter: "blur(10px)",
        transition: hover ? "border-color 0.2s, background 0.2s" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── SectionHeading ─────────────────────────────────────────
interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  size?: "lg" | "md" | "sm";
  style?: CSSProperties;
}

export function SectionHeading({ title, subtitle, size = "lg", style }: SectionHeadingProps) {
  const sizeMap = {
    lg: { fontSize: "30px", letterSpacing: "-0.75px" },
    md: { fontSize: "22px", letterSpacing: "-0.5px" },
    sm: { fontSize: "16px", letterSpacing: "-0.25px" },
  };
  return (
    <div style={style}>
      <h1
        style={{
          fontFamily: fonts.heading,
          fontSize: sizeMap[size].fontSize,
          fontWeight: 600,
          letterSpacing: sizeMap[size].letterSpacing,
          color: colors.textPrimary,
          marginBottom: subtitle ? "6px" : 0,
        }}
      >
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: "14px", color: colors.textTertiary }}>{subtitle}</p>}
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────
interface StatusBadgeProps {
  label: string;
  dotColor: string;
  bgColor: string;
}

export function StatusBadge({ label, dotColor, bgColor }: StatusBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 10px",
        borderRadius: radii.sm,
        background: bgColor,
        fontSize: "12px",
        fontWeight: 500,
        color: dotColor,
        fontFamily: fonts.label,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ── MethodBadge ────────────────────────────────────────────
interface MethodBadgeProps {
  label: string;
  color: string;
}

export function MethodBadge({ label, color }: MethodBadgeProps) {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: radii.sm,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: fonts.label,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

// ── IconBox ────────────────────────────────────────────────
interface IconBoxProps {
  children: ReactNode;
  size?: number;
  radius?: string;
  bg?: string;
  border?: string;
}

export function IconBox({
  children,
  size = 52,
  radius = radii.xl,
  bg = colors.primarySubtle,
  border,
}: IconBoxProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        border: border ?? `1px solid ${colors.primaryBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// ── AmbientOrb ─────────────────────────────────────────────
interface AmbientOrbProps {
  color?: string;
  size?: number;
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  blur?: number;
}

export function AmbientOrb({
  color = "rgba(146,205,253,0.04)",
  size = 300,
  top,
  left,
  bottom,
  right,
  blur = 60,
}: AmbientOrbProps) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        bottom,
        right,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: `blur(${blur}px)`,
        pointerEvents: "none",
      }}
    />
  );
}

// ── InfoRow ────────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value: string;
  showBorder?: boolean;
  valueColor?: string;
}

export function InfoRow({ label, value, showBorder = true, valueColor }: InfoRowProps) {
  return (
    <div
      className="flex justify-between items-center"
      style={{
        padding: "8px 0",
        borderBottom: showBorder ? `1px solid ${colors.glassDividerLight}` : "none",
      }}
    >
      <span style={{ fontSize: "12px", color: colors.textTertiary }}>{label}</span>
      <span
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: valueColor ?? colors.textPrimary,
          fontFamily: fonts.label,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── GradientBar ────────────────────────────────────────────
export function GradientBar({ height = 4 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: `linear-gradient(90deg, ${colors.success}, ${colors.primary})`,
        borderRadius: `${radii["3xl"]} ${radii["3xl"]} 0 0`,
      }}
    />
  );
}

// ── PageTransition ─────────────────────────────────────────
const pageVariants = {
  initial: (d: number) => ({ opacity: 0, x: d * 40, scale: 0.99 }),
  enter: { opacity: 1, x: 0, scale: 1 },
  exit: (d: number) => ({ opacity: 0, x: d * -40, scale: 0.99 }),
};

const pageTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

interface PageTransitionProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate" | "exit" | "transition"> {
  direction: number;
  children: ReactNode;
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  function PageTransition({ direction, children, ...rest }, ref) {
    return (
      <motion.div
        ref={ref}
        custom={direction}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={pageTransition}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);
