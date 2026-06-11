"use client";

interface InfoBannerProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function InfoBanner({ icon, title, description, className = "" }: InfoBannerProps) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-[12px] bg-[rgba(146,205,253,0.05)] border border-[rgba(146,205,253,0.2)] shadow-[0px_4px_24px_rgba(0,0,0,0.1)] backdrop-blur-[10px] ${className}`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(146,205,253,0.1)] shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[#92CDFD]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</span>
        <p className="text-sm text-[#C1C7CF] leading-5">{description}</p>
      </div>
    </div>
  );
}
