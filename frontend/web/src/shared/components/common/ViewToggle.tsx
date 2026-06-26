'use client';

import { Icon } from '@iconify/react';

export type ViewMode = 'list' | 'calendar';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; icon: string; label: string }[] = [
  { value: 'list', icon: 'lucide:list', label: 'List' },
  { value: 'calendar', icon: 'lucide:calendar-days', label: 'Calendar' },
];

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border p-1 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-inter text-xs font-semibold transition ${
              active
                ? 'bg-smile-primary text-white shadow-[0_2px_8px_rgba(65,126,170,0.35)]'
                : 'text-smile-description hover:text-smile-primary'
            }`}
          >
            <Icon icon={opt.icon} width={14} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default ViewToggle;
