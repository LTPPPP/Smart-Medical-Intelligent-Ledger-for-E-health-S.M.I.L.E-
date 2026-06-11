"use client";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "bordered";
  padding?: "sm" | "md" | "lg";
}

export function GlassCard({ children, className = "", variant = "default", padding = "md" }: GlassCardProps) {
  const variantStyles = {
    default: "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px]",
    subtle: "bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px]",
    bordered: "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[10px]",
  };
  const paddingStyles = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  return (
    <div className={`rounded-[12px] ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}
