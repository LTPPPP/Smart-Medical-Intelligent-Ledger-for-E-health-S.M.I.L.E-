"use client";

interface StatusBadgeProps {
  label: string;
  variant?: "teal" | "blue" | "amber" | "inactive" | "gray";
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ label, variant = "gray", dot = false, className = "" }: StatusBadgeProps) {
  const variants = {
    teal: "bg-[rgba(69,240,207,0.1)] border-[rgba(69,240,207,0.2)] text-[#45F0CF]",
    blue: "bg-[rgba(146,205,253,0.1)] border-[rgba(146,205,253,0.2)] text-[#92CDFD]",
    amber: "bg-[rgba(247,188,104,0.15)] border-[rgba(247,188,104,0.3)] text-[#F7BC68]",
    inactive: "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#C1C7CF]",
    gray: "bg-[rgba(50,53,56,0.5)] border-[rgba(139,145,153,0.2)] text-[#8B9199]",
  };
  const dotColors = {
    teal: "bg-[#45F0CF]",
    blue: "bg-[#92CDFD]",
    amber: "bg-[#F7BC68]",
    inactive: "bg-[#C1C7CF]",
    gray: "bg-[#8B9199]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {label}
    </span>
  );
}

interface TagBadgeProps {
  label: string;
  variant?: "default" | "warning";
  icon?: boolean;
  className?: string;
}

export function TagBadge({ label, variant = "default", icon = false, className = "" }: TagBadgeProps) {
  const variants = {
    default: "bg-[#323538] border-[rgba(255,255,255,0.1)] text-[#C1C7CF]",
    warning: "bg-[rgba(247,188,104,0.1)] border-[rgba(247,188,104,0.3)] text-[#F7BC68]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {icon && <svg className="w-2.5 h-2.5" viewBox="0 0 13 12" fill="currentColor"><path d="M6.5 0C3.186 0 .5 2.686.5 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 1.5c2.485 0 4.5 2.015 4.5 4.5S8.985 10.5 6.5 10.5 2 8.985 2 6.5 4.015 2 6.5 2zm-.5 2v3h1V4H6zm0 4v1h1V8H6z"/></svg>}
      {label}
    </span>
  );
}
